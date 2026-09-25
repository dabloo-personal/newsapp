import { Link } from 'react-router-dom';
import ArticleImage from './ArticleImage';
import BookmarkButton from './BookmarkButton';
import ShareButton from './ShareButton';
import Tag from './Tag';
import { useI18n } from '../i18n';

const href = (a) => `/article/${a.slug}`;

export function HeroStory({ article: a }) {
  const { timeAgo } = useI18n();
  return (
    <article className="hero-story story-card">
      <Link to={href(a)} className="image-wrap" tabIndex={-1} aria-hidden="true">
        <ArticleImage src={a.image} alt={a.imageAlt || a.title} />
      </Link>
      <div className="hero-copy">
        <div className="eyebrow">
          <Tag category={a.category} /> <span>•</span> {timeAgo(a.publishedAt)}
        </div>
        <h1>
          <Link to={href(a)}>{a.title}</Link>
        </h1>
        <p>{a.summary}</p>
        <div className="story-meta">
          <span>{a.authorName}</span>
          <span className="meta-actions">
            <BookmarkButton articleId={a._id} />
            <ShareButton article={a} />
          </span>
        </div>
      </div>
    </article>
  );
}

export function CompactStory({ article: a }) {
  const { timeAgo } = useI18n();
  return (
    <article className="compact-story story-card">
      <Link to={href(a)} tabIndex={-1} aria-hidden="true">
        <ArticleImage src={a.image} alt={a.imageAlt || a.title} />
      </Link>
      <div>
        <Tag category={a.category} />
        <h2>
          <Link to={href(a)}>{a.title}</Link>
        </h2>
        <small>{timeAgo(a.publishedAt)}</small>
      </div>
    </article>
  );
}

export function LatestCard({ article: a, index }) {
  const { timeAgo } = useI18n();
  return (
    <article className="latest-card">
      <span className="number">{String(index + 1).padStart(2, '0')}</span>
      <div>
        <Tag category={a.category} />
        <h3>
          <Link to={href(a)}>{a.title}</Link>
        </h3>
        <time dateTime={a.publishedAt}>{timeAgo(a.publishedAt)}</time>
      </div>
    </article>
  );
}

export function FeatureCard({ article: a }) {
  const { t } = useI18n();
  return (
    <article className="feature-card story-card">
      <ArticleImage src={a.image} alt={a.imageAlt || a.title} />
      <div className="feature-overlay">
        <Tag category={a.category} />
        <h3>
          <Link to={href(a)}>{a.title}</Link>
        </h3>
        <small>{t('पढ़ने का समय {n} मिनट', { n: a.readingTime })}</small>
      </div>
    </article>
  );
}

export function ListStory({ article: a }) {
  const { timeAgo } = useI18n();
  return (
    <article>
      <span className="story-time">{timeAgo(a.publishedAt)}</span>
      <h3>
        <Link to={href(a)}>{a.title}</Link>
      </h3>
      <p>{a.category?.name}</p>
    </article>
  );
}

export function GridCard({ article: a }) {
  const { timeAgo } = useI18n();
  return (
    <article className="grid-card">
      <Link to={href(a)} className="grid-card-img" tabIndex={-1} aria-hidden="true">
        <ArticleImage src={a.image} alt={a.imageAlt || a.title} />
      </Link>
      <Tag category={a.category} />
      <h3>
        <Link to={href(a)}>{a.title}</Link>
      </h3>
      <small>{timeAgo(a.publishedAt)}</small>
    </article>
  );
}

/** Wide row used on search results and the saved list. */
export function RowCard({ article: a }) {
  const { timeAgo } = useI18n();
  return (
    <article className="row-card">
      <Link to={href(a)} className="row-card-img" tabIndex={-1} aria-hidden="true">
        <ArticleImage src={a.image} alt={a.imageAlt || a.title} />
      </Link>
      <div>
        <Tag category={a.category} />
        <h3>
          <Link to={href(a)}>{a.title}</Link>
        </h3>
        <p>{a.summary}</p>
        <small>
          {a.authorName} • {timeAgo(a.publishedAt)}
        </small>
      </div>
    </article>
  );
}

export function TrendItem({ article: a, index }) {
  const { t, formatCount } = useI18n();
  return (
    <li>
      <span className="number">{index + 1}</span>
      <div>
        <Link to={href(a)}>{a.title}</Link>
        <small>{t('{n} पाठक', { n: formatCount(a.views) })}</small>
      </div>
    </li>
  );
}

export function Magazine({ article: a }) {
  const { t } = useI18n();
  return (
    <article className="magazine-card">
      <div>
        <Tag category={a.category} />
        <h3>{a.title}</h3>
        <p>{a.summary}</p>
        <Link className="outline-btn" to={href(a)}>
          {t('पढ़ें')} <span>→</span>
        </Link>
      </div>
      <ArticleImage src={a.image} alt={a.imageAlt || a.title} />
    </article>
  );
}
