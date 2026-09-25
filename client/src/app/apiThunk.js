import { createAsyncThunk } from '@reduxjs/toolkit';

/**
 * createAsyncThunk wrapper: `request(arg, thunkApi)` just returns data or throws.
 * Failures reach reducers as a plain message string (action.payload) plus the HTTP status (action.meta.status).
 */
export const apiThunk = (type, request, options) =>
  createAsyncThunk(
    type,
    async (arg, thunkApi) => {
      try {
        return await request(arg, thunkApi);
      } catch (err) {
        return thunkApi.rejectWithValue(err.message, { status: err.status });
      }
    },
    options
  );
