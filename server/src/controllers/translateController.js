// Helper for a single chunk of text
async function translateChunk(text, from = 'hi', to = 'en') {
  if (!text || !text.trim()) return '';
  const clean = text.trim();

  // 1. Primary: Google Chrome extension dictionary endpoint (fast, accurate, datacenter-safe)
  try {
    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${from}&tl=${to}&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });
    if (res.ok) {
      const data = await res.json();
      const result = Array.isArray(data) ? data[0] : typeof data === 'string' ? data : null;
      if (result && typeof result === 'string' && result.trim() && result.trim() !== clean) {
        return result.trim();
      }
    }
  } catch (err) {
    console.warn('Google dict-chrome-ex failed:', err.message);
  }

  // 2. Secondary: Google GTX single endpoint
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.[0])) {
        const lines = data[0]
          .filter((item) => Array.isArray(item) && typeof item[0] === 'string')
          .map((item) => item[0]);
        const result = lines.join('').trim();
        if (result && result !== clean) return result;
      }
    }
  } catch (err) {
    console.warn('Google GTX failed:', err.message);
  }

  // 3. Tertiary: MyMemory API with registered email parameter
  try {
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=${from}|${to}&de=admin@navbharat.local`;
    const res = await fetch(myMemoryUrl);
    if (res.ok) {
      const data = await res.json();
      const translatedText = data?.responseData?.translatedText?.trim();
      if (translatedText && translatedText !== clean && !data?.responseDetails?.includes('MYMEMORY WARNING')) {
        return translatedText;
      }
    }
  } catch (err) {
    console.warn('MyMemory failed:', err.message);
  }

  return '';
}

// Handles long text by splitting by paragraph/line breaks without falling back to original Hindi text
async function translateFullText(text, from = 'hi', to = 'en') {
  if (!text || !text.trim()) return '';

  if (text.length <= 800) {
    return await translateChunk(text, from, to);
  }

  // Split by paragraph / line breaks (\n+)
  const paragraphs = text.split(/(\n+)/);
  const translatedParts = [];

  for (const part of paragraphs) {
    if (!part.trim()) {
      translatedParts.push(part); // preserve blank newlines
    } else {
      const translated = await translateChunk(part, from, to);
      translatedParts.push(translated); // NEVER fall back to original Hindi text 'part'
    }
  }

  const finalResult = translatedParts.join('').trim();
  return finalResult;
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
