// Runs at build time so the embedded MongoDB binary ships with the deployed build instead of
// being downloaded on every cold start. Failure is not fatal: the server downloads it on demand.
import { fileURLToPath } from 'node:url';

process.env.MONGOMS_DOWNLOAD_DIR ||= fileURLToPath(new URL('../.mongodb-binaries', import.meta.url));

try {
  const { MongoBinary } = await import('mongodb-memory-server-core');
  const path = await MongoBinary.getPath();
  console.log(`Embedded MongoDB ready: ${path}`);
} catch (err) {
  console.warn(`Skipping embedded MongoDB download (${err.message}). It will be fetched on first start instead.`);
}
