import crypto from 'node:crypto';

// Hindi titles have no clean ASCII form, so slugs are `<ascii-hint>-<random>`
// (or `khabar-<random>` when there is no hint). URLs stay short and unique.
export function makeSlug(hint = '') {
  const base = hint
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || 'khabar'}-${crypto.randomBytes(3).toString('hex')}`;
}
