import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Empty, ErrorBox, Loading } from '../components/Feedback';
import { fetchAdminArticles, fetchAdminStats, removeArticle } from '../features/admin/adminSlice';
import { showToast } from '../features/ui/uiSlice';
import { msgid, useI18n } from '../i18n';
import { useTitle } from '../utils/useTitle';

const TABS = [
  ['', msgid('सभी')],
  ['published', msgid('प्रकाशित')],
  ['draft', msgid('ड्राफ्ट')],
];

export default function Admin() {
  const dispatch = useDispatch();
  const { t, timeAgo, formatCount } = useI18n();
  const { stats, list } = useSelector((s) => s.admin);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  useTitle(t('एडिटोरियल पैनल'));

  useEffect(() => {
    dispatch(fetchAdminStats());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchAdminArticles({ page, status, q: query }));
  }, [dispatch, page, status, query]);

  const remove = async (article) => {
    if (!window.confirm(t('“{title}” को हमेशा के लिए हटाएं?', { title: article.title }))) return;
    const result = await dispatch(removeArticle(article._id));
    if (removeArticle.fulfilled.match(result)) {
      dispatch(showToast(t('खबर हटा दी गई')));
      dispatch(fetchAdminStats());
      dispatch(fetchAdminArticles({ page, status, q: query }));
    } else {
      dispatch(showToast(result.payload || t('खबर नहीं हटाई जा सकी')));
    }
  };

  const cards = stats && [
    [t('कुल खबरें'), stats.total],
    [t('प्रकाशित'), stats.published],
    [t('ड्राफ्ट'), stats.drafts],
    [t('कुल पाठक'), formatCount(stats.views)],
    [t('यूज़र्स'), stats.users],
  ];

  return (
    <main className="wrap page-content">
      <div className="page-head admin-head">
        <div>
          <span className="kicker">{t('न्यूज़रूम')}</span>
          <h1>{t('एडिटोरियल पैनल')}</h1>
        </div>
        <Link className="btn" to="/admin/articles/new">
          {t('+ नई खबर')}
        </Link>
      </div>

      {cards && (
        <div className="stat-grid">
          {cards.map(([label, value]) => (
            <div className="stat" key={label}>
              <span>{label}</span>
              <b>{value}</b>
            </div>
          ))}
        </div>
      )}

      <div className="admin-toolbar">
        <div className="tabs" role="tablist">
          {TABS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={status === value}
              className={status === value ? 'active' : ''}
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
            >
              {t(label)}
            </button>
          ))}
        </div>
        <form
          className="page-search"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(q.trim());
            setPage(1);
          }}
        >
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('शीर्षक से खोजें')} aria-label={t('शीर्षक से खोजें')} />
          <button type="submit" className="btn">
            {t('खोजें')}
          </button>
        </form>
      </div>

      {list.status === 'error' && <ErrorBox message={list.error} onRetry={() => dispatch(fetchAdminArticles({ page, status, q: query }))} />}
      {list.status === 'loading' && !list.items.length && <Loading />}
      {list.status === 'ready' && !list.items.length && <Empty>{t('कोई खबर नहीं मिली।')}</Empty>}

      {list.items.length > 0 && (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('शीर्षक')}</th>
                <th>{t('श्रेणी')}</th>
                <th>{t('स्थिति')}</th>
                <th>{t('पाठक')}</th>
                <th>{t('अपडेट')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.items.map((a) => (
                <tr key={a._id}>
                  <td className="title-cell">
                    {a.title}
                    {(a.isBreaking || a.isFeatured) && (
                      <small>
                        {a.isBreaking && `${t('ब्रेकिंग')} `}
                        {a.isFeatured && t('फ़ीचर्ड')}
                      </small>
                    )}
                  </td>
                  <td>{a.category?.name}</td>
                  <td>
                    <span className={`status ${a.status}`}>{a.status === 'published' ? t('प्रकाशित') : t('ड्राफ्ट')}</span>
                  </td>
                  <td>{formatCount(a.views)}</td>
                  <td>{timeAgo(a.updatedAt)}</td>
                  <td className="actions">
                    <Link to={`/article/${a.slug}`}>{t('देखें')}</Link>
                    <Link to={`/admin/articles/${a._id}/edit`}>{t('संपादित')}</Link>
                    <button type="button" className="link-btn danger" onClick={() => remove(a)}>
                      {t('हटाएं')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {list.pages > 1 && (
        <div className="pager">
          <button type="button" className="outline-btn dark" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            {t('← पिछला')}
          </button>
          <span>
            {t('पेज {page} / {pages}', { page: list.page, pages: list.pages })}
          </span>
          <button type="button" className="outline-btn dark" disabled={page >= list.pages} onClick={() => setPage((p) => p + 1)}>
            {t('अगला →')}
          </button>
        </div>
      )}
    </main>
  );
}
