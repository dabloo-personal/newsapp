import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { RowCard } from '../components/Cards';
import { Empty, ErrorBox, Loading } from '../components/Feedback';
import { fetchList } from '../features/articles/articlesSlice';
import { useI18n } from '../i18n';
import { useTitle } from '../utils/useTitle';

export default function Search() {
  const dispatch = useDispatch();
  const { t, lang } = useI18n();
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const [input, setInput] = useState(q);
  const list = useSelector((s) => s.articles.list);
  useTitle(q ? t('“{q}” खोज', { q }) : t('खोज'));

  useEffect(() => setInput(q), [q]);
  useEffect(() => {
    if (q) dispatch(fetchList({ q, page: 1 }));
  }, [q, lang, dispatch]);

  const submit = (e) => {
    e.preventDefault();
    const next = input.trim();
    if (next) setParams({ q: next });
  };

  // The list slice is shared with category pages; make sure we only render results for this query.
  const mine = list.key === `|${q}`;

  return (
    <main className="wrap page-content">
      <div className="page-head">
        <span className="kicker">{t('खोज')}</span>
        <h1>{q ? `“${q}”` : t('खबर खोजें')}</h1>
        <form className="page-search" onSubmit={submit}>
          <input type="search" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('खबर, विषय या शहर खोजें')} aria-label={t('खोज')} />
          <button type="submit" className="btn">
            {t('खोजें')}
          </button>
        </form>
        {q && mine && list.status === 'ready' && <p>{t('{n} परिणाम मिले', { n: list.total })}</p>}
      </div>

      {q && mine && list.status === 'error' && <ErrorBox message={list.error} onRetry={() => dispatch(fetchList({ q, page: 1 }))} />}
      {q && mine && list.status === 'ready' && !list.items.length && <Empty>{t('कोई खबर नहीं मिली। किसी दूसरे शब्द से खोजकर देखें।')}</Empty>}
      {mine && list.items.length > 0 && (
        <div className="row-list">
          {list.items.map((a) => (
            <RowCard key={a._id} article={a} />
          ))}
        </div>
      )}
      {q && (!mine || list.status === 'loading') && <Loading />}
      {mine && list.status === 'ready' && list.page < list.pages && (
        <div className="load-more">
          <button type="button" className="outline-btn dark" onClick={() => dispatch(fetchList({ q, page: list.page + 1 }))}>
            {t('और परिणाम दिखाएं')}
          </button>
        </div>
      )}
    </main>
  );
}
