import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';

/** Image with a branded fallback so a dead URL never leaves a broken-image icon. */
export default function ArticleImage({ src, alt = '', className = '' }) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div className={`img-fallback ${className}`} role="img" aria-label={alt}>
        <span>{t('न')}</span>
      </div>
    );
  }
  return <img className={className} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}
