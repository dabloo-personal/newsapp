import { connectDB, disconnectDB } from '../config/db.js';
import { Article } from '../models/Article.js';
import { runSeed } from './index.js';

await connectDB();

// This REPLACES all articles, categories and comments with fictional samples — never do it to a live site by accident.
const existing = await Article.estimatedDocumentCount();
if (existing > 0 && !process.argv.includes('--force')) {
  console.error(
    `Refusing to seed: the database already has ${existing} articles and seeding would delete them.\n` +
      'If you really want to replace everything with sample content, run: npm run seed -w server -- --force'
  );
  await disconnectDB();
  process.exit(1);
}

const { categories, articles } = await runSeed();
console.log(`Seeded ${categories} categories and ${articles} sample articles.`);
await disconnectDB();
