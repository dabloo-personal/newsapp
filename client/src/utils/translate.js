/**
 * Translates Hindi text to English using Google GTX free translation endpoint
 * with fallback to MyMemory Translate API.
 */
export async function translateHiToEn(text) {
  if (!text || !text.trim()) return '';

  const cleanText = text.trim();

  // Try Google GTX endpoint first
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
    console.warn('Google GTX translate failed, trying fallback:', err);
  }

  // Fallback to MyMemory
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
