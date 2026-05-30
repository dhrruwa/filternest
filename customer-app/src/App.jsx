import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Services from './pages/Services';
import About from './pages/About';
import Contact from './pages/Contact';
import BookService from './pages/BookService';
import CustomerDashboard from './pages/Dashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import FAQ from './pages/FAQ';
import SupportCenter from './pages/SupportCenter';
import Documentation from './pages/Documentation';
import BookingGuide from './pages/BookingGuide';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AgentApply from './pages/AgentApply';
import NotFound from './pages/NotFound';

import { useAuthStore } from './context/authStore';

import './styles/globals.css';
import 'leaflet/dist/leaflet.css';

import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

// Protected Route — customer only
const ProtectedRoute = ({ element }) => {
  const { user, role } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'customer') {
    toast.error('Access Denied — Customer account required');
    return <Navigate to="/" replace />;
  }

  return element;
};

function App() {
  const { user, role, hydrateFromStorage } = useAuthStore();

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
        <Route path="/" element={<Home />} />

        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />

        <Route
          path="/register"
          element={user ? <Navigate to="/" replace /> : <Register />}
        />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/support" element={<SupportCenter />} />
        <Route path="/docs" element={<Documentation />} />
        <Route path="/guide" element={<BookingGuide />} />
        <Route path="/technician-application" element={<AgentApply />} />

        {/* Protected Customer Routes */}
        <Route
          path="/book-service"
          element={<ProtectedRoute element={<BookService />} />}
        />

        <Route
          path="/my-bookings"
          element={<ProtectedRoute element={<CustomerDashboard />} />}
        />

        <Route
          path="/dashboard"
          element={<ProtectedRoute element={<CustomerDashboard />} />}
        />

        {/* Unknown Routes Redirect */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
