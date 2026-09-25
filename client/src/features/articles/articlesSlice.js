import { createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/client';
import { apiThunk } from '../../app/apiThunk';

export const fetchHome = apiThunk('articles/home', () => api('/articles/home'));

export const fetchBreaking = apiThunk('articles/breaking', () =>
  api('/articles', { params: { breaking: true, limit: 8 } })
);

/** Paginated listing for a category page or search results. Page 1 replaces, later pages append. */
export const fetchList = apiThunk('articles/list', ({ category, q, page = 1 }) =>
  api('/articles', { params: { category, q, page, limit: 9 } })
);

export const fetchArticle = apiThunk('articles/detail', (slug) => api(`/articles/${encodeURIComponent(slug)}`));

export const fetchSuggestions = apiThunk('articles/suggest', (q) => api('/articles', { params: { q, limit: 5 } }));

export const listKey = ({ category = '', q = '' }) => `${category}|${q}`;

const initialState = {
  home: { data: null, status: 'idle', error: null },
  list: { key: '', items: [], page: 0, pages: 0, total: 0, status: 'idle', error: null },
  detail: { requestId: null, article: null, related: [], status: 'idle', error: null, notFound: false },
  breaking: [],
  suggestions: { requestId: null, items: [], status: 'idle' },
};

const slice = createSlice({
  name: 'articles',
  initialState,
  reducers: {
    clearSuggestions(state) {
      state.suggestions = initialState.suggestions;
    },
  },
  extraReducers: (builder) => {
    builder
      // home — keep showing stale data while refreshing in the background
      .addCase(fetchHome.pending, (state) => {
        state.home.status = 'loading';
        state.home.error = null;
      })
      .addCase(fetchHome.fulfilled, (state, { payload }) => {
        state.home = { data: payload, status: 'ready', error: null };
      })
      .addCase(fetchHome.rejected, (state, { payload }) => {
        state.home.status = 'error';
        state.home.error = payload;
      })

      .addCase(fetchBreaking.fulfilled, (state, { payload }) => {
        state.breaking = payload.items;
      })

      // list — responses for a category/query the user already left are ignored
      .addCase(fetchList.pending, (state, { meta }) => {
        const key = listKey(meta.arg);
        if (state.list.key !== key || meta.arg.page === 1 || !meta.arg.page) {
          state.list = { ...initialState.list, key, status: 'loading' };
        } else {
          state.list.status = 'loading';
        }
      })
      .addCase(fetchList.fulfilled, (state, { payload, meta }) => {
        if (state.list.key !== listKey(meta.arg)) return;
        state.list.items = payload.page > 1 ? [...state.list.items, ...payload.items] : payload.items;
        state.list.page = payload.page;
        state.list.pages = payload.pages;
        state.list.total = payload.total;
        state.list.status = 'ready';
      })
      .addCase(fetchList.rejected, (state, { payload, meta }) => {
        if (state.list.key !== listKey(meta.arg)) return;
        state.list.status = 'error';
        state.list.error = payload;
      })

      // detail
      .addCase(fetchArticle.pending, (state, { meta }) => {
        state.detail = { ...initialState.detail, requestId: meta.requestId, status: 'loading' };
      })
      .addCase(fetchArticle.fulfilled, (state, { payload, meta }) => {
        if (state.detail.requestId !== meta.requestId) return;
        state.detail = { requestId: meta.requestId, article: payload.article, related: payload.related, status: 'ready', error: null };
      })
      .addCase(fetchArticle.rejected, (state, { payload, meta }) => {
        if (state.detail.requestId !== meta.requestId) return;
        state.detail.status = 'error';
        state.detail.error = payload;
        state.detail.notFound = meta.status === 404;
      })

      // search-as-you-type suggestions — only the latest request wins
      .addCase(fetchSuggestions.pending, (state, { meta }) => {
        state.suggestions.requestId = meta.requestId;
        state.suggestions.status = 'loading';
      })
      .addCase(fetchSuggestions.fulfilled, (state, { payload, meta }) => {
        if (state.suggestions.requestId !== meta.requestId) return;
        state.suggestions.items = payload.items;
        state.suggestions.status = 'ready';
      })
      .addCase(fetchSuggestions.rejected, (state, { meta }) => {
        if (state.suggestions.requestId !== meta.requestId) return;
        state.suggestions.status = 'error';
      });
  },
});

export const { clearSuggestions } = slice.actions;
export default slice.reducer;
