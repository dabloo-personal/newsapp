import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useI18n } from '../i18n';
import { Loading } from './Feedback';

export default function ProtectedRoute({ roles }) {
  const { user, initialized } = useSelector((s) => s.auth);
  const location = useLocation();
  const { t } = useI18n();

  if (!initialized) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) {
    return (
      <main className="wrap page-content">
        <div className="state-box error">{t('इस पेज को देखने की आपको अनुमति नहीं है।')}</div>
      </main>
    );
  }
  return <Outlet />;
}
