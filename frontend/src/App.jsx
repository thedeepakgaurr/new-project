import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute, { FullPageLoader, GuestRoute } from './components/ProtectedRoute.jsx';
import PublicLayout from './components/layout/PublicLayout.jsx';
import Home from './pages/Home.jsx';

// Route-level code splitting: the landing page doesn't download the app
const AuthLayout = lazy(() => import('./components/layout/AuthLayout.jsx'));
const AppLayout = lazy(() => import('./components/layout/AppLayout.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Generate = lazy(() => import('./pages/Generate.jsx'));
const Result = lazy(() => import('./pages/Result.jsx'));
const Saved = lazy(() => import('./pages/Saved.jsx'));
const History = lazy(() => import('./pages/History.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

export default function App() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
        </Route>

        <Route
          element={
            <GuestRoute>
              <AuthLayout />
            </GuestRoute>
          }
        >
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/result/:id" element={<Result />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
