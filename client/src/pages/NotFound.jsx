import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useTitle } from '../utils/useTitle';

export default function NotFound({ message }) {
  const { t } = useI18n();
  useTitle(t('पेज नहीं मिला'));
  return (
    <main className="wrap page-content">
      <div className="page-head not-found">
        <span className="kicker">404</span>
        <h1>{t('पेज नहीं मिला')}</h1>
        <p>{message ?? t('आप जो पेज खोज रहे हैं वह मौजूद नहीं है।')}</p>
        <Link className="btn" to="/">
          {t('होम पर जाएं')}
        </Link>
      </div>
    </main>
  );
}
