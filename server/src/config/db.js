import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';

// Keep the embedded MongoDB binary inside the project so a build-time download survives into runtime.
process.env.MONGOMS_DOWNLOAD_DIR ||= fileURLToPath(new URL('../../.mongodb-binaries', import.meta.url));

mongoose.set('strictQuery', true);

let embedded = null;

/** 'mongodb' (your MONGODB_URI) or 'embedded' (in-process demo database). */
export let dbMode = 'mongodb';

async function startEmbedded() {
  let MongoMemoryServer;
  try {
    ({ MongoMemoryServer } = await import('mongodb-memory-server'));
  } catch {
    throw new Error(
      'MONGODB_URI is not set and the embedded database (mongodb-memory-server) is not installed.\n' +
        'Set MONGODB_URI to a MongoDB connection string, or run `npm install` to install the embedded option.'
    );
  }

  const persistent = Boolean(env.embeddedDbPath);
  if (persistent) (await import('node:fs')).mkdirSync(env.embeddedDbPath, { recursive: true });

  embedded = await MongoMemoryServer.create({
    instance: {
      ip: '127.0.0.1',
      ...(persistent ? { dbPath: env.embeddedDbPath, storageEngine: 'wiredTiger' } : {}),
    },
  });
  console.warn(
    persistent
      ? `MONGODB_URI not set: using an embedded MongoDB stored in ${env.embeddedDbPath}`
      : 'MONGODB_URI not set: using a TEMPORARY embedded MongoDB. All data (accounts, comments, saved stories, edits) is lost when the server restarts. Set MONGODB_URI (or EMBEDDED_DB_PATH on a persistent disk) to keep data.'
  );
  return embedded.getUri('navbharat24x7');
}

export async function connectDB() {
  dbMode = env.mongoUri ? 'mongodb' : 'embedded';
  const uri = env.mongoUri || (await startEmbedded());
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log(`MongoDB connected (${dbMode}): ${mongoose.connection.host}/${mongoose.connection.name}`);
}

export async function disconnectDB() {
  await mongoose.disconnect();
  await embedded?.stop();
}
