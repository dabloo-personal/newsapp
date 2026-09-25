import { Article } from '../models/Article.js';
import { Comment } from '../models/Comment.js';
import { HttpError } from '../utils/HttpError.js';

export async function listComments(req, res) {
  const items = await Comment.find({ article: req.params.articleId })
    .sort({ createdAt: -1 })
    .limit(100)
    .select('user userName text createdAt')
    .lean();
  res.json({ items });
}

export async function addComment(req, res) {
  if (!(await Article.exists({ _id: req.params.articleId, status: 'published' }))) {
    throw new HttpError(404, 'खबर नहीं मिली');
  }
  const text = typeof req.body?.text === 'string' ? req.body.text : '';
  const comment = await Comment.create({
    article: req.params.articleId,
    user: req.user._id,
    userName: req.user.name,
    text,
  });
  res.status(201).json({
    comment: { _id: comment._id, user: comment.user, userName: comment.userName, text: comment.text, createdAt: comment.createdAt },
  });
}

export async function deleteComment(req, res) {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new HttpError(404, 'टिप्पणी नहीं मिली');
  const isOwner = comment.user.equals(req.user._id);
  if (!isOwner && !['admin', 'editor'].includes(req.user.role)) {
    throw new HttpError(403, 'आप यह टिप्पणी नहीं हटा सकते');
  }
  await comment.deleteOne();
  res.status(204).end();
}
