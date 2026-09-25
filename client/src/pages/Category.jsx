import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { GridCard } from '../components/Cards';
import { Empty, ErrorBox, Loading } from '../components/Feedback';
import { fetchList } from '../features/articles/articlesSlice';
import { selectCategoryBySlug } from '../features/categories/categoriesSlice';
import { useI18n } from '../i18n';
import { useTitle } from '../utils/useTitle';
import NotFound from './NotFound';

/** Serves both /category/:slug and /latest (all categories). */
export default function Category() {
  const { slug } = useParams();
  const { t, lang } = useI18n();
  const dispatch = useDispatch();
  const category = useSelector(selectCategoryBySlug(slug));
  const categoriesReady = useSelector((s) => s.categories.status === 'ready');
  const stored = useSelector((s) => s.articles.list);
  // The list slice is shared; ignore leftovers from a previously visited category.
  const list = stored.key === `${slug ?? ''}|` ? stored : { items: [], status: 'loading', page: 0, pages: 0, total: 0 };

  const name = slug ? category?.name : t('ताज़ा खबर');
  useTitle(name);

  // `lang` is a dependency on purpose: switching language reloads the page-1 list in the new language.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback((page) => dispatch(fetchList({ category: slug, page })), [dispatch, slug, lang]);
  useEffect(() => {
    load(1);
  }, [load]);

  if (slug && categoriesReady && !category) return <NotFound />;

  return (
    <main className="wrap page-content">
      <div className="page-head">
        <span className="kicker">{slug ? t('श्रेणी') : t('हर पल की खबर')}</span>
        <h1>{name}</h1>
        {list.status === 'ready' && <p>{t('{n} खबरें', { n: list.total })}</p>}
      </div>

      {list.status === 'error' && <ErrorBox message={list.error} onRetry={() => load(1)} />}
      {list.status === 'ready' && !list.items.length && <Empty>{t('इस श्रेणी में अभी कोई खबर नहीं है।')}</Empty>}
      {list.items.length > 0 && (
        <div className="card-grid">
          {list.items.map((a) => (
            <GridCard key={a._id} article={a} />
          ))}
        </div>
      )}
      {list.status === 'loading' && <Loading />}
      {list.status === 'ready' && list.page < list.pages && (
        <div className="load-more">
          <button type="button" className="outline-btn dark" onClick={() => load(list.page + 1)}>
            {t('और खबरें दिखाएं')}
          </button>
        </div>
      )}
    </main>
  );
}
