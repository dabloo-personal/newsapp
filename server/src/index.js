import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';
import { seedIfEmpty } from './seed/index.js';

try {
  await connectDB();
  if (env.autoSeed) await seedIfEmpty();
} catch (err) {
  console.error(`Startup failed: ${err.message}`);
  process.exit(1);
}

if (env.jwtSecretGenerated) {
  console.warn('JWT_SECRET is not set: using a random secret, so logins end when the server restarts.');
}

const server = createApp().listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
