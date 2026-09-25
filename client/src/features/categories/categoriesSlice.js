import { createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/client';
import { apiThunk } from '../../app/apiThunk';
import { langChanged } from '../ui/uiSlice';

export const fetchCategories = apiThunk('categories/fetch', () => api('/categories'), {
  // Categories rarely change; load once per session.
  condition: (_, { getState }) => getState().categories.status === 'idle',
});

const slice = createSlice({
  name: 'categories',
  initialState: { items: [], status: 'idle' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCategories.fulfilled, (state, { payload }) => {
        state.status = 'ready';
        state.items = payload.items;
      })
      .addCase(langChanged, (state) => {
        state.status = 'idle'; // names are localised server-side; the next fetchCategories() reloads them
      })
      .addCase(fetchCategories.rejected, (state) => {
        state.status = 'idle'; // allow a retry on the next mount
      });
  },
});

export const selectCategories = (state) => state.categories.items;
export const selectCategoryBySlug = (slug) => (state) => state.categories.items.find((c) => c.slug === slug);

export default slice.reducer;
