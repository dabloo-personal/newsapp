import { Category } from '../models/Category.js';
import { langOf } from '../utils/i18n.js';
import { localizeCategory } from '../utils/localize.js';

export async function listCategories(req, res) {
  const lang = langOf(req);
  const items = await Category.find().sort({ order: 1 }).select('name nameEn slug color order').lean();
  res.json({ items: items.map((c) => localizeCategory(c, lang)) });
}
