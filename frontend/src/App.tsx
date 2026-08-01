import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth pages are small and needed immediately - kept as normal imports.
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Everything past login is lazy-loaded per route, so a student never
// downloads the lecturer/admin pages (or recharts, only used by the
// analytics/dashboard pages) and vice versa.
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminCourses = lazy(() => import('./pages/admin/Courses'));
const ManageRoster = lazy(() => import('./pages/ManageRoster'));

const LecturerDashboard = lazy(() => import('./pages/lecturer/LecturerDashboard'));
const RecordAttendance = lazy(() => import('./pages/lecturer/RecordAttendance'));
const Analytics = lazy(() => import('./pages/lecturer/Analytics'));

const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const Notifications = lazy(() => import('./pages/student/Notifications'));

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
}

function RouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center text-ink-400">
      Loading…
    </div>
  );
}

// In dev, the app is served at the root of the Vite dev server (localhost:5173/).
// In a production build under XAMPP, it's served from a subfolder
// (htdocs/sams/), so React Router needs to know that prefix - otherwise
// the address bar drops it after client-side navigation, and refreshing
// on any route 404s because Apache looks outside the folder covered by
// its .htaccess rewrite rule. This must stay in sync with vite.config.ts's
// `base` setting - both read the same VITE_BASE_PATH override if set.
const rawBase = import.meta.env.VITE_BASE_PATH || (import.meta.env.PROD ? '/sams/' : '/');
const basename = rawBase.endsWith('/') && rawBase !== '/' ? rawBase.slice(0, -1) : rawBase;

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <ToastProvider>
      <AuthProvider>
        <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/courses" element={<ProtectedRoute roles={['admin']}><AdminCourses /></ProtectedRoute>} />
          <Route path="/admin/roster" element={<ProtectedRoute roles={['admin']}><ManageRoster /></ProtectedRoute>} />

          <Route path="/lecturer" element={<ProtectedRoute roles={['lecturer']}><LecturerDashboard /></ProtectedRoute>} />
          <Route path="/lecturer/attendance" element={<ProtectedRoute roles={['lecturer']}><RecordAttendance /></ProtectedRoute>} />
          <Route path="/lecturer/analytics" element={<ProtectedRoute roles={['lecturer', 'admin']}><Analytics /></ProtectedRoute>} />
          <Route path="/lecturer/roster" element={<ProtectedRoute roles={['lecturer']}><ManageRoster /></ProtectedRoute>} />

          <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/notifications" element={<ProtectedRoute roles={['student']}><Notifications /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
