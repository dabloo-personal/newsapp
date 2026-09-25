import { env } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { runSeed } from './index.js';

if (!env.mongoUri) {
  console.error('Set MONGODB_URI first — seeding the temporary embedded database would be pointless.');
  process.exit(1);
}

await connectDB();
const { categories, articles } = await runSeed();
console.log(`Seeded ${categories} categories and ${articles} articles.`);
await disconnectDB();
