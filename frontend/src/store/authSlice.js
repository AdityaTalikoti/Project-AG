import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ── Fetch current user from /api/auth/me (cookie is sent automatically) ──
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) throw new Error('Not authenticated');
      const data = await res.json();
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ── Logout ──
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: true, // starts true — we check auth on app load
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchCurrentUser
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      })
      // logoutUser
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export default authSlice.reducer;
