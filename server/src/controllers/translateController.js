// Helper for a single chunk of text
async function translateChunk(text, from = 'hi', to = 'en') {
  if (!text || !text.trim()) return '';
  const clean = text.trim();

  // 1. Try Google GTX endpoint server-side
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.[0])) {
        const translatedLines = data[0].map((item) => item[0] || '').join('');
        if (translatedLines) return translatedLines;
      }
    }
  } catch (err) {
    console.warn('Google GTX failed:', err.message);
  }

  // 2. Try MyMemory API with email parameter (gives 50,000 words/day free & bypasses datacenter IP block)
  try {
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=${from}|${to}&de=admin@navbharat.local`;
    const res = await fetch(myMemoryUrl);
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch (err) {
    console.warn('MyMemory failed:', err.message);
  }

  // 3. Try Lingva open-source Google Translate proxy
  try {
    const lingvaUrl = `https://lingva.ml/api/v1/${from}/${to}/${encodeURIComponent(clean)}`;
    const res = await fetch(lingvaUrl);
    if (res.ok) {
      const data = await res.json();
      if (data?.translation) return data.translation;
    }
  } catch (err) {
    console.warn('Lingva failed:', err.message);
  }

  return '';
}

// Handles long text by splitting by paragraph/line breaks to avoid URL length & provider limits
async function translateFullText(text, from = 'hi', to = 'en') {
  if (!text || !text.trim()) return '';

  if (text.length <= 500) {
    return await translateChunk(text, from, to);
  }

  // Split by paragraph / double newlines or linebreaks
  const paragraphs = text.split(/(\n+)/);
  const translatedParts = [];

  for (const part of paragraphs) {
    if (!part.trim()) {
      translatedParts.push(part);
    } else {
      const translated = await translateChunk(part, from, to);
      translatedParts.push(translated || part);
    }
  }

  return translatedParts.join('');
}

export async function translateText(req, res) {
  const { text, fields, from = 'hi', to = 'en' } = req.body || {};

  // Batch payload for whole article (prevents multiple parallel request rate-limiting)
  if (fields && typeof fields === 'object') {
    const keys = Object.keys(fields);
    const translated = {};

    for (const key of keys) {
      const val = fields[key];
      if (val && typeof val === 'string' && val.trim()) {
        translated[key] = await translateFullText(val, from, to);
      } else {
        translated[key] = '';
      }
    }

    return res.json({ success: true, translated });
  }

  // Single text payload
  if (!text || !text.trim()) {
    return res.json({ success: true, text: '' });
  }

  const result = await translateFullText(text, from, to);
  return res.json({ success: true, text: result });
}
