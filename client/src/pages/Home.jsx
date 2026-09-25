import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { CompactStory, FeatureCard, GridCard, HeroStory, LatestCard, ListStory, Magazine, TrendItem } from '../components/Cards';
import { Empty, ErrorBox, Loading } from '../components/Feedback';
import { fetchHome } from '../features/articles/articlesSlice';
import { useI18n } from '../i18n';
import { useTitle } from '../utils/useTitle';

const REFRESH_MS = 60_000;

function SectionHeading({ kicker, title, to }) {
  const { t } = useI18n();
  return (
    <div className="section-heading">
      <div>
        <span className="kicker">{kicker}</span>
        <h2>{title}</h2>
      </div>
      {to && (
        <Link to={to}>
          {t('सभी देखें')} <span>→</span>
        </Link>
      )}
    </div>
  );
}

export default function Home() {
  const dispatch = useDispatch();
  const { t, lang } = useI18n();
  const { data, status, error } = useSelector((s) => s.articles.home);
  useTitle('');

  useEffect(() => {
    dispatch(fetchHome());
    const id = setInterval(() => dispatch(fetchHome()), REFRESH_MS);
    return () => clearInterval(id);
  }, [dispatch, lang]);

  if (!data) {
    return (
      <main className="wrap page-content">
        {status === 'error' ? <ErrorBox message={error} onRetry={() => dispatch(fetchHome())} /> : <Loading />}
      </main>
    );
  }
  if (!data.hero) {
    return (
      <main className="wrap page-content">
        <Empty>
          {t('अभी कोई खबर प्रकाशित नहीं है। सैंपल खबरों के लिए')} <b>npm run seed</b> {t('चलाएं।')}
        </Empty>
      </main>
    );
  }

  const { hero, side, latest, trending, sections, spotlight } = data;
  const [primary, ...others] = sections;

  return (
    <main id="top" className="wrap page-content">
      <section className="hero-grid">
        <HeroStory article={hero} />
        <div className="side-stories">
          {side.map((a) => (
            <CompactStory key={a._id} article={a} />
          ))}
        </div>
      </section>

      {latest.length > 0 && (
        <section className="section-block" id="latest">
          <SectionHeading kicker={t('हर पल की खबर')} title={t('ताज़ा खबरें')} to="/latest" />
          <div className="latest-grid">
            {latest.map((a, i) => (
              <LatestCard key={a._id} article={a} index={i} />
            ))}
          </div>
        </section>
      )}

      {primary && (
        <section className="split-section">
          <SectionHeading kicker="Ground Report" title={primary.category.name} to={`/category/${primary.category.slug}`} />
          <div className="feature-row">
            <FeatureCard article={primary.items[0]} />
            <div className="list-stories">
              {primary.items.slice(1, 4).map((a) => (
                <ListStory key={a._id} article={a} />
              ))}
            </div>
          </div>
        </section>
      )}

      {trending.length > 0 && (
        <section className="section-block">
          <SectionHeading kicker={t('सबसे ज़्यादा पढ़ी गई')} title={t('ट्रेंडिंग')} />
          <ol className="trend-list">
            {trending.map((a, i) => (
              <TrendItem key={a._id} article={a} index={i} />
            ))}
          </ol>
        </section>
      )}

      {others.map(({ category, items }) => (
        <section className="section-block" key={category.slug}>
          <SectionHeading kicker={t('और खबरें')} title={category.name} to={`/category/${category.slug}`} />
          <div className="card-grid">
            {items.map((a) => (
              <GridCard key={a._id} article={a} />
            ))}
          </div>
        </section>
      ))}

      {spotlight && (
        <section className="topics-grid">
          <SectionHeading kicker="The Weekend Edit" title={t('खास पेशकश')} />
          <Magazine article={spotlight} />
        </section>
      )}
    </main>
  );
}
