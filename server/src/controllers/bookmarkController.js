import { Article } from '../models/Article.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/HttpError.js';
import { langOf } from '../utils/i18n.js';
import { localizeArticle } from '../utils/localize.js';

export async function listBookmarks(req, res) {
  const user = await User.findById(req.user._id)
    .populate({
      path: 'bookmarks',
      match: { status: 'published' },
      select: '-body -en.body',
      populate: { path: 'category', select: 'name nameEn slug color' },
    })
    .lean();
  // Most recently saved first.
  const lang = langOf(req);
  res.json({ items: [...user.bookmarks].reverse().map((a) => localizeArticle(a, lang)) });
}

export async function toggleBookmark(req, res) {
  const { articleId } = req.params;
  if (!(await Article.exists({ _id: articleId }))) throw new HttpError(404, 'खबर नहीं मिली');

  const already = req.user.bookmarks.some((id) => id.equals(articleId));
  const user = await User.findByIdAndUpdate(
    req.user._id,
    already ? { $pull: { bookmarks: articleId } } : { $addToSet: { bookmarks: articleId } },
    { new: true }
  ).lean();
  res.json({ bookmarked: !already, ids: user.bookmarks.map(String) });
}
