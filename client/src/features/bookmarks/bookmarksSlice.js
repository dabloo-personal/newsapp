import { createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/client';
import { apiThunk } from '../../app/apiThunk';
import { fetchMe, login, register, loggedOut } from '../auth/authSlice';

export const fetchBookmarks = apiThunk('bookmarks/fetch', () => api('/bookmarks'));

export const toggleBookmark = apiThunk('bookmarks/toggle', (articleId) =>
  api(`/bookmarks/${articleId}`, { method: 'POST' })
);

const flip = (ids, id) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

const slice = createSlice({
  name: 'bookmarks',
  initialState: { ids: [], items: [], status: 'idle' },
  reducers: {},
  extraReducers: (builder) => {
    // The user payload carries bookmark ids, so no extra request is needed after login.
    for (const thunk of [login, register, fetchMe]) {
      builder.addCase(thunk.fulfilled, (state, { payload }) => {
        state.ids = payload.user.bookmarks;
      });
    }
    builder
      .addCase(loggedOut, () => ({ ids: [], items: [], status: 'idle' }))
      .addCase(fetchBookmarks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBookmarks.fulfilled, (state, { payload }) => {
        state.status = 'ready';
        state.items = payload.items;
        state.ids = payload.items.map((a) => a._id);
      })
      .addCase(fetchBookmarks.rejected, (state) => {
        state.status = 'error';
      })
      // optimistic toggle, reconciled with the server's answer
      .addCase(toggleBookmark.pending, (state, { meta }) => {
        state.ids = flip(state.ids, meta.arg);
      })
      .addCase(toggleBookmark.fulfilled, (state, { payload }) => {
        state.ids = payload.ids;
        state.items = state.items.filter((a) => payload.ids.includes(a._id));
      })
      .addCase(toggleBookmark.rejected, (state, { meta }) => {
        state.ids = flip(state.ids, meta.arg);
      });
  },
});

export const selectIsBookmarked = (id) => (state) => state.bookmarks.ids.includes(id);

export default slice.reducer;
