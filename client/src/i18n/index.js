import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { formatCount, formatDate, formatToday, timeAgo } from '../utils/time';
import EN from './en';
import { getLang } from './lang';

/*
 * Hindi is the source language: `t('होम')` returns the Hindi text as-is, and looks it up in en.js for English.
 * `npm run i18n:check -w client` fails if a literal passed to t() / msgid() has no English entry, or if
 * Devanagari text is left outside them.
 */

const warned = new Set();

export function translateFor(lang, text, vars) {
  let out = text;
  if (lang === 'en') {
    out = EN[text];
    if (out === undefined) {
      if (import.meta.env.DEV && !warned.has(text)) {
        warned.add(text);
        console.warn(`[i18n] missing English text for "${text}"`);
      }
      out = text;
    }
  }
  return vars ? out.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match)) : out;
}

/** For code outside React (API client). Components should use useI18n() so they re-render on change. */
export const translate = (text, vars) => translateFor(getLang(), text, vars);

/** Marks a string as translatable without translating it yet (constants defined at module level). */
export const msgid = (text) => text;

export function useI18n() {
  const lang = useSelector((s) => s.ui.lang);
  return useMemo(
    () => ({
      lang,
      t: (text, vars) => translateFor(lang, text, vars),
      timeAgo: (value) => timeAgo(value, lang),
      formatDate: (value) => formatDate(value, lang),
      formatToday: () => formatToday(lang),
      formatCount: (n) => formatCount(n, lang),
    }),
    [lang]
  );
}
