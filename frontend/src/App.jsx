import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchCurrentUser } from './store/authSlice';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import JournalPage from './pages/JournalPage';
import AuthPage from './pages/AuthPage';
import FocusTimerPage from './pages/FocusTimerPage';
import ComingSoonPage from './pages/ComingSoonPage';
import RoadmapPage from './pages/RoadmapPage';

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
          <Route path="roadmap" element={<RoadmapPage />} />
          <Route path="tasks" element={<ComingSoonPage title="Tasks" />} />
          <Route path="flashcards" element={<ComingSoonPage title="Flashcards" />} />
          <Route path="notes" element={<ComingSoonPage title="Notes" />} />
          <Route path="progress" element={<ComingSoonPage title="Progress" />} />
          <Route path="analytics" element={<ComingSoonPage title="Analytics" />} />
          <Route path="achievements" element={<ComingSoonPage title="Achievements" />} />
          <Route path="peers" element={<ComingSoonPage title="Peers" />} />
          <Route path="mentor" element={<ComingSoonPage title="Mentor Portal" />} />
          <Route path="settings" element={<ComingSoonPage title="Settings" />} />
        </Route>

        <Route path="/dashboard/focus" element={
          <ProtectedRoute>
            <FocusTimerPage />
          </ProtectedRoute>
        } />

      </Routes>
    </BrowserRouter>
  );
}

export default App;