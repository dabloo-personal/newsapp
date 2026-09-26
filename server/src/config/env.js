import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

const isProd = process.env.NODE_ENV === 'production';

const required = (name) => {
  const value = (process.env[name] || '').trim();
  if (!value) {
    // A one-line message beats a stack trace for a missing setting.
    console.error(`Configuration error: ${name} is not set. Add it to server/.env (or your host's environment variables).`);
    process.exit(1);
  }
  return value;
};

const mongoUri = required('MONGODB_URI');
if (/<[^>]*password[^>]*>/i.test(mongoUri)) {
  console.error('Configuration error: MONGODB_URI still contains the <db_password> placeholder. Replace it with your real database password.');
  process.exit(1);
}
// Weak-password conveniences are only ever allowed against a database on this machine.
const isLocalDb = /^mongodb:\/\/([^@/]*@)?(127\.0\.0\.1|localhost|\[::1\])[:/]/i.test(mongoUri);

const envFlag = (name) => ['1', 'true', 'yes'].includes((process.env[name] ?? '').trim().toLowerCase());

export const env = {
  isProd,
  port: Number(process.env.PORT) || 5001,
  mongoUri,
  jwtSecret: isProd ? required('JWT_SECRET') : process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  /** Sites allowed to call the API from a browser (comma-separated), e.g. your Netlify URL. Same-origin needs nothing. */
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean),
  /** Seed the fictional sample stories when the database has no categories. Off unless you ask for it. */
  autoSeed: envFlag('AUTO_SEED'),
  adminEmail: process.env.ADMIN_EMAIL || 'admin@navbharat.local',
  // In production there is no default password: setup/seed generates a random one and prints it once.
  // Only a local development database gets a default; anything else generates a random one.
  adminPassword: process.env.ADMIN_PASSWORD || (!isProd && isLocalDb ? 'Admin@12345' : ''),
  /**
   * LOCAL DEVELOPMENT ONLY: lets you log in with the ID "admin" and a short password. It must be switched on
   * explicitly and is ignored in production and for any non-local database, so it can never open a live site.
   */
  simpleAdmin: !isProd && isLocalDb && envFlag('DEV_SIMPLE_ADMIN'),
};
