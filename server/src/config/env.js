import dotenv from 'dotenv';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

const isProd = process.env.NODE_ENV === 'production';
const mongoUri = (process.env.MONGODB_URI || '').trim();

// Without a real MongoDB the app runs an embedded one ("demo mode") — see config/db.js.
// A secret generated per process is fine there (data and sessions reset together on restart),
// but a real database in production must have a stable, explicitly configured secret.
if (isProd && mongoUri && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production when MONGODB_URI is configured');
}

const envFlag = (name) => {
  const v = (process.env[name] ?? '').trim().toLowerCase();
  return v === '' ? undefined : ['1', 'true', 'yes'].includes(v);
};

export const env = {
  isProd,
  port: Number(process.env.PORT) || 5001,
  /** Empty string → embedded MongoDB. */
  mongoUri,
  /** Where the embedded MongoDB keeps its files. Unset = temporary (wiped on restart); set it to a persistent disk to keep data. */
  embeddedDbPath: (process.env.EMBEDDED_DB_PATH || '').trim(),
  /** Seed sample content when the database has no categories. Default: on for the embedded DB, off for a real one. */
  autoSeed: envFlag('AUTO_SEED') ?? !mongoUri,
  jwtSecret: process.env.JWT_SECRET || (isProd ? crypto.randomBytes(32).toString('hex') : 'dev-only-secret-change-me'),
  jwtSecretGenerated: !process.env.JWT_SECRET && isProd,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  /** Sites allowed to call the API from a browser (comma-separated), e.g. your Netlify URL. Same-origin needs nothing. */
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean),
  adminEmail: process.env.ADMIN_EMAIL || 'admin@navbharat.local',
  // In production there is no default password: seeding generates a random one and prints it once.
  adminPassword: process.env.ADMIN_PASSWORD || (isProd ? '' : 'Admin@12345'),
};
