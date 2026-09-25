import { configureStore } from '@reduxjs/toolkit';
import auth from '../features/auth/authSlice';
import articles from '../features/articles/articlesSlice';
import categories from '../features/categories/categoriesSlice';
import bookmarks from '../features/bookmarks/bookmarksSlice';
import comments from '../features/comments/commentsSlice';
import admin from '../features/admin/adminSlice';
import ui from '../features/ui/uiSlice';

export const store = configureStore({
  reducer: { auth, articles, categories, bookmarks, comments, admin, ui },
});
