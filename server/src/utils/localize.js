// Hindi is the base language (top-level fields). English lives in `article.en` / `category.nameEn`
// and is optional: anything without an English version falls back to Hindi.

const DEFAULT_AUTHOR_HI = 'नवभारत डेस्क';
const DEFAULT_AUTHOR_EN = 'Navbharat Desk';

export function localizeCategory(category, lang) {
  if (!category?.slug) return category; // not populated
  const { nameEn, ...rest } = category;
  return lang === 'en' && nameEn ? { ...rest, name: nameEn } : rest;
}

/** Public shape of an article for the requested language. `translated` tells the UI whether the text is in that language. */
export function localizeArticle(article, lang) {
  if (!article) return article;
  const { en, ...out } = article;
  out.category = localizeCategory(article.category, lang);
  out.translated = lang === 'hi' || Boolean(en?.title);

  if (lang === 'en') {
    if (en?.title) {
      out.title = en.title;
      out.summary = en.summary || out.summary;
      if (en.body || out.body) out.body = en.body || out.body;
      out.imageAlt = en.imageAlt || en.title;
      if (en.tags?.length) out.tags = en.tags;
    }
    if (out.authorName === DEFAULT_AUTHOR_HI) out.authorName = DEFAULT_AUTHOR_EN;
  }
  return out;
}

/** For the editorial panel: keep every field as stored, only localise the category label. */
export const withLocalCategory = (article, lang) => ({ ...article, category: localizeCategory(article.category, lang) });
