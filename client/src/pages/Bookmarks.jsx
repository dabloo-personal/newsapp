import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import BookmarkButton from '../components/BookmarkButton';
import { RowCard } from '../components/Cards';
import { Empty, ErrorBox, Loading } from '../components/Feedback';
import { fetchBookmarks } from '../features/bookmarks/bookmarksSlice';
import { useI18n } from '../i18n';
import { useTitle } from '../utils/useTitle';

export default function Bookmarks() {
  const dispatch = useDispatch();
  const { t, lang } = useI18n();
  const { items, status } = useSelector((s) => s.bookmarks);
  useTitle(t('सेव की गई खबरें'));

  useEffect(() => {
    dispatch(fetchBookmarks());
  }, [dispatch, lang]);

  return (
    <main className="wrap page-content">
      <div className="page-head">
        <span className="kicker">{t('आपकी लाइब्रेरी')}</span>
        <h1>{t('सेव की गई खबरें')}</h1>
      </div>
      {status === 'loading' && !items.length && <Loading />}
      {status === 'error' && <ErrorBox message={t('सेव की गई खबरें लोड नहीं हो सकीं')} onRetry={() => dispatch(fetchBookmarks())} />}
      {status === 'ready' && !items.length && (
        <Empty>
          {t('अभी कोई खबर सेव नहीं की गई।')} <Link to="/">{t('ताज़ा खबरें देखें')}</Link>
        </Empty>
      )}
      <div className="row-list">
        {items.map((a) => (
          <div className="row-with-action" key={a._id}>
            <RowCard article={a} />
            <BookmarkButton articleId={a._id} className="row-save" />
          </div>
        ))}
      </div>
    </main>
  );
}
