import { connectDB, disconnectDB } from '../config/db.js';
import { Category } from '../models/Category.js';
import { categories } from './data.js';
import { categoryNamesEn } from './data.en.js';
import { ensureAdmin } from './index.js';

// Safe to run any number of times: creates the admin and the category list if missing, deletes nothing.
await connectDB();

const ops = categories.map(({ slug, ...rest }) => ({
  updateOne: { filter: { slug }, update: { $setOnInsert: { slug, ...rest, nameEn: categoryNamesEn[slug] } }, upsert: true },
}));
const { upsertedCount } = await Category.bulkWrite(ops);
console.log(`Categories: ${upsertedCount} added, ${categories.length - upsertedCount} already there.`);

const { created } = await ensureAdmin();
if (!created) console.log('Admin account already exists (password unchanged).');

await disconnectDB();
