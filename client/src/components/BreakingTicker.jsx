import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

const INTERVAL_MS = 5000;

export default function BreakingTicker() {
  const { t } = useI18n();
  const items = useSelector((s) => s.articles.breaking);
  const [index, setIndex] = useState(0);
  const newestId = useRef(items[0]?._id);

  // A newly published breaking story jumps to the front instead of waiting its turn in the rotation.
  useEffect(() => {
    if (items[0]?._id !== newestId.current) {
      newestId.current = items[0]?._id;
      setIndex(0);
    }
  }, [items]);

  useEffect(() => {
    if (items.length < 2) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [items.length, index]); // restarting on `index` resets the timer after a manual "next"

  if (!items.length) return null;
  const current = items[index % items.length];

  return (
    <section className="breaking-strip" aria-label={t('ब्रेकिंग न्यूज़')}>
      <span className="breaking-label">BREAKING</span>
      <div className="ticker" aria-live="off">
        <Link key={current._id} to={`/article/${current.slug}`}>
          {current.title}
        </Link>
      </div>
      {items.length > 1 && (
        <button type="button" className="ticker-arrow" aria-label={t('अगली खबर')} onClick={() => setIndex((i) => (i + 1) % items.length)}>
          →
        </button>
      )}
    </section>
  );
}
