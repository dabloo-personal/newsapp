import { translate } from '../i18n';
import { getLang } from '../i18n/lang';

const BASE = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/+$/, '');
const TOKEN_KEY = 'nb_token';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable (private mode) — session simply won't persist */
  }
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body, params, signal } = {}) {
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  const targetUrl = BASE.startsWith('http') ? BASE + cleanPath : window.location.origin + BASE + cleanPath;
  const url = new URL(targetUrl);
  url.searchParams.set('lang', getLang());
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });

  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(translate('सर्वर से संपर्क नहीं हो पाया। कृपया इंटरनेट जांचें'), 0);
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.message || translate('कुछ गड़बड़ हुई, कृपया दोबारा कोशिश करें'), res.status);
  return data;
}
