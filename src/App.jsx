import { Route, Routes, Navigate, useLocation } from 'react-router';
import { useAuth } from './context/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Notes from './pages/Notes';
import Assistant from './pages/Assistant';
import Quiz from './pages/Quiz';
import Questions from './pages/Questions';
import Timetable from './pages/Timetable';
import Diary from './pages/Diary';
import Grades from './pages/Grades';
import Progress from './pages/Progress';
import Profile from './pages/Profile';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Signup />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="notes" element={<Notes />} />
        <Route path="assistant" element={<Assistant />} />
        <Route path="quiz" element={<Quiz />} />
        <Route path="questions" element={<Questions />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="diary" element={<Diary />} />
        <Route path="grades" element={<Grades />} />
        <Route path="progress" element={<Progress />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
