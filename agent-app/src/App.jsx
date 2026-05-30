import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import AgentDashboard from './pages/AgentDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import AgentApply from './pages/AgentApply';

import { useAuthStore } from './context/authStore';

import './styles/globals.css';
import 'leaflet/dist/leaflet.css';

import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

// Protected Route — agent only
const ProtectedRoute = ({ element }) => {
  const { user, role } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'agent') {
    toast.error('Access Denied — Agent account required');
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
        <Route path="/technician-application" element={<AgentApply />} />

        {/* Protected Agent Routes */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute element={<AgentDashboard />} />}
        />

        <Route
          path="/jobs"
          element={<ProtectedRoute element={<AgentDashboard />} />}
        />

        <Route
          path="/attendance"
          element={<ProtectedRoute element={<AgentDashboard />} />}
        />

        <Route
          path="/earnings"
          element={<ProtectedRoute element={<AgentDashboard />} />}
        />

        <Route
          path="/profile"
          element={<ProtectedRoute element={<AgentDashboard />} />}
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
