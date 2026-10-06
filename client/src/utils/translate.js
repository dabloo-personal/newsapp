import { api } from '../api/client';

/**
 * Ultra-fast CORS-proof JSONP Google Translate directly inside the browser.
 * Bypasses CORS blocking, server sleep delays, and network restrictions on any live domain.
 */
function translateViaJsonp(text, from = 'hi', to = 'en') {
  return new Promise((resolve) => {
    if (!text || !text.trim()) return resolve('');
    const cleanText = text.trim();
    const callbackName = 'gtCallback_' + Math.random().toString(36).substring(2, 9);

    const script = document.createElement('script');
    const timer = setTimeout(() => {
      cleanup();
      resolve('');
    }, 4000);

    function cleanup() {
      clearTimeout(timer);
      try {
        delete window[callbackName];
      } catch {
        window[callbackName] = undefined;
      }
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[callbackName] = (data) => {
      cleanup();
      if (Array.isArray(data?.[0])) {
        const translatedLines = data[0]
          .filter((item) => Array.isArray(item) && typeof item[0] === 'string')
          .map((item) => item[0])
          .join('');
        if (translatedLines && translatedLines.trim() && translatedLines.trim() !== cleanText) {
          return resolve(translatedLines.trim());
        }
      }
      resolve('');
    };

    script.onerror = () => {
      cleanup();
      resolve('');
    };

    script.src = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(cleanText)}&callback=${callbackName}`;
    document.body.appendChild(script);
  });
}

/**
 * Translates Hindi text to English.
 * Order: 1. Instant JSONP Browser Translate -> 2. Backend Proxy API (/api/translate) -> 3. MyMemory
 */
export async function translateHiToEn(text) {
  if (!text || !text.trim()) return '';
  const cleanText = text.trim();

  // 1. Try instant JSONP script translate in browser (CORS-immune, works 100% on live sites)
  try {
    const jsonpResult = await translateViaJsonp(cleanText, 'hi', 'en');
    if (jsonpResult) return jsonpResult;
  } catch (err) {
    console.warn('JSONP translate failed, trying backend API:', err);
  }

  // 2. Try backend proxy API
  try {
    const data = await api('/translate', {
      method: 'POST',
      body: { text: cleanText, from: 'hi', to: 'en' },
    });
    if (data?.text && data.text !== cleanText) return data.text;
  } catch (err) {
    console.warn('Backend translate API failed, trying MyMemory fallback:', err);
  }

  // 3. Fallback to MyMemory
  try {
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=hi|en&de=admin@navbharat.local`;
    const res = await fetch(myMemoryUrl);
    if (res.ok) {
      const data = await res.json();
      const translatedText = data?.responseData?.translatedText?.trim();
      if (translatedText && translatedText !== cleanText && !data?.responseDetails?.includes('MYMEMORY WARNING')) {
        return translatedText;
      }
    }
  } catch (err) {
    console.error('MyMemory translate failed:', err);
  }

  return '';
}

export async function translateArticleBatch(fields) {
  if (!fields || typeof fields !== 'object') return null;

  // Try backend batch endpoint first
  try {
    const data = await api('/translate', {
      method: 'POST',
      body: { fields, from: 'hi', to: 'en' },
    });
    if (data?.translated) return data.translated;
  } catch (err) {
    console.warn('Batch translate API failed, using client-side parallel translation:', err);
  }

  // Fallback to client-side parallel JSONP/fetch calls for all fields
  try {
    const keys = Object.keys(fields);
    const results = await Promise.all(keys.map((k) => translateHiToEn(fields[k])));
    const translated = {};
    keys.forEach((k, idx) => {
      translated[k] = results[idx] || '';
    });
    return translated;
  } catch {
    return null;
  }
}
