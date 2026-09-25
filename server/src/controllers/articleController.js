import { Article, STATUSES } from '../models/Article.js';
import { Category } from '../models/Category.js';
import { Comment } from '../models/Comment.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/HttpError.js';
import { langOf } from '../utils/i18n.js';
import { localizeArticle, localizeCategory, withLocalCategory } from '../utils/localize.js';

const CATEGORY_FIELDS = 'name nameEn slug color';
const withCategory = { path: 'category', select: CATEGORY_FIELDS };
const SPOTLIGHT_CATEGORY = 'lifestyle';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const asString = (v) => (typeof v === 'string' ? v.trim() : '');
const clampInt = (v, fallback, min, max) => Math.min(max, Math.max(min, parseInt(v, 10) || fallback));

/** Published articles without the (large) body, newest first unless told otherwise. */
const published = (extra = {}, limit = 10, sort = { publishedAt: -1 }) =>
  Article.find({ status: 'published', ...extra })
    .select('-body -en.body')
    .populate(withCategory)
    .sort(sort)
    .limit(limit)
    .lean();

function searchClause(q) {
  const text = asString(q).slice(0, 80);
  if (!text) return null;
  const rx = new RegExp(escapeRegex(text), 'i');
  // Matches either language, whichever the UI is currently showing.
  return [{ title: rx }, { summary: rx }, { tags: rx }, { authorName: rx }, { 'en.title': rx }, { 'en.summary': rx }, { 'en.tags': rx }];
}

// ───────────── public ─────────────

export async function listArticles(req, res) {
  const lang = langOf(req);
  const page = clampInt(req.query.page, 1, 1, 1000);
  const limit = clampInt(req.query.limit, 12, 1, 50);
  const filter = { status: 'published' };

  const categorySlug = asString(req.query.category);
  if (categorySlug) {
    const category = await Category.findOne({ slug: categorySlug }).select('_id').lean();
    if (!category) return res.json({ items: [], page, pages: 0, total: 0 });
    filter.category = category._id;
  }
  const or = searchClause(req.query.q);
  if (or) filter.$or = or;
  if (req.query.breaking === 'true') filter.isBreaking = true;

  const sort = req.query.sort === 'popular' ? { views: -1, publishedAt: -1 } : { publishedAt: -1 };
  const [items, total] = await Promise.all([
    Article.find(filter)
      .select('-body -en.body')
      .populate(withCategory)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Article.countDocuments(filter),
  ]);
  res.json({ items: items.map((a) => localizeArticle(a, lang)), page, pages: Math.ceil(total / limit), total });
}

/** Everything the homepage needs in a single round-trip. */
export async function homeFeed(req, res) {
  const lang = langOf(req);
  const loc = (a) => localizeArticle(a, lang);
  const [hero] = await published({ isFeatured: true }, 1).then((r) => (r.length ? r : published({}, 1)));
  if (!hero) {
    return res.json({ hero: null, side: [], latest: [], trending: [], breaking: [], sections: [], spotlight: null });
  }

  const side = await published({ _id: { $ne: hero._id } }, 2);
  const shown = [hero._id, ...side.map((a) => a._id)];
  const categories = await Category.find().sort({ order: 1 }).lean();

  const [latest, trending, breaking, sectionItems, spotlightCategory] = await Promise.all([
    published({ _id: { $nin: shown } }, 6),
    published({}, 5, { views: -1, publishedAt: -1 }),
    published({ isBreaking: true }, 8),
    Promise.all(
      categories
        .filter((c) => c.slug !== SPOTLIGHT_CATEGORY)
        .map(async (category) => ({ category, items: await published({ category: category._id, _id: { $nin: shown } }, 4) }))
    ),
    categories.find((c) => c.slug === SPOTLIGHT_CATEGORY),
  ]);

  const [spotlight = null] = spotlightCategory ? await published({ category: spotlightCategory._id }, 1) : [];
  const sections = sectionItems.filter((s) => s.items.length).slice(0, 4);

  res.json({
    hero: loc(hero),
    side: side.map(loc),
    latest: latest.map(loc),
    trending: trending.map(loc),
    breaking: breaking.map(loc),
    sections: sections.map(({ category, items }) => ({ category: localizeCategory(category, lang), items: items.map(loc) })),
    spotlight: spotlight && loc(spotlight),
  });
}

export async function getArticle(req, res) {
  const filter = { slug: asString(req.params.slug) };
  if (!['admin', 'editor'].includes(req.user?.role)) filter.status = 'published';

  const article = await Article.findOneAndUpdate(filter, { $inc: { views: 1 } }, { new: true })
    .populate(withCategory)
    .lean();
  if (!article) throw new HttpError(404, 'खबर नहीं मिली');

  const lang = langOf(req);
  const related = await published({ category: article.category._id, _id: { $ne: article._id } }, 4);
  res.json({ article: localizeArticle(article, lang), related: related.map((a) => localizeArticle(a, lang)) });
}

// ───────────── editorial (editor / admin) ─────────────

const EDITABLE = ['title', 'summary', 'body', 'image', 'imageAlt', 'category', 'authorName', 'tags', 'isBreaking', 'isFeatured', 'status'];

const normalizeTags = (value) => {
  const list = typeof value === 'string' ? value.split(',') : Array.isArray(value) ? value : [];
  return [...new Set(list.map((t) => String(t).trim()).filter(Boolean))];
};

function editableFields(body = {}) {
  const data = Object.fromEntries(EDITABLE.filter((k) => k in body).map((k) => [k, body[k]]));
  if ('tags' in data) data.tags = normalizeTags(data.tags);
  if (body.en && typeof body.en === 'object') {
    const { title, summary, body: text, imageAlt, tags } = body.en;
    data.en = {
      title: asString(title),
      summary: asString(summary),
      body: asString(text),
      imageAlt: asString(imageAlt),
      tags: normalizeTags(tags),
    };
  }
  if (data.status !== undefined && !STATUSES.includes(data.status)) {
    throw new HttpError(400, 'अमान्य स्थिति');
  }
  return data;
}

async function assertCategory(id) {
  if (id !== undefined && !(await Category.exists({ _id: id }))) {
    throw new HttpError(400, 'चुनी गई श्रेणी मौजूद नहीं है');
  }
}

export async function adminList(req, res) {
  const lang = langOf(req);
  const page = clampInt(req.query.page, 1, 1, 1000);
  const limit = clampInt(req.query.limit, 10, 1, 50);
  const filter = {};
  if (STATUSES.includes(req.query.status)) filter.status = req.query.status;
  const q = asString(req.query.q).slice(0, 80);
  if (q) filter.title = new RegExp(escapeRegex(q), 'i');

  const [items, total] = await Promise.all([
    Article.find(filter)
      .select('-body -en.body')
      .populate(withCategory)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Article.countDocuments(filter),
  ]);
  res.json({ items: items.map((a) => withLocalCategory(a, lang)), page, pages: Math.ceil(total / limit), total });
}

export async function adminStats(_req, res) {
  const [byStatus, views, users] = await Promise.all([
    Article.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Article.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
    User.countDocuments(),
  ]);
  const count = (s) => byStatus.find((x) => x._id === s)?.count ?? 0;
  res.json({
    published: count('published'),
    drafts: count('draft'),
    total: count('published') + count('draft'),
    views: views[0]?.total ?? 0,
    users,
  });
}

export async function adminGet(req, res) {
  const article = await Article.findById(req.params.id).lean();
  if (!article) throw new HttpError(404, 'खबर नहीं मिली');
  res.json({ article });
}

export async function createArticle(req, res) {
  const data = editableFields(req.body);
  await assertCategory(data.category);
  const article = await Article.create({ ...data, author: req.user._id });
  await article.populate(withCategory);
  res.status(201).json({ article });
}

export async function updateArticle(req, res) {
  const article = await Article.findById(req.params.id);
  if (!article) throw new HttpError(404, 'खबर नहीं मिली');
  const data = editableFields(req.body);
  await assertCategory(data.category);
  article.set(data);
  await article.save();
  await article.populate(withCategory);
  res.json({ article });
}

export async function deleteArticle(req, res) {
  const article = await Article.findByIdAndDelete(req.params.id);
  if (!article) throw new HttpError(404, 'खबर नहीं मिली');
  await Promise.all([
    Comment.deleteMany({ article: article._id }),
    User.updateMany({ bookmarks: article._id }, { $pull: { bookmarks: article._id } }),
  ]);
  res.status(204).end();
}
