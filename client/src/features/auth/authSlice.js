import { createSlice } from '@reduxjs/toolkit';
import { api, getToken, setToken } from '../../api/client';
import { apiThunk } from '../../app/apiThunk';
import { translate } from '../../i18n';

const persist = async (request) => {
  const data = await request();
  setToken(data.token);
  return data;
};

export const login = apiThunk('auth/login', (credentials) =>
  persist(() => api('/auth/login', { method: 'POST', body: credentials }))
);

export const register = apiThunk('auth/register', (details) =>
  persist(() => api('/auth/register', { method: 'POST', body: details }))
);

/** Restores the session from a stored token on app start. */
export const fetchMe = apiThunk('auth/me', async () => {
  try {
    return await api('/auth/me');
  } catch (err) {
    if (err.status === 401) setToken(null); // expired / revoked token
    throw err;
  }
});

const hasToken = Boolean(getToken());

const slice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    // False until the stored token (if any) has been checked, so guarded routes don't flash a redirect.
    initialized: !hasToken,
    submitting: false,
    error: null,
  },
  reducers: {
    loggedOut(state) {
      state.user = null;
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    for (const thunk of [login, register]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.submitting = true;
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, { payload }) => {
          state.submitting = false;
          state.user = payload.user;
        })
        .addCase(thunk.rejected, (state, { payload }) => {
          state.submitting = false;
          state.error = payload ?? translate('कुछ गड़बड़ हुई');
        });
    }
    builder
      .addCase(fetchMe.fulfilled, (state, { payload }) => {
        state.user = payload.user;
        state.initialized = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.initialized = true;
      });
  },
});

export const { loggedOut, clearAuthError } = slice.actions;

export const logout = () => (dispatch) => {
  setToken(null);
  dispatch(loggedOut());
};

export const selectUser = (state) => state.auth.user;
export const selectIsStaff = (state) => ['admin', 'editor'].includes(state.auth.user?.role);

export default slice.reducer;
