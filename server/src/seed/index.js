import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { Article } from '../models/Article.js';
import { Category } from '../models/Category.js';
import { Comment } from '../models/Comment.js';
import { User } from '../models/User.js';
import { categories, articles } from './data.js';
import { articlesEn, categoryNamesEn } from './data.en.js';

export async function ensureAdmin() {
  const existing = await User.findOne({ email: env.adminEmail });
  if (existing) return { admin: existing, created: false };

  const password = env.adminPassword || crypto.randomBytes(9).toString('base64url');
  // Only the opt-in local shortcut may skip the 8-character password rule.
  const admin = new User({ name: 'Admin', email: env.adminEmail, password, role: 'admin' });
  await admin.save({ validateBeforeSave: !env.simpleAdmin });
  // Printed only when we invented the password, so it isn't lost.
  console.log(`Admin created: ${env.adminEmail}${env.adminPassword ? '' : `  password: ${password}  (set ADMIN_PASSWORD to choose your own)`}`);
  return { admin, created: true };
}

/** Replaces all content (articles, categories, comments) with the sample set. Users are kept. */
export async function runSeed() {
  await Promise.all([Article.deleteMany(), Category.deleteMany(), Comment.deleteMany()]);
  await User.updateMany({}, { $set: { bookmarks: [] } }); // saved ids would dangle

  const createdCategories = await Category.insertMany(categories.map((c) => ({ ...c, nameEn: categoryNamesEn[c.slug] })));
  const categoryId = Object.fromEntries(createdCategories.map((c) => [c.slug, c._id]));
  const { admin } = await ensureAdmin();

  const now = Date.now();
  let views = 4200;
  // create() (not insertMany) so the slug / readingTime hooks run.
  for (const { minsAgo, category, ...rest } of articles) {
    const en = articlesEn[rest.slug];
    if (!en) throw new Error(`Missing English seed content for "${rest.slug}"`);
    await Article.create({
      ...rest,
      en: { title: en.title, summary: en.summary, body: en.body.join('\n\n'), imageAlt: en.title, tags: en.tags },
      category: categoryId[category],
      author: admin._id,
      publishedAt: new Date(now - minsAgo * 60_000),
      views: (views = Math.max(120, Math.round(views * 0.82))),
    });
  }
  return { categories: createdCategories.length, articles: articles.length };
}

/** Seeds only a database that has no categories yet (safe to call on every start). */
export async function seedIfEmpty() {
  if (await Category.estimatedDocumentCount()) return null;
  const result = await runSeed();
  console.log(`Seeded ${result.categories} categories and ${result.articles} sample articles.`);
  return result;
}
