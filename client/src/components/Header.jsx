import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink } from 'react-router-dom';
import { logout, selectIsStaff } from '../features/auth/authSlice';
import { closeDrawer, openSearch, showToast, toggleDrawer } from '../features/ui/uiSlice';
import { useI18n } from '../i18n';
import LanguageSwitch from './LanguageSwitch';

function Brand({ className = '' }) {
  const { t } = useI18n();
  return (
    <Link className={`brand ${className}`} to="/" aria-label={t('नवभारत 24x7 होम')}>
      <span className="brand-mark">{t('न')}</span>
      <span className="brand-name">
        {t('नवभारत')} <b>24x7</b>
      </span>
    </Link>
  );
}

export function TopLine() {
  const { t, formatToday } = useI18n();
  return (
    <div className="topline">
      <div className="wrap top-inner">
        <span>{formatToday()}</span>
        <div className="top-links">
          <span className="extra">{t('ई-पेपर')}</span>
          <span className="extra">{t('हमसे जुड़ें')}</span>
          <LanguageSwitch />
        </div>
      </div>
    </div>
  );
}

function AccountMenu() {
  const dispatch = useDispatch();
  const { t } = useI18n();
  const user = useSelector((s) => s.auth.user);
  const isStaff = useSelector(selectIsStaff);
  const savedCount = useSelector((s) => s.bookmarks.ids.length);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Link className="login-link" to="/login">
        {t('लॉगिन')}
      </Link>
    );
  }

  return (
    <div className="account" ref={ref}>
      <button type="button" className="account-btn" aria-expanded={open} aria-label={user.name} onClick={() => setOpen((o) => !o)}>
        <span className="avatar">{user.name.trim().charAt(0)}</span>
      </button>
      {open && (
        <div className="account-menu" onClick={() => setOpen(false)}>
          <div className="account-name">
            {user.name}
            <small>{user.email}</small>
          </div>
          <Link to="/bookmarks">
            {t('सेव की गई खबरें')} {savedCount > 0 && <b>{savedCount}</b>}
          </Link>
          {isStaff && <Link to="/admin">{t('एडिटोरियल पैनल')}</Link>}
          <button
            type="button"
            onClick={() => {
              dispatch(logout());
              dispatch(showToast(t('आप लॉगआउट हो गए')));
            }}
          >
            {t('लॉगआउट')}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const dispatch = useDispatch();
  const { t } = useI18n();
  const drawerOpen = useSelector((s) => s.ui.drawerOpen);

  return (
    <header className="site-header wrap">
      <button
        type="button"
        className="icon-btn menu-btn"
        aria-label={t('मेन्यू खोलें')}
        aria-expanded={drawerOpen}
        onClick={() => dispatch(toggleDrawer())}
      >
        <span />
        <span />
        <span />
      </button>
      <Brand />
      <div className="header-actions">
        <button type="button" className="live-pill" onClick={() => dispatch(showToast(t('आप लाइव अपडेट्स देख रहे हैं')))}>
          <i /> {t('लाइव टीवी')}
        </button>
        <button type="button" className="icon-btn search-btn" aria-label={t('खोजें')} onClick={() => dispatch(openSearch())}>
          ⌕
        </button>
        <AccountMenu />
      </div>
    </header>
  );
}

export function CategoryNav() {
  const { t } = useI18n();
  const categories = useSelector((s) => s.categories.items);
  return (
    <nav className="category-nav" aria-label={t('मुख्य श्रेणियां')}>
      <div className="wrap nav-scroll">
        <NavLink to="/" end>
          {t('होम')}
        </NavLink>
        <NavLink to="/latest">{t('ताज़ा खबर')}</NavLink>
        {categories.map((c) => (
          <NavLink key={c._id} to={`/category/${c.slug}`}>
            {c.name}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function Drawer() {
  const dispatch = useDispatch();
  const { t } = useI18n();
  const open = useSelector((s) => s.ui.drawerOpen);
  const user = useSelector((s) => s.auth.user);
  const isStaff = useSelector(selectIsStaff);
  const categories = useSelector((s) => s.categories.items);
  const close = () => dispatch(closeDrawer());

  return (
    <div className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="drawer-scrim" onClick={close} />
      <aside className="drawer-panel">
        <button type="button" className="close-search" aria-label={t('मेन्यू बंद करें')} onClick={close}>
          ×
        </button>
        <LanguageSwitch className="in-drawer" />
        <nav onClick={close}>
          <Link to="/">{t('होम')}</Link>
          <Link to="/latest">{t('ताज़ा खबर')}</Link>
          {categories.map((c) => (
            <Link key={c._id} to={`/category/${c.slug}`}>
              {c.name}
            </Link>
          ))}
          <hr />
          {user ? (
            <>
              <Link to="/bookmarks">{t('सेव की गई खबरें')}</Link>
              {isStaff && <Link to="/admin">{t('एडिटोरियल पैनल')}</Link>}
              <button type="button" onClick={() => dispatch(logout())}>
                {t('लॉगआउट ({name})', { name: user.name })}
              </button>
            </>
          ) : (
            <>
              <Link to="/login">{t('लॉगिन')}</Link>
              <Link to="/register">{t('खाता बनाएं')}</Link>
            </>
          )}
        </nav>
      </aside>
    </div>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer>
      <div className="wrap footer-inner">
        <Brand className="footer-brand" />
        <p>{t('खबर जो आपके करीब हो।')}</p>
        <div className="footer-links">
          <Link to="/latest">{t('ताज़ा खबर')}</Link>
          <Link to="/bookmarks">{t('सेव की गई खबरें')}</Link>
          <Link to="/search">{t('खोजें')}</Link>
        </div>
      </div>
    </footer>
  );
}
