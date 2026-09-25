// i18n-ignore-file: this module formats text per language on purpose.
const LOCALE = { hi: 'hi-IN', en: 'en-IN' };

/** "5 मिनट पहले" / "5 minutes ago"; falls back to a date after a week. */
export function timeAgo(value, lang = 'hi') {
  if (!value) return '';
  const date = new Date(value);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 45) return lang === 'en' ? 'just now' : 'अभी';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return lang === 'en' ? `${minutes} min ago` : `${minutes} मिनट पहले`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return lang === 'en' ? `${hours} hour${hours === 1 ? '' : 's'} ago` : `${hours} ${hours === 1 ? 'घंटा' : 'घंटे'} पहले`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) return lang === 'en' ? `${days} day${days === 1 ? '' : 's'} ago` : `${days} दिन पहले`;
  return formatDate(date, lang);
}

export const formatDate = (value, lang = 'hi') =>
  new Date(value).toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric' });

export const formatToday = (lang = 'hi') =>
  new Date().toLocaleDateString(LOCALE[lang], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const compact = {
  hi: new Intl.NumberFormat('hi-IN', { notation: 'compact', maximumFractionDigits: 1 }),
  en: new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }),
};
export const formatCount = (n, lang = 'hi') => compact[lang].format(n ?? 0);
