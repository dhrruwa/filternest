import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BookingTracker from '../components/BookingTracker';
import { bookingService, customerService } from '../services/services';
import { useAuthStore } from '../context/authStore';
import toast from 'react-hot-toast';
import SecurityDashboard from '../components/SecurityDashboard';

import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiUser,
  FiMap,
  FiSettings,
} from 'react-icons/fi';

const CustomerDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [isLoading, setIsLoading] = useState(true);

  // Cinematic Intro Overlay states
  const [showIntroOverlay, setShowIntroOverlay] = useState(
    location.state?.fromLoginTransition || false
  );
  const [introBubbles, setIntroBubbles] = useState([]);

  // Spawn bubbles inside overlay and handle exit timeout
  useEffect(() => {
    if (!showIntroOverlay) return;

    const bubbleInterval = setInterval(() => {
      setIntroBubbles((prev) => [
        ...prev.slice(-25),
        {
          id: Math.random(),
          size: Math.random() * 10 + 4,
          left: Math.random() * 95,
          delay: Math.random() * 0.3,
          duration: Math.random() * 2 + 1.2,
        }
      ]);
    }, 150);

    const timeout = setTimeout(() => {
      setShowIntroOverlay(false);
      window.history.replaceState({}, document.title);
    }, 1800);

    return () => {
      clearInterval(bubbleInterval);
      clearTimeout(timeout);
    };
  }, [showIntroOverlay]);
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsData, setSettingsData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
    }
  });

  useEffect(() => {
    if (profile) {
      setSettingsData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        address: {
          street: profile.address?.street || '',
          city: profile.address?.city || '',
          state: profile.address?.state || '',
          pincode: profile.address?.pincode || '',
          country: profile.address?.country || 'India',
        },
        preferences: {
          emailNotifications: profile.preferences?.emailNotifications !== false,
          smsNotifications: profile.preferences?.smsNotifications !== false,
          pushNotifications: profile.preferences?.pushNotifications !== false,
        }
      });
    }
  }, [profile]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await customerService.updateProfile({
        firstName: settingsData.firstName,
        lastName: settingsData.lastName,
        phone: settingsData.phone,
        address: settingsData.address,
        preferences: settingsData.preferences,
      });

      setProfile(prev => ({
        ...prev,
        firstName: settingsData.firstName,
        lastName: settingsData.lastName,
        phone: settingsData.phone,
        address: settingsData.address,
        preferences: settingsData.preferences,
      }));

      toast.success('Profile settings updated successfully');
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Failed to update customer profile:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch Dashboard Data
  const fetchDashboardData = async () => {
    try {
      const [bookingsResponse, profileResponse] = await Promise.all([
        bookingService.getCustomerBookings(),
        customerService.getProfile(),
      ]);

      setBookings(bookingsResponse.data || []);
      setProfile(profileResponse.data);
    } catch (error) {
      console.log(error);
      toast.error('Failed to load dashboard data');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto refresh every 10 sec
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Booking Filters
  const activeBookings = bookings.filter(
    (b) => !['completed', 'cancelled'].includes(b.status)
  );

  const completedBookings = bookings.filter((b) => b.status === 'completed');
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled');

  // Stats Configuration
  const stats = [
    {
      label: 'Total Bookings',
      value: bookings.length,
      icon: FiCalendar,
      accentColor: 'text-primary border-primary/20 bg-primary/5',
    },
    {
      label: 'Active Bookings',
      value: activeBookings.length,
      icon: FiClock,
      accentColor: 'text-secondary border-secondary/20 bg-secondary/5',
    },
    {
      label: 'Completed Services',
      value: completedBookings.length,
      icon: FiCheckCircle,
      accentColor: 'text-emerald-700 border-emerald-500/20 bg-emerald-500/5',
    },
    {
      label: 'Cancelled Bookings',
      value: cancelledBookings.length,
      icon: FiAlertCircle,
      accentColor: 'text-error border-error/20 bg-error/5',
    },
  ];

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f6]">
        <Navbar />

        <div className="flex flex-col items-center justify-center h-[70vh]">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
          <p className="text-xs font-semibold tracking-wider uppercase text-on-surface-variant animate-pulse">
            Retrieving Dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Tabs Filter
  const filteredBookings =
    activeTab === 'active'
      ? activeBookings
      : activeTab === 'completed'
        ? completedBookings
        : cancelledBookings;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.08,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-on-surface relative overflow-hidden">
      {/* Intro Liquid Morph Overlay */}
      <AnimatePresence>
        {showIntroOverlay && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="fixed inset-0 z-[9999] bg-gradient-to-tr from-blue-600 via-cyan-500 to-sky-400 flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Custom local animation styles for dashboard wave/bubbles */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes dash-wave {
                0% { transform: translateY(0) scaleY(1); }
                50% { transform: translateY(-10px) scaleY(1.05); }
                100% { transform: translateY(0) scaleY(1); }
              }
              @keyframes dash-bubble {
                0% { transform: translateY(0) scale(0.8); opacity: 0.2; }
                50% { opacity: 0.6; }
                100% { transform: translateY(-105vh) scale(1.1); opacity: 0; }
              }
              .animate-dash-wave {
                animation: dash-wave 6s ease-in-out infinite;
              }
              .animate-dash-bubble {
                animation: dash-bubble 3.5s ease-in-out infinite;
              }
            `}} />

            {/* Dynamic SVG Wave Backgrounds */}
            <svg className="absolute inset-x-0 bottom-0 w-full h-[60vh] fill-white/10 animate-dash-wave pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path d="M0,192L48,197.3C96,203,192,213,288,208C384,203,480,181,576,181.3C672,181,768,203,864,197.3C960,192,1056,160,1152,144C1248,128,1344,128,1392,128L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
            <svg className="absolute inset-x-0 bottom-[-5vh] w-full h-[55vh] fill-white/15 animate-dash-wave pointer-events-none" style={{ animationDelay: '2s' }} viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path d="M0,96L48,112C96,128,192,160,288,181.3C384,203,480,213,576,192C672,171,768,117,864,106.7C960,96,1056,128,1152,149.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>

            {/* Rising Bubbles */}
            {introBubbles.map((bubble) => (
              <span
                key={bubble.id}
                className="absolute bg-white/35 rounded-full border border-white/15 animate-dash-bubble pointer-events-none"
                style={{
                  width: `${bubble.size}px`,
                  height: `${bubble.size}px`,
                  left: `${bubble.left}%`,
                  bottom: `-20px`,
                  animationDelay: `${bubble.delay}s`,
                  animationDuration: `${bubble.duration}s`,
                }}
              />
            ))}

            {/* Glowing Brand Greeting */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-center space-y-4"
            >
              <h1 className="text-white text-4xl md:text-5xl font-black font-headline-xl tracking-tight drop-shadow-[0_4px_16px_rgba(2,132,199,0.3)]">
                Welcome back to FilterNest
              </h1>
              <p className="text-white/80 font-bold uppercase tracking-widest text-xs">
                Your pure water sanctuary awaits
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar />

      <motion.section 
        variants={containerVariants}
        initial={location.state?.fromLoginTransition ? "hidden" : "show"}
        animate="show"
        className="pt-16 pb-24 px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto"
      >
        <motion.div variants={itemVariants} className="space-y-10">

          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <h1 className="font-headline-xl text-headline-xl text-primary text-shadow-subtle">
                Welcome, {profile?.firstName ? (profile.firstName.charAt(0).toUpperCase() + profile.firstName.slice(1)) : 'Valued Customer'}
              </h1>
              <p className="text-on-surface-variant text-body-md mt-2">
                Manage your scheduled purifiers, active bookings, and system history.
              </p>
            </div>

            <button
              onClick={() => navigate('/book-service')}
              className="bg-primary hover:bg-[#853a01] text-on-primary font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 self-start md:self-center flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Book Service
            </button>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="glass-card p-6 rounded-3xl border border-outline-variant/30 relative overflow-hidden group transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-bold text-on-surface mt-2">
                        {stat.value}
                      </p>
                    </div>

                    <div className={`p-3.5 rounded-2xl border ${stat.accentColor} transition-transform duration-300 group-hover:scale-110`}>
                      <Icon size={24} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Core Panel Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
            
            {/* Booking Schedule Panel */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="glass-card p-6 md:p-8 rounded-3xl border border-outline-variant/30"
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      receipt_long
                    </span>
                    <h2 className="font-headline-md text-headline-md text-primary">
                      My Booking History
                    </h2>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-8 border-b border-outline-variant/30 overflow-x-auto scrollbar-none">
                  {[
                    { id: 'active', label: 'Active Schedule', count: activeBookings.length },
                    { id: 'completed', label: 'Completed', count: completedBookings.length },
                    { id: 'cancelled', label: 'Cancelled', count: cancelledBookings.length },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-5 py-4 font-semibold text-xs transition-all duration-300 relative whitespace-nowrap uppercase tracking-wider ${
                        activeTab === tab.id
                          ? 'text-primary font-bold'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span>{tab.label} ({tab.count})</span>

                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Booking List */}
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-16">
                    <span className="material-symbols-outlined text-5xl text-outline mb-4">
                      event_busy
                    </span>
                    <p className="text-on-surface-variant text-sm mb-6 leading-relaxed max-w-xs mx-auto">
                      No {activeTab} service bookings found in your schedule.
                    </p>

                    <button
                      onClick={() => navigate('/book-service')}
                      className="text-primary font-bold hover:text-[#853a01] transition flex items-center justify-center gap-1 mx-auto hover:underline text-sm"
                    >
                      Create your first booking
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredBookings.map((booking) => (
                      <BookingTracker
                        key={booking._id}
                        booking={booking}
                        onBookingUpdated={fetchDashboardData}
                      />
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Security Session Dashboard */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="glass-card p-6 md:p-8 rounded-3xl border border-outline-variant/30 mt-6"
              >
                <SecurityDashboard />
              </motion.div>
            </div>

            {/* Profile Panel */}
            <div className="lg:col-span-1">
              {profile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="glass-card p-6 md:p-8 rounded-3xl border border-outline-variant/30 space-y-6"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-2xl">
                        account_circle
                      </span>
                      <h2 className="font-headline-md text-headline-md text-primary">
                        Profile Card
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowSettingsModal(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/60 backdrop-blur-md border border-outline-variant/30 text-primary rounded-xl font-label-md text-xs hover:bg-primary hover:text-on-primary active:scale-95 transition-all shadow-sm group"
                    >
                      <FiSettings size={13} className="group-hover:rotate-45 transition-transform duration-300" />
                      Edit Profile
                    </button>
                  </div>

                  <div className="flex flex-col items-center py-4 border-b border-outline-variant/10">
                    <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-md bg-primary/10 overflow-hidden flex items-center justify-center">
                      {profile.profileImage ? (
                        <img src={profile.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary font-bold text-3xl uppercase">
                          {profile.firstName?.[0] || 'U'}{profile.lastName?.[0] || ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-2 font-semibold">Customer Account Workspace</p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-surface-container-low border border-outline-variant/20 p-4 rounded-xl">
                      <p className="text-on-surface-variant text-[10px] font-semibold uppercase tracking-wider">
                        Full Name
                      </p>
                      <p className="text-on-surface font-semibold text-sm mt-1">
                        {profile.firstName} {profile.lastName}
                      </p>
                    </div>

                    <div className="bg-surface-container-low border border-outline-variant/20 p-4 rounded-xl">
                      <p className="text-on-surface-variant text-[10px] font-semibold uppercase tracking-wider">
                        Email Address
                      </p>
                      <p className="text-on-surface font-semibold text-xs mt-1 break-all">
                        {profile.email}
                      </p>
                    </div>

                    <div className="bg-surface-container-low border border-outline-variant/20 p-4 rounded-xl">
                      <p className="text-on-surface-variant text-[10px] font-semibold uppercase tracking-wider">
                        Phone Number
                      </p>
                      <p className="text-on-surface font-semibold text-sm mt-1">
                        {profile.phone}
                      </p>
                    </div>

                    {profile.address && (
                      <div className="bg-surface-container-low border border-outline-variant/20 p-4 rounded-xl">
                        <p className="text-on-surface-variant text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-xs">pin_drop</span>
                          Verified Service Address
                        </p>
                        <p className="text-on-surface font-medium text-xs mt-1.5 leading-relaxed">
                          {profile.address.street}, {profile.address.city}, {profile.address.state} - {profile.address.pincode}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

          </div>
        </motion.div>
      </motion.section>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsModal(false)}
              className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative z-10 w-full max-w-md bg-[#faf9f6]/95 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-outline-variant/20">
                <h3 className="text-2xl font-bold text-primary font-headline-md flex items-center gap-2">
                  <FiSettings className="text-primary" /> Settings
                </h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-on-surface-variant hover:text-primary transition-colors text-xl font-semibold focus:outline-none"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* Personal Details */}
                <div className="space-y-4">
                  <h4 className="text-label-sm font-bold text-secondary uppercase tracking-wider">
                    Personal Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-primary mb-1">First Name</label>
                      <input
                        type="text"
                        required
                        value={settingsData.firstName}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-outline rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-primary mb-1">Last Name</label>
                      <input
                        type="text"
                        required
                        value={settingsData.lastName}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-outline rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-primary mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={settingsData.phone}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-outline rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Service Address */}
                <div className="space-y-4">
                  <h4 className="text-label-sm font-bold text-secondary uppercase tracking-wider">
                    Service Address
                  </h4>
                  <div>
                    <label className="block text-[11px] font-semibold text-primary mb-1">Street Address</label>
                    <input
                      type="text"
                      value={settingsData.address.street}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, address: { ...prev.address, street: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-outline rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-primary mb-1">City</label>
                      <input
                        type="text"
                        value={settingsData.address.city}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, address: { ...prev.address, city: e.target.value } }))}
                        className="w-full px-3 py-2 bg-white border border-outline rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-primary mb-1">State</label>
                      <input
                        type="text"
                        value={settingsData.address.state}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, address: { ...prev.address, state: e.target.value } }))}
                        className="w-full px-3 py-2 bg-white border border-outline rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-primary mb-1">Pincode</label>
                    <input
                      type="text"
                      value={settingsData.address.pincode}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, address: { ...prev.address, pincode: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-outline rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Notifications */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-label-sm font-bold text-secondary uppercase tracking-wider">
                    Notification Preferences
                  </h4>
                  
                  {/* Email Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-semibold text-sm">Email Alerts</span>
                    <button
                      type="button"
                      onClick={() => setSettingsData(prev => ({ ...prev, preferences: { ...prev.preferences, emailNotifications: !prev.preferences.emailNotifications } }))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settingsData.preferences.emailNotifications ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settingsData.preferences.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* SMS Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-semibold text-sm">SMS Alerts</span>
                    <button
                      type="button"
                      onClick={() => setSettingsData(prev => ({ ...prev, preferences: { ...prev.preferences, smsNotifications: !prev.preferences.smsNotifications } }))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settingsData.preferences.smsNotifications ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settingsData.preferences.smsNotifications ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Push Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-semibold text-sm">Push Notifications</span>
                    <button
                      type="button"
                      onClick={() => setSettingsData(prev => ({ ...prev, preferences: { ...prev.preferences, pushNotifications: !prev.preferences.pushNotifications } }))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settingsData.preferences.pushNotifications ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settingsData.preferences.pushNotifications ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-gradient-primary text-on-primary font-label-md text-label-md py-3.5 rounded-xl shadow-md hover:shadow-lg hover:translate-y-[-1px] active:scale-95 transition-all font-bold uppercase tracking-wider mt-4 flex items-center justify-center gap-2"
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default CustomerDashboard;