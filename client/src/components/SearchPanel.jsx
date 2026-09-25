import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { clearSuggestions, fetchSuggestions } from '../features/articles/articlesSlice';
import { closeSearch } from '../features/ui/uiSlice';
import { msgid, useI18n } from '../i18n';

const POPULAR = [msgid('मौसम'), msgid('क्रिकेट'), msgid('बाज़ार'), msgid('शिक्षा')];
const MIN_CHARS = 2;

export default function SearchPanel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, timeAgo } = useI18n();
  const open = useSelector((s) => s.ui.searchOpen);
  const { items, status } = useSelector((s) => s.articles.suggestions);
  const [q, setQ] = useState('');
  const inputRef = useRef(null);
  const term = q.trim();

  const close = () => dispatch(closeSearch());

  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    const onKey = (e) => e.key === 'Escape' && dispatch(closeSearch());
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, dispatch]);

  // Debounced search-as-you-type
  useEffect(() => {
    if (term.length < MIN_CHARS) {
      dispatch(clearSuggestions());
      return undefined;
    }
    const timer = setTimeout(() => dispatch(fetchSuggestions(term)), 250);
    return () => clearTimeout(timer);
  }, [term, dispatch]);

  const go = (value) => {
    const query = value.trim();
    if (!query) return;
    close();
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className={`search-panel ${open ? 'open' : ''}`} aria-hidden={!open} role="dialog" aria-label={t('खोज')}>
      <button type="button" className="close-search" aria-label={t('खोज बंद करें')} onClick={close}>
        ×
      </button>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
      >
        <label htmlFor="search-input">{t('क्या खोज रहे हैं?')}</label>
        <div className="search-field">
          <input
            id="search-input"
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('खबर, विषय या शहर खोजें')}
            autoComplete="off"
            tabIndex={open ? 0 : -1}
          />
          <button type="submit" className="search-go" aria-label={t('खोजें')} tabIndex={open ? 0 : -1}>
            ⌕
          </button>
        </div>
      </form>

      {term.length >= MIN_CHARS ? (
        <ul className="suggest-list">
          {items.map((a) => (
            <li key={a._id}>
              <Link to={`/article/${a.slug}`} onClick={close}>
                {a.title}
              </Link>
              <small>
                {a.category?.name} • {timeAgo(a.publishedAt)}
              </small>
            </li>
          ))}
          {status === 'ready' && !items.length && <li className="suggest-empty">{t('“{term}” के लिए कोई खबर नहीं मिली', { term })}</li>}
          {items.length > 0 && (
            <li>
              <button type="button" className="suggest-all" onClick={() => go(q)}>
                {t('“{term}” के सभी परिणाम देखें →', { term })}
              </button>
            </li>
          )}
        </ul>
      ) : (
        <p>
          {t('लोकप्रिय:')}
          {POPULAR.map((word) => (
            <button type="button" key={word} onClick={() => go(t(word))}>
              {t(word)}
            </button>
          ))}
        </p>
      )}
    </div>
  );
}
