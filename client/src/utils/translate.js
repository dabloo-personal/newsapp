import { api } from '../api/client';

/**
 * Translates Hindi text to English using backend API (/translate)
 * with fallback to client-side Google GTX and MyMemory Translate API.
 */
export async function translateHiToEn(text) {
  if (!text || !text.trim()) return '';

  const cleanText = text.trim();

  // 1. Try backend proxy API first (CORS safe, uses VITE_API_URL on live servers)
  try {
    const data = await api('/translate', {
      method: 'POST',
      body: { text: cleanText, from: 'hi', to: 'en' },
    });
    if (data?.text) return data.text;
  } catch (err) {
    console.warn('Backend translate API failed, trying client-side fallback:', err);
  }

  // 2. Fallback to direct Google GTX endpoint
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=hi&tl=en&dt=t&q=${encodeURIComponent(cleanText)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.[0])) {
        const translatedLines = data[0].map((item) => item[0] || '').join('');
        if (translatedLines) return translatedLines;
      }
    }
  } catch (err) {
    console.warn('Google GTX translate failed, trying MyMemory fallback:', err);
  }

  // 3. Fallback to MyMemory
  try {
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=hi|en`;
    const res = await fetch(myMemoryUrl);
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch (err) {
    console.error('MyMemory translate failed:', err);
  }

  return '';
}
