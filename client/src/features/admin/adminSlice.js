import { createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/client';
import { apiThunk } from '../../app/apiThunk';
import { loggedOut } from '../auth/authSlice';

export const fetchAdminStats = apiThunk('admin/stats', () => api('/articles/admin/stats'));

export const fetchAdminArticles = apiThunk('admin/list', ({ page = 1, status, q }) =>
  api('/articles/admin/list', { params: { page, status, q, limit: 10 } })
);

export const fetchAdminArticle = apiThunk('admin/get', (id) => api(`/articles/admin/${id}`));

/** Creates when `id` is absent, updates otherwise. */
export const saveArticle = apiThunk('admin/save', ({ id, data }) =>
  id ? api(`/articles/${id}`, { method: 'PUT', body: data }) : api('/articles', { method: 'POST', body: data })
);

export const removeArticle = apiThunk('admin/remove', async (id) => {
  await api(`/articles/${id}`, { method: 'DELETE' });
  return id;
});

const initialState = {
  stats: null,
  list: { items: [], page: 1, pages: 0, total: 0, status: 'idle', error: null },
  editor: { article: null, status: 'idle', error: null },
  saving: false,
};

const slice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    resetEditor(state) {
      state.editor = initialState.editor;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loggedOut, () => initialState)
      .addCase(fetchAdminStats.fulfilled, (state, { payload }) => {
        state.stats = payload;
      })
      .addCase(fetchAdminArticles.pending, (state) => {
        state.list.status = 'loading';
        state.list.error = null;
      })
      .addCase(fetchAdminArticles.fulfilled, (state, { payload }) => {
        state.list = { ...payload, status: 'ready', error: null };
      })
      .addCase(fetchAdminArticles.rejected, (state, { payload }) => {
        state.list.status = 'error';
        state.list.error = payload;
      })
      .addCase(fetchAdminArticle.pending, (state) => {
        state.editor = { article: null, status: 'loading', error: null };
      })
      .addCase(fetchAdminArticle.fulfilled, (state, { payload }) => {
        state.editor = { article: payload.article, status: 'ready', error: null };
      })
      .addCase(fetchAdminArticle.rejected, (state, { payload }) => {
        state.editor = { article: null, status: 'error', error: payload };
      })
      .addCase(saveArticle.pending, (state) => {
        state.saving = true;
      })
      .addCase(saveArticle.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(saveArticle.rejected, (state) => {
        state.saving = false;
      })
      .addCase(removeArticle.fulfilled, (state, { payload }) => {
        state.list.items = state.list.items.filter((a) => a._id !== payload);
        state.list.total = Math.max(0, state.list.total - 1);
      });
  },
});

export const { resetEditor } = slice.actions;
export default slice.reducer;
