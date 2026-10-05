import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

let mongoMemoryServer = null;

export async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    if (!env.isProd) {
      console.warn(`Local MongoDB server not reachable (${err.message}). Starting in-memory MongoDB for dev...`);
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        const uri = mongoMemoryServer.getUri();
        await mongoose.connect(uri);
        console.log(`In-memory MongoDB connected: ${uri}`);
        return;
      } catch (memErr) {
        console.error(`Failed to start in-memory MongoDB: ${memErr.message}`);
      }
    }
    throw err;
  }
}

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};

export const isDbConnected = () => mongoose.connection.readyState === 1;

