import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import { fetchBreaking } from '../features/articles/articlesSlice';
import { fetchCategories } from '../features/categories/categoriesSlice';
import { closeDrawer, closeSearch } from '../features/ui/uiSlice';
import BreakingTicker from './BreakingTicker';
import Header, { CategoryNav, Drawer, Footer, TopLine } from './Header';
import SearchPanel from './SearchPanel';
import Toast from './Toast';

const BREAKING_REFRESH_MS = 45_000;

export default function Layout() {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const lang = useSelector((s) => s.ui.lang);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchBreaking());
    // Keep the ticker fresh without a page reload.
    const id = setInterval(() => dispatch(fetchBreaking()), BREAKING_REFRESH_MS);
    return () => clearInterval(id);
  }, [dispatch, lang]); // category names and breaking headlines are localised server-side

  useEffect(() => {
    dispatch(closeDrawer());
    dispatch(closeSearch());
    window.scrollTo(0, 0);
  }, [pathname, dispatch]);

  return (
    <>
      <TopLine />
      <Header />
      <CategoryNav />
      <div className="wrap">
        <BreakingTicker />
      </div>
      <Outlet />
      <Footer />
      <Toast />
      <SearchPanel />
      <Drawer />
    </>
  );
}
