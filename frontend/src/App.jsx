import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import JournalListPage from './pages/JournalListPage';
import JournalFormPage from './pages/JournalFormPage';
import JournalDetailPage from './pages/JournalDetailPage';
import AchievementsPage from './pages/AchievementsPage';
import SearchPage from './pages/SearchPage';
import ReviewPage from './pages/ReviewPage';
import TeamCalibrationPage from './pages/TeamCalibrationPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function ManagerRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'manager' && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function GuestRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
    <Routes>
      {/* Auth routes (no sidebar) */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Protected routes (with sidebar layout) */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/journals" element={<JournalListPage />} />
        <Route path="/journals/new" element={<JournalFormPage />} />
        <Route path="/journals/:id" element={<JournalDetailPage />} />
        <Route path="/journals/:id/edit" element={<JournalFormPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/team" element={<ManagerRoute><TeamCalibrationPage /></ManagerRoute>} />
      </Route>

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </ErrorBoundary>
  );
}
