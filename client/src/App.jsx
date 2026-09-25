import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Admin from './pages/Admin';
import Article from './pages/Article';
import ArticleEditor from './pages/ArticleEditor';
import Bookmarks from './pages/Bookmarks';
import Category from './pages/Category';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Register from './pages/Register';
import Search from './pages/Search';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="latest" element={<Category />} />
        <Route path="category/:slug" element={<Category />} />
        <Route path="article/:slug" element={<Article />} />
        <Route path="search" element={<Search />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="bookmarks" element={<Bookmarks />} />
        </Route>
        <Route element={<ProtectedRoute roles={['admin', 'editor']} />}>
          <Route path="admin" element={<Admin />} />
          <Route path="admin/articles/new" element={<ArticleEditor />} />
          <Route path="admin/articles/:id/edit" element={<ArticleEditor />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
