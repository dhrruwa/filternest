import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';

import { useAuthStore } from './context/authStore';
import { isAdmin } from './utils/auth';

import './styles/globals.css';

import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

// Protected Route — admin only
const ProtectedRoute = ({ element }) => {
  const { user, role } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin(role)) {
    toast.error('Access Denied — Admin account required');
    return <Navigate to="/login" replace />;
  }

  return element;
};

function App() {
  const { user, hydrateFromStorage } = useAuthStore();

  useEffect(() => {
    const handleStorage = () => hydrateFromStorage();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [hydrateFromStorage]);

  return (
    <Router>
      <Toaster position="top-right" />

      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected Admin Routes */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute element={<AdminDashboard />} />}
        />

        <Route
          path="/customers"
          element={<ProtectedRoute element={<AdminDashboard />} />}
        />

        <Route
          path="/agents"
          element={<ProtectedRoute element={<AdminDashboard />} />}
        />

        <Route
          path="/bookings"
          element={<ProtectedRoute element={<AdminDashboard />} />}
        />

        <Route
          path="/payments"
          element={<ProtectedRoute element={<AdminDashboard />} />}
        />

        <Route
          path="/reports"
          element={<ProtectedRoute element={<AdminDashboard />} />}
        />

        {/* Root redirects */}
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
        />

        {/* Unknown Routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
