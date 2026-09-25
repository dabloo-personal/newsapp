import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { clearAuthError, login, register } from '../features/auth/authSlice';
import { showToast } from '../features/ui/uiSlice';
import { msgid, useI18n } from '../i18n';
import { useTitle } from '../utils/useTitle';

const COPY = {
  login: {
    title: msgid('लॉगिन'),
    kicker: msgid('वापसी पर स्वागत है'),
    cta: msgid('लॉगिन करें'),
    alt: [msgid('खाता नहीं है?'), msgid('खाता बनाएं'), '/register'],
  },
  register: {
    title: msgid('खाता बनाएं'),
    kicker: msgid('नवभारत परिवार से जुड़ें'),
    cta: msgid('खाता बनाएं'),
    alt: [msgid('पहले से खाता है?'), msgid('लॉगिन करें'), '/login'],
  },
};

export default function AuthForm({ mode }) {
  const copy = COPY[mode];
  const { t } = useI18n();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, submitting, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  useTitle(t(copy.title));

  useEffect(() => () => dispatch(clearAuthError()), [dispatch, mode]);

  const from = location.state?.from || '/';
  if (user) return <Navigate to={from} replace />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const thunk = mode === 'login' ? login({ email: form.email, password: form.password }) : register(form);
    const result = await dispatch(thunk);
    if (result.meta.requestStatus === 'fulfilled') {
      dispatch(showToast(t('स्वागत है, {name}', { name: result.payload.user.name })));
      navigate(from, { replace: true });
    }
  };

  return (
    <main className="wrap page-content">
      <form className="auth-card" onSubmit={submit} noValidate>
        <span className="kicker">{t(copy.kicker)}</span>
        <h1>{t(copy.title)}</h1>

        {mode === 'register' && (
          <label>
            {t('नाम')}
            <input value={form.name} onChange={set('name')} autoComplete="name" required maxLength={60} />
          </label>
        )}
        <label>
          {t('ईमेल')}
          <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
        </label>
        <label>
          {t('पासवर्ड')}
          <input
            type="password"
            value={form.password}
            onChange={set('password')}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={mode === 'register' ? 8 : undefined}
          />
          {mode === 'register' && <small>{t('कम से कम 8 अक्षर')}</small>}
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? t('कृपया प्रतीक्षा करें…') : t(copy.cta)}
        </button>
        <p className="auth-alt">
          {t(copy.alt[0])}{' '}
          <Link to={copy.alt[2]} state={location.state}>
            {t(copy.alt[1])}
          </Link>
        </p>
      </form>
    </main>
  );
}
