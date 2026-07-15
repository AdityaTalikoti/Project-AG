import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE = import.meta.env.VITE_API_URL || '';

// ── Fetch current user from /api/auth/me (cookie is sent automatically) ──
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
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
    await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: true, // starts true — we check auth on app load
  },
  reducers: {
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setCredentials: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
    }
  },
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

export const { updateUser, setCredentials } = authSlice.actions;
export default authSlice.reducer;
