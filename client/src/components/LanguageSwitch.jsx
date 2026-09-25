import { useDispatch } from 'react-redux';
import { useI18n } from '../i18n';
import { setLanguage } from '../features/ui/uiSlice';

const OPTIONS = [
  ['hi', 'हिंदी'], // i18n-ignore
  ['en', 'English'],
];

/** Language names are always shown in their own script, so they are not run through t(). */
export default function LanguageSwitch({ className = '' }) {
  const dispatch = useDispatch();
  const { lang, t } = useI18n();

  return (
    <div className={`lang-switch ${className}`} role="group" aria-label={t('भाषा')}>
      {OPTIONS.map(([code, label]) => (
        <button
          key={code}
          type="button"
          lang={code}
          className={lang === code ? 'active' : ''}
          aria-pressed={lang === code}
          onClick={() => lang !== code && dispatch(setLanguage(code))}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
