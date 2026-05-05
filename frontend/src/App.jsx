import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchCurrentUser } from './store/authSlice';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import JournalPage from './pages/JournalPage';
import AuthPage from './pages/AuthPage';

function App() {
  const dispatch = useDispatch();

  // Check auth on app load — cookie is sent automatically
  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes */}
        <Route path="/" element={<AuthPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Home />} />
          <Route path="journal/new" element={<JournalPage />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;