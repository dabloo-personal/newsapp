export const LANGS = ['hi', 'en'];
const KEY = 'nb_lang';

function read() {
  try {
    const stored = localStorage.getItem(KEY);
    if (LANGS.includes(stored)) return stored;
  } catch {
    /* storage unavailable */
  }
  return 'hi';
}

let current = read();
document.documentElement.lang = current;

/** Plain getter so non-React code (the API client) can read the active language. */
export const getLang = () => current;

export function setLang(lang) {
  current = lang;
  document.documentElement.lang = lang;
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* ignore */
  }
}
