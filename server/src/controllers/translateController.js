export async function translateText(req, res) {
  const { text, from = 'hi', to = 'en' } = req.body || {};

  if (!text || !text.trim()) {
    return res.json({ text: '' });
  }

  const cleanText = text.trim();

  // 1. Try Google GTX endpoint server-side
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(cleanText)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data?.[0])) {
        const translatedLines = data[0].map((item) => item[0] || '').join('');
        if (translatedLines) {
          return res.json({ text: translatedLines });
        }
      }
    }
  } catch (err) {
    console.warn('Server-side Google GTX translate failed, trying MyMemory fallback:', err.message);
  }

  // 2. Fallback to MyMemory API server-side
  try {
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=${from}|${to}`;
    const response = await fetch(myMemoryUrl);
    if (response.ok) {
      const data = await response.json();
      if (data?.responseData?.translatedText) {
        return res.json({ text: data.responseData.translatedText });
      }
    }
  } catch (err) {
    console.error('Server-side MyMemory translate failed:', err.message);
  }

  return res.json({ text: '' });
}
