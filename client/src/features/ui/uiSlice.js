import { createSlice, nanoid } from '@reduxjs/toolkit';
import { getLang, setLang } from '../../i18n/lang';

const slice = createSlice({
  name: 'ui',
  initialState: { lang: getLang(), searchOpen: false, drawerOpen: false, toast: null },
  reducers: {
    langChanged(state, { payload }) {
      state.lang = payload;
    },
    openSearch(state) {
      state.searchOpen = true;
      state.drawerOpen = false;
    },
    closeSearch(state) {
      state.searchOpen = false;
    },
    toggleDrawer(state) {
      state.drawerOpen = !state.drawerOpen;
    },
    closeDrawer(state) {
      state.drawerOpen = false;
    },
    showToast: {
      // A fresh id lets the Toast restart its timer even when the same message repeats.
      prepare: (message) => ({ payload: { id: nanoid(), message } }),
      reducer(state, { payload }) {
        state.toast = payload;
      },
    },
    clearToast(state) {
      state.toast = null;
    },
  },
});

export const { langChanged, openSearch, closeSearch, toggleDrawer, closeDrawer, showToast, clearToast } = slice.actions;
/** Persists the choice, then updates state; data-loading effects depend on `ui.lang` and refetch. */
export const setLanguage = (lang) => (dispatch) => {
  setLang(lang);
  dispatch(langChanged(lang));
};

export default slice.reducer;
