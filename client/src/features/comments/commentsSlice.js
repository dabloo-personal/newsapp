import { createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/client';
import { apiThunk } from '../../app/apiThunk';

export const fetchComments = apiThunk('comments/fetch', (articleId) => api(`/comments/${articleId}`));

export const addComment = apiThunk('comments/add', ({ articleId, text }) =>
  api(`/comments/${articleId}`, { method: 'POST', body: { text } })
);

export const deleteComment = apiThunk('comments/delete', async (id) => {
  await api(`/comments/item/${id}`, { method: 'DELETE' });
  return id;
});

const slice = createSlice({
  name: 'comments',
  initialState: { articleId: null, items: [], status: 'idle', posting: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.pending, (state, { meta }) => {
        if (state.articleId !== meta.arg) state.items = [];
        state.articleId = meta.arg;
        state.status = 'loading';
      })
      .addCase(fetchComments.fulfilled, (state, { payload, meta }) => {
        if (state.articleId !== meta.arg) return;
        state.items = payload.items;
        state.status = 'ready';
      })
      .addCase(fetchComments.rejected, (state, { meta }) => {
        if (state.articleId === meta.arg) state.status = 'error';
      })
      .addCase(addComment.pending, (state) => {
        state.posting = true;
      })
      .addCase(addComment.fulfilled, (state, { payload, meta }) => {
        state.posting = false;
        if (state.articleId === meta.arg.articleId) state.items.unshift(payload.comment);
      })
      .addCase(addComment.rejected, (state) => {
        state.posting = false;
      })
      .addCase(deleteComment.fulfilled, (state, { payload }) => {
        state.items = state.items.filter((c) => c._id !== payload);
      });
  },
});

export default slice.reducer;
