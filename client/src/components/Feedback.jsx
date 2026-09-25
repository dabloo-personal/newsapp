import { useI18n } from '../i18n';

export function Loading({ label }) {
  const { t } = useI18n();
  return (
    <div className="state-box" role="status">
      <span className="spinner" aria-hidden="true" />
      {label ?? t('लोड हो रहा है…')}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  const { t } = useI18n();
  return (
    <div className="state-box error" role="alert">
      <p>{message || t('कुछ गड़बड़ हुई')}</p>
      {onRetry && (
        <button type="button" className="outline-btn dark" onClick={onRetry}>
          {t('दोबारा कोशिश करें')}
        </button>
      )}
    </div>
  );
}

export function Empty({ children }) {
  return <div className="state-box">{children}</div>;
}
