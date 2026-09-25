import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import ArticleImage from '../components/ArticleImage';
import BookmarkButton from '../components/BookmarkButton';
import { GridCard } from '../components/Cards';
import { ErrorBox, Loading } from '../components/Feedback';
import ShareButton from '../components/ShareButton';
import Tag from '../components/Tag';
import { fetchArticle } from '../features/articles/articlesSlice';
import { addComment, deleteComment, fetchComments } from '../features/comments/commentsSlice';
import { showToast } from '../features/ui/uiSlice';
import { useI18n } from '../i18n';
import { useTitle } from '../utils/useTitle';
import NotFound from './NotFound';

function Comments({ articleId }) {
  const dispatch = useDispatch();
  const { t, timeAgo } = useI18n();
  const user = useSelector((s) => s.auth.user);
  const { items, status, posting } = useSelector((s) => s.comments);
  const [text, setText] = useState('');

  useEffect(() => {
    dispatch(fetchComments(articleId));
  }, [dispatch, articleId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const result = await dispatch(addComment({ articleId, text }));
    if (addComment.fulfilled.match(result)) setText('');
    else dispatch(showToast(result.payload || t('टिप्पणी नहीं भेजी जा सकी')));
  };

  const remove = async (id) => {
    if (!window.confirm(t('क्या आप यह टिप्पणी हटाना चाहते हैं?'))) return;
    const result = await dispatch(deleteComment(id));
    if (deleteComment.rejected.match(result)) dispatch(showToast(result.payload || t('टिप्पणी नहीं हटाई जा सकी')));
  };

  const canDelete = (c) => user && (user.id === c.user || ['admin', 'editor'].includes(user.role));

  return (
    <section className="comments" aria-label={t('टिप्पणियां')}>
      <h2>
        {t('टिप्पणियां')} ({items.length})
      </h2>
      {user ? (
        <form onSubmit={submit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('अपनी राय लिखें…')}
            rows={3}
            maxLength={1000}
            aria-label={t('टिप्पणी')}
          />
          <button type="submit" className="btn" disabled={posting || !text.trim()}>
            {posting ? t('भेजा जा रहा है…') : t('टिप्पणी करें')}
          </button>
        </form>
      ) : (
        <p className="comments-login">
          {t('टिप्पणी करने के लिए')}{' '}
          <Link to="/login" state={{ from: window.location.pathname }}>
            {t('लॉगिन करें')}
          </Link>
        </p>
      )}
      {status === 'loading' && !items.length && <Loading />}
      <ul>
        {items.map((c) => (
          <li key={c._id}>
            <div className="comment-head">
              <b>{c.userName}</b>
              <small>{timeAgo(c.createdAt)}</small>
              {canDelete(c) && (
                <button type="button" className="link-btn" onClick={() => remove(c._id)}>
                  {t('हटाएं')}
                </button>
              )}
            </div>
            <p>{c.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Article() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { t, lang, timeAgo, formatDate, formatCount } = useI18n();
  const { article, related, status, error, notFound } = useSelector((s) => s.articles.detail);
  useTitle(article?.title);

  useEffect(() => {
    dispatch(fetchArticle(slug));
  }, [dispatch, slug, lang]);

  if (status === 'error') {
    return notFound ? (
      <NotFound message={t('यह खबर हटाई जा चुकी है या उपलब्ध नहीं है।')} />
    ) : (
      <main className="wrap page-content">
        <ErrorBox message={error} onRetry={() => dispatch(fetchArticle(slug))} />
      </main>
    );
  }
  if (!article || article.slug !== slug) {
    return (
      <main className="wrap page-content">
        <Loading />
      </main>
    );
  }

  const paragraphs = article.body.split(/\n{2,}/).filter(Boolean);

  return (
    <main className="wrap page-content">
      <article className="article">
        <nav className="crumbs" aria-label={t('ब्रेडक्रम्ब')}>
          <Link to="/">{t('होम')}</Link> / <Link to={`/category/${article.category.slug}`}>{article.category.name}</Link>
        </nav>
        <div className="article-tags">
          <Tag category={article.category} link />
          {article.status === 'draft' && <span className="section-tag red">{t('ड्राफ्ट')}</span>}
        </div>
        <h1>{article.title}</h1>
        <p className="deck">{article.summary}</p>

        <div className="byline">
          <div>
            <b>{article.authorName}</b>
            <span>
              <time dateTime={article.publishedAt}>{formatDate(article.publishedAt || article.createdAt)}</time> • {t('{n} मिनट पढ़ें', { n: article.readingTime })} •{' '}
              {t('{n} पाठक', { n: formatCount(article.views) })}
            </span>
          </div>
          <div className="byline-actions">
            <BookmarkButton articleId={article._id} className="pill-btn" withLabel />
            <ShareButton article={article} className="pill-btn" />
          </div>
        </div>

        {!article.translated && <p className="lang-note">{t('यह खबर अभी अंग्रेज़ी में उपलब्ध नहीं है, इसलिए हिंदी संस्करण दिखाया जा रहा है।')}</p>}

        {article.image && (
          <figure className="article-figure">
            <ArticleImage src={article.image} alt={article.imageAlt || article.title} />
          </figure>
        )}

        <div className="article-body">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {article.tags?.length > 0 && (
          <div className="chips">
            {article.tags.map((t) => (
              <Link key={t} to={`/search?q=${encodeURIComponent(t)}`}>
                #{t}
              </Link>
            ))}
          </div>
        )}

        <Comments articleId={article._id} />
      </article>

      {related.length > 0 && (
        <section className="section-block related">
          <div className="section-heading">
            <div>
              <span className="kicker">{t('आगे पढ़ें')}</span>
              <h2>{t('संबंधित खबरें')}</h2>
            </div>
          </div>
          <div className="card-grid">
            {related.map((a) => (
              <GridCard key={a._id} article={a} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
