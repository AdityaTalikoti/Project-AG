import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchCurrentUser } from './store/authSlice';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import MentorProtectedRoute from './components/MentorProtectedRoute';
import Home from './pages/Home';
import JournalPage from './pages/JournalPage';
import AuthPage from './pages/AuthPage';
import FocusTimerPage from './pages/FocusTimerPage';
import ComingSoonPage from './pages/ComingSoonPage';
import RoadmapPage from './pages/RoadmapPage';
import CalendarPage from './pages/CalendarPage';
import AIMentor from './pages/AIMentor';
import TasksPage from './pages/TasksPage';
import SettingsPage from './pages/SettingsPage';
import MentorLayout from './mentor/MentorLayout';
import MentorDashboard from './mentor/MentorDashboard';
import MentorTasksPage from './mentor/MentorTasksPage';
import MentorStudentsPage from './mentor/MentorStudentsPage';
import MentorSubmissionsPage from './mentor/MentorSubmissionsPage';

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

        {/* ── Student protected routes ── */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Home />} />
          <Route path="journal/new" element={<JournalPage />} />
          <Route path="roadmap" element={<RoadmapPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="flashcards" element={<ComingSoonPage title="Flashcards" />} />
          <Route path="notes" element={<ComingSoonPage title="Notes" />} />
          <Route path="progress" element={<ComingSoonPage title="Progress" />} />
          <Route path="analytics" element={<ComingSoonPage title="Analytics" />} />
          <Route path="achievements" element={<ComingSoonPage title="Achievements" />} />
          <Route path="peers" element={<ComingSoonPage title="Peers" />} />
          <Route path="mentor" element={<AIMentor />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="/dashboard/focus" element={
          <ProtectedRoute>
            <FocusTimerPage />
          </ProtectedRoute>
        } />

        {/* ── Mentor portal protected routes ── */}
        <Route path="/mentor-portal" element={
          <MentorProtectedRoute>
            <MentorLayout />
          </MentorProtectedRoute>
        }>
          <Route index element={<MentorDashboard />} />
          <Route path="tasks" element={<MentorTasksPage />} />
          <Route path="students" element={<MentorStudentsPage />} />
          <Route path="submissions" element={<MentorSubmissionsPage />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;