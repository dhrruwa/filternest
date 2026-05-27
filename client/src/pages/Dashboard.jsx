import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SecurityDashboard from '../components/SecurityDashboard';
import { customerService, bookingService } from '../services/services';
import { useAuthStore } from '../context/authStore';
import toast from 'react-hot-toast';

import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiUser,
  FiMapPin,
  FiSettings,
  FiCreditCard,
  FiDownload,
  FiSend,
  FiPlus,
  FiStar,
  FiMessageSquare,
  FiBell,
  FiActivity,
  FiPhone,
  FiCpu,
  FiShield,
  FiTrash2,
  FiMenu,
  FiX
} from 'react-icons/fi';

const CustomerDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Active Tab: 'overview', 'bookings', 'invoices', 'payments', 'reminders', 'support', 'profile', 'security'
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [bookingsList, setBookingsList] = useState([]);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(1);
  const [bookingsStatusFilter, setBookingsStatusFilter] = useState('all');
  const [bookingsSearch, setBookingsSearch] = useState('');
  
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  
  // Support Ticketing States
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('technical');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [chatMessageText, setChatMessageText] = useState('');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatBottomRef = useRef(null);

  // Payment checkout states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [checkoutMethod, setCheckoutMethod] = useState('upi');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Reschedule states
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [isProcessingReschedule, setIsProcessingReschedule] = useState(false);

  // Edit profile states
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    alternatePhone: '',
    address: { street: '', city: '', state: '', pincode: '', country: 'India' },
    preferredServiceTimings: { day: 'Anyday', timeSlot: '10:00 AM - 01:00 PM' }
  });

  // Mobile Menu drawer state
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

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

  // Fetch Dashboard Stats and Populate Form
  const loadDashboardData = async () => {
    try {
      const response = await customerService.getDashboard();
      setDashboardData(response.data);

      if (response.data.profile) {
        const p = response.data.profile;
        setProfileForm({
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          phone: p.phone || '',
          alternatePhone: p.alternatePhone || '',
          address: {
            street: p.address?.street || '',
            city: p.address?.city || '',
            state: p.address?.state || '',
            pincode: p.address?.pincode || '',
            country: p.address?.country || 'India'
          },
          preferredServiceTimings: p.preferredServiceTimings || { day: 'Anyday', timeSlot: '10:00 AM - 01:00 PM' }
        });
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      toast.error('Failed to load portal stats');
    }
  };

  // Fetch paginated bookings
  const loadBookings = async () => {
    try {
      const response = await customerService.getBookings({
        page: bookingsPage,
        limit: 4,
        status: bookingsStatusFilter,
        search: bookingsSearch
      });
      setBookingsList(response.data.bookings || []);
      setBookingsTotalPages(response.data.pages || 1);
    } catch (err) {
      console.error('Error loading bookings:', err);
    }
  };

  // Fetch Invoices, Payments, Reminders, Tickets
  const loadEcosystemData = async () => {
    try {
      const [invRes, payRes, remRes, tktRes, notRes] = await Promise.all([
        customerService.getInvoices(),
        customerService.getPayments(),
        customerService.getReminders(),
        customerService.getSupportTickets(),
        customerService.getNotifications()
      ]);
      setInvoices(invRes.data || []);
      setPayments(payRes.data || []);
      setReminders(remRes.data || []);
      setTickets(tktRes.data || []);
      setNotifications(notRes.data || []);

      // Keep active ticket selected if it was active
      if (selectedTicket) {
        const updated = tktRes.data.find(t => t._id === selectedTicket._id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      console.error('Error loading ecosystem data:', err);
    }
  };

  useEffect(() => {
    const initFetch = async () => {
      setIsLoading(true);
      await Promise.all([loadDashboardData(), loadBookings(), loadEcosystemData()]);
      setIsLoading(false);
    };
    initFetch();
  }, []);

  // Sync Bookings when filters or search queries change
  useEffect(() => {
    loadBookings();
  }, [bookingsPage, bookingsStatusFilter, bookingsSearch]);

  // Support chat autoscroll
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages]);

  // Periodic Refresh
  useEffect(() => {
    const timer = setInterval(() => {
      loadDashboardData();
      loadEcosystemData();
    }, 8000);
    return () => clearInterval(timer);
  }, [selectedTicket]);

  // Handle Profile Update
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await customerService.updateProfile(profileForm);
      toast.success('Your corporate profile has been updated!');
      await loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Notification Drawer Actions
  const handleMarkNotificationRead = async (id) => {
    try {
      await customerService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await customerService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Alert dismissed');
      loadDashboardData();
    } catch (err) {
      toast.error('Failed to dismiss alert');
    }
  };

  // Support Ticketing Actions
  const handleCreateSupportTicket = async (e) => {
    e.preventDefault();
    if (!newTicketSubject || !newTicketDesc) {
      toast.error('Please complete all ticket fields');
      return;
    }
    setIsSubmittingTicket(true);
    try {
      const response = await customerService.createSupportTicket({
        category: newTicketCategory,
        subject: newTicketSubject,
        description: newTicketDesc
      });
      toast.success(`Ticket ${response.data.ticketId} opened successfully!`);
      setNewTicketSubject('');
      setNewTicketDesc('');
      setShowNewTicketModal(false);
      await loadEcosystemData();
      setSelectedTicket(response.data);
      setActiveTab('support');
    } catch (err) {
      toast.error('Failed to register ticket');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatMessageText.trim()) return;
    setIsSendingMessage(true);
    try {
      const textToSend = chatMessageText;
      setChatMessageText('');
      
      const response = await customerService.addSupportTicketMessage(selectedTicket._id, textToSend);
      setSelectedTicket(response.data);
      
      // Local immediate message append to avoid latency feel
      setTickets(prev => prev.map(t => t._id === selectedTicket._id ? response.data : t));
      
      // Auto refresh chat thread state after 2.5s to capture simulated bot reply
      setTimeout(async () => {
        const refresh = await customerService.getSupportTickets();
        const updated = refresh.data.find(t => t._id === selectedTicket._id);
        if (updated) setSelectedTicket(updated);
      }, 2500);

    } catch (err) {
      toast.error('Message failed to deliver');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Reminders Snooze & Reschedule Actions
  const handleSnoozeReminder = async (id) => {
    try {
      const response = await customerService.snoozeReminder(id);
      toast.success(response.data.message);
      await loadEcosystemData();
      await loadDashboardData();
    } catch (err) {
      toast.error('Failed to snooze reminder');
    }
  };

  const handleOpenRescheduleModal = (schedule) => {
    setSelectedSchedule(schedule);
    const date = new Date(schedule.nextServiceDate).toISOString().substring(0, 10);
    setRescheduleDate(date);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleDate) return;
    setIsProcessingReschedule(true);
    try {
      const response = await customerService.rescheduleReminder(selectedSchedule._id, rescheduleDate);
      toast.success(response.data.message);
      setShowRescheduleModal(false);
      await loadEcosystemData();
      await loadDashboardData();
    } catch (err) {
      toast.error('Failed to reschedule date');
    } finally {
      setIsProcessingReschedule(false);
    }
  };

  // Payment Simulated Checkout Actions
  const handleOpenCheckout = (invoice) => {
    setSelectedInvoice(invoice);
    setShowCheckoutModal(true);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setIsProcessingCheckout(true);
    try {
      const response = await customerService.simulateCheckout(selectedInvoice._id, checkoutMethod);
      toast.success(response.data.message);
      setShowCheckoutModal(false);
      await loadEcosystemData();
      await loadDashboardData();
      await loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Simulated transaction failed');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const getStatusStyle = (status) => {
    const mapping = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-[#ffdbc9] text-[#753401] border-[#dac2b6]',
      agent_assigned: 'bg-blue-100 text-blue-800 border-blue-200',
      on_the_way: 'bg-purple-100 text-purple-800 border-purple-200',
      in_progress: 'bg-orange-100 text-orange-800 border-orange-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return mapping[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Nav Tabs configuration
  const sidebarTabs = [
    { id: 'overview', label: 'Overview Panel', icon: FiCpu },
    { id: 'bookings', label: 'Service Bookings', icon: FiCalendar },
    { id: 'invoices', label: 'Invoice & Billing', icon: FiCreditCard },
    { id: 'payments', label: 'Receipt Logs', icon: FiCheckCircle },
    { id: 'reminders', label: 'Care Reminders', icon: FiClock },
    { id: 'support', label: 'Helpdesk Chat', icon: FiMessageSquare },
    { id: 'profile', label: 'Device & timings', icon: FiUser },
    { id: 'security', label: 'Portal Security', icon: FiShield }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f6]">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
          <p className="text-xs font-semibold tracking-wider uppercase text-on-surface-variant animate-pulse font-label-md">
            Initializing Care Suite...
          </p>
        </div>
      </div>
    );
  }

  const profile = dashboardData?.profile || {};
  const stats = dashboardData?.stats || {};
  const activeTracker = dashboardData?.activeTracker || null;
  const upcomingService = dashboardData?.upcomingService || null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-on-surface relative overflow-hidden flex flex-col justify-between">
      {/* Intro Liquid Morph Overlay */}
      <AnimatePresence>
        {showIntroOverlay && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="fixed inset-0 z-[9999] bg-gradient-to-tr from-[#6c2f00] via-[#8b4513] to-[#ffdbc9] flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Wave animation CSS */}
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

            {/* Rising Bubbles */}
            {introBubbles.map((bubble) => (
              <span
                key={bubble.id}
                className="absolute bg-white/20 rounded-full border border-white/10 animate-dash-bubble pointer-events-none"
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
              className="text-center space-y-4 px-6"
            >
              <h1 className="text-white text-3xl md:text-5xl font-bold font-headline-xl tracking-tight drop-shadow-md">
                FilterNest Care Suite+
              </h1>
              <p className="text-white/80 font-bold uppercase tracking-widest text-xs font-label-md">
                Your Luxury Water Sanctuary
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar />

      <div className="pt-24 pb-20 px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto w-full flex-1">
        
        {/* Dynamic Upper greeting bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-outline-variant/30 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-headline-xl text-2xl md:text-3xl font-bold text-primary">
                Good day, {profile.firstName || 'Valued Customer'}
              </h1>
              <span className="bg-[#f3e2ac] text-[#706439] border border-[#d6c692] text-[10px] font-bold px-2.5 py-0.5 rounded-full font-label-md uppercase tracking-wider">
                {profile.membershipStatus} Club+
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-label-md mt-1">
              Active Purifiers: {profile.purifierDetails?.modelName || 'FilterNest Premium Classic'}
            </p>
          </div>
          
          <div className="flex items-center gap-3 self-start md:self-center">
            {/* Bell trigger */}
            <button
              onClick={() => setShowNotificationsDrawer(true)}
              className="relative p-3 bg-white/60 backdrop-blur-md border border-outline-variant/30 text-primary rounded-full hover:bg-primary hover:text-on-primary transition-all duration-300 shadow-sm"
            >
              <FiBell size={18} />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white font-bold text-[9px] rounded-full flex items-center justify-center border border-white animate-bounce">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>

            {/* Quick service book */}
            <button
              onClick={() => navigate('/book-service')}
              className="bg-primary hover:bg-[#853a01] text-on-primary font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-102 flex items-center gap-2 font-label-md"
            >
              <FiPlus size={14} /> Book Care Service
            </button>
          </div>
        </div>

        {/* Unified Layout: Left Sidebar + Right Display Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-gutter items-start">
          
          {/* Side Tabs Navigation (Hidden on mobile and shown as header lists) */}
          <div className="hidden lg:block lg:col-span-1 space-y-2">
            <div className="glass-card p-4 rounded-3xl border border-outline-variant/30 bg-white/40 backdrop-blur-md">
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest px-3 mb-4 font-label-md">Navigation Workspace</p>
              <div className="space-y-1">
                {sidebarTabs.map(tab => {
                  const Icon = tab.icon;
                  const isSelected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                        isSelected 
                          ? 'bg-primary text-on-primary shadow-md font-bold' 
                          : 'text-[#6a5e33] hover:bg-[#ffdbc9]/40 hover:text-primary'
                      }`}
                    >
                      <Icon size={16} />
                      <span className="font-label-md">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile Horizontal scroll tab list */}
          <div className="lg:hidden col-span-1 overflow-x-auto flex gap-2 pb-3 mb-4 scrollbar-none border-b border-outline-variant/10">
            {sidebarTabs.map(tab => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 border ${
                    isSelected
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-white text-secondary border-[#dac2b6]/40'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel Screen */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                
                {/* 1. OVERVIEW PANEL */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    
                    {/* Welcome Purifier status gauge Hero */}
                    <div className="glass-card p-6 md:p-8 rounded-3xl border border-outline-variant/30 bg-gradient-to-tr from-white via-white to-[#ffdbc9]/20 shadow-md relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-32 h-32 bg-[#ffdbc9] rounded-full filter blur-3xl opacity-35 pointer-events-none"></div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="md:col-span-2 space-y-4">
                          <h2 className="font-headline-md text-xl md:text-2xl text-primary font-bold">Your water purifier health report</h2>
                          <p className="text-xs text-on-surface-variant font-medium leading-relaxed font-label-md">
                            Smart Diagnostics synced with FilterNest Care+. The sensor detects premium TDS health and filtration active membrane performance.
                          </p>
                          <div className="text-xs text-on-surface-variant flex items-center gap-1.5 pt-2">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                            <span className="font-bold text-emerald-700">All Filtration Systems Optimal</span>
                          </div>
                        </div>

                        {/* Visual Purifier Health Score Rings */}
                        <div className="flex justify-around items-center gap-4">
                          <div className="flex flex-col items-center">
                            {/* TDS Health score visual Ring */}
                            <div className="relative w-18 h-18 rounded-full border-4 border-[#ffdbc9]/30 flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90 absolute">
                                <circle cx="36" cy="36" r="30" stroke="#dac2b6" strokeWidth="4" fill="transparent" />
                                <circle cx="36" cy="36" r="30" stroke="#6c2f00" strokeWidth="4" fill="transparent" strokeDasharray="188.4" strokeDashoffset={188.4 * (1 - 0.98)} />
                              </svg>
                              <span className="text-sm font-bold text-primary font-headline-md">98%</span>
                            </div>
                            <span className="text-[9px] font-bold text-secondary uppercase mt-2 font-label-md">TDS PURITY</span>
                          </div>
                          
                          <div className="flex flex-col items-center">
                            {/* Filter life circle indicator */}
                            <div className="relative w-18 h-18 rounded-full border-4 border-[#ffdbc9]/30 flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90 absolute">
                                <circle cx="36" cy="36" r="30" stroke="#dac2b6" strokeWidth="4" fill="transparent" />
                                <circle cx="36" cy="36" r="30" stroke="#6a5e33" strokeWidth="4" fill="transparent" strokeDasharray="188.4" strokeDashoffset={188.4 * (1 - 0.94)} />
                              </svg>
                              <span className="text-sm font-bold text-secondary font-headline-md">94%</span>
                            </div>
                            <span className="text-[9px] font-bold text-secondary uppercase mt-2 font-label-md">FILTER LIFE</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dashboard Animated stats counters */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { label: 'Total Services Booked', value: stats.totalBookings || 0, icon: FiCalendar, color: 'from-[#6c2f00]/5 to-[#6c2f00]/10 border-[#dac2b6]' },
                        { label: 'Active Services', value: stats.activeServices || 0, icon: FiClock, color: 'from-[#6a5e33]/5 to-[#6a5e33]/10 border-[#d6c692]' },
                        { label: 'Completed Services', value: stats.completedServices || 0, icon: FiCheckCircle, color: 'from-emerald-50 to-emerald-100/50 border-emerald-200' },
                        { label: 'Pending Payments', value: `₹${stats.pendingPayments || 0}`, icon: FiCreditCard, color: 'from-yellow-50 to-yellow-100/50 border-yellow-200' },
                        { label: 'Total Money Spent', value: `₹${stats.totalMoneySpent || 0}`, icon: FiActivity, color: 'from-blue-50 to-blue-100/50 border-blue-200' },
                        { label: 'Next Service Date', value: stats.nextMaintenanceDate ? new Date(stats.nextMaintenanceDate).toLocaleDateString() : 'N/A', icon: FiCalendar, color: 'from-purple-50 to-purple-100/50 border-purple-200' }
                      ].map((card, idx) => {
                        const Icon = card.icon;
                        return (
                          <motion.div
                            key={idx}
                            whileHover={{ y: -3, scale: 1.01 }}
                            className={`p-5 rounded-2xl border bg-gradient-to-tr ${card.color} shadow-sm transition-all duration-300 flex flex-col justify-between h-28`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-[#6a5e33] font-bold uppercase tracking-wider font-label-md max-w-[130px]">{card.label}</span>
                              <Icon className="text-primary opacity-60" size={14} />
                            </div>
                            <span className="text-xl font-bold text-shadow-subtle mt-2">{card.value}</span>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Live Tracker display */}
                    {activeTracker ? (
                      <div className="glass-card p-6 md:p-8 rounded-3xl border border-outline-variant/30 bg-white">
                        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/15 mb-6">
                          <div>
                            <span className="text-[9px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase font-label-md tracking-wider">
                              Real-Time Tracker
                            </span>
                            <h3 className="text-sm font-bold text-shadow-subtle mt-2 uppercase tracking-wide">
                              Live Service Timeline: {activeTracker.serviceType?.replace(/_/g, ' ')}
                            </h3>
                          </div>
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase ${getStatusStyle(activeTracker.status)}`}>
                            {activeTracker.status?.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* 5-Stage Stepper timeline */}
                        <div className="grid grid-cols-5 gap-2 relative py-4 mb-6">
                          {/* Timeline background bar */}
                          <div className="absolute top-8 left-[10%] right-[10%] h-1 bg-[#dac2b6]/35 -z-0"></div>
                          
                          {[
                            { label: 'Confirmed', check: ['confirmed', 'agent_assigned', 'on_the_way', 'in_progress', 'completed'].includes(activeTracker.status) },
                            { label: 'Assigned', check: ['agent_assigned', 'on_the_way', 'in_progress', 'completed'].includes(activeTracker.status) },
                            { label: 'On The Way', check: ['on_the_way', 'in_progress', 'completed'].includes(activeTracker.status) },
                            { label: 'In Progress', check: ['in_progress', 'completed'].includes(activeTracker.status) },
                            { label: 'Completed', check: activeTracker.status === 'completed' }
                          ].map((step, sIdx) => (
                            <div key={sIdx} className="flex flex-col items-center text-center z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                step.check ? 'bg-primary text-white shadow-md' : 'bg-white text-secondary border border-outline-variant/60'
                              }`}>
                                {step.check ? <FiCheckCircle size={14} /> : <span className="text-xs font-bold">{sIdx + 1}</span>}
                              </div>
                              <span className="text-[8px] font-bold text-secondary uppercase mt-2 max-w-[80px] font-label-md">{step.label}</span>
                            </div>
                          ))}
                        </div>

                        {/* Assigned Technician details */}
                        {activeTracker.assignedAgent ? (
                          <div className="bg-[#faf9f6] border border-outline-variant/35 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-primary/10 rounded-full border border-primary/20 flex items-center justify-center font-bold text-primary uppercase text-sm">
                                {activeTracker.assignedAgent.profileImage ? (
                                  <img src={activeTracker.assignedAgent.profileImage} className="w-full h-full object-cover rounded-full" alt="" />
                                ) : (
                                  `${activeTracker.assignedAgent.firstName?.[0] || 'T'}${activeTracker.assignedAgent.lastName?.[0] || ''}`
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-shadow-subtle">{activeTracker.assignedAgent.firstName} {activeTracker.assignedAgent.lastName}</p>
                                <p className="text-[10px] text-on-surface-variant font-medium mt-0.5 font-label-md">Filter Specialist Expert (Certified)</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <a
                                href={`tel:${activeTracker.assignedAgent.phone}`}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#6c2f00] hover:bg-[#853a01] text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase font-label-md shadow-sm transition-all"
                              >
                                <FiPhone size={10} /> Call Technician
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-[#faf9f6] border border-dashed border-outline-variant/40 p-4 rounded-2xl text-center">
                            <p className="text-xs text-on-surface-variant font-semibold">Technician allocation in progress...</p>
                            <p className="text-[9px] text-[#6a5e33] mt-1 font-label-md">Pairing you with the closest certified RO service specialist.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="glass-card p-6 md:p-8 rounded-3xl border border-dashed border-outline-variant/40 text-center py-10 bg-white/40">
                        <FiActivity size={24} className="mx-auto text-secondary mb-2 animate-pulse" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-secondary">No active filter care schedules</h4>
                        <p className="text-[10px] text-on-surface-variant mt-1.5 font-label-md">All systems run perfectly. Book a general service to perform RO flushing.</p>
                        <button
                          onClick={() => setActiveTab('bookings')}
                          className="text-primary font-bold text-xs hover:underline mt-4 inline-flex items-center gap-1 font-label-md"
                        >
                          View previous bookings <FiCalendar size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. BOOKINGS & SERVICE HISTORY */}
                {activeTab === 'bookings' && (
                  <div className="glass-card p-6 md:p-8 rounded-3xl border border-outline-variant/30 bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline-variant/20 mb-6 gap-4">
                      <h2 className="font-headline-md text-xl text-primary font-bold">Service Bookings</h2>
                      
                      {/* Bookings filters */}
                      <div className="flex flex-wrap gap-2 items-center">
                        <select
                          value={bookingsStatusFilter}
                          onChange={(e) => { setBookingsStatusFilter(e.target.value); setBookingsPage(1); }}
                          className="bg-[#faf9f6] border border-outline-variant/40 rounded-xl text-xs py-2 px-3 focus:outline-none"
                        >
                          <option value="all">All bookings</option>
                          <option value="active">Active schedules</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Search service..."
                          value={bookingsSearch}
                          onChange={(e) => { setBookingsSearch(e.target.value); setBookingsPage(1); }}
                          className="bg-[#faf9f6] border border-outline-variant/40 rounded-xl text-xs py-2 px-3 focus:outline-none w-40"
                        />
                      </div>
                    </div>

                    {bookingsList.length === 0 ? (
                      <div className="text-center py-16">
                        <FiCalendar size={32} className="mx-auto text-secondary/30 mb-2" />
                        <p className="text-xs text-on-surface-variant font-label-md">No matching filter care schedules found.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {bookingsList.map(booking => (
                          <div
                            key={booking._id}
                            className="border border-outline-variant/30 rounded-2xl p-5 hover:bg-[#faf9f6]/30 transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusStyle(booking.status)}`}>
                                  {booking.status?.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[10px] text-on-surface-variant font-mono font-bold">ID: {booking._id.slice(-8).toUpperCase()}</span>
                              </div>
                              <h4 className="text-sm font-bold text-shadow-subtle capitalize">{booking.serviceType?.replace(/_/g, ' ')}</h4>
                              <p className="text-[10px] text-on-surface-variant font-label-md flex items-center gap-1">
                                <FiClock /> Scheduled: {new Date(booking.bookingDate).toLocaleDateString()}
                              </p>
                              {booking.serviceLocation?.address && (
                                <p className="text-[9px] text-[#6a5e33] font-label-md flex items-center gap-1">
                                  <FiMapPin /> {booking.serviceLocation.address.street}, {booking.serviceLocation.address.city}
                                </p>
                              )}
                            </div>

                            {/* Booking secondary actions */}
                            <div className="flex items-center gap-2 w-full md:w-auto self-end md:self-center">
                              {booking.invoice && (
                                <button
                                  onClick={() => { setActiveTab('invoices'); }}
                                  className="flex-1 md:flex-none border border-outline-variant text-[#6a5e33] hover:text-primary px-3 py-2 rounded-xl text-[10px] font-bold uppercase font-label-md text-center"
                                >
                                  Invoice
                                </button>
                              )}
                              <button
                                onClick={() => { setSelectedTicket({ description: `Inquiry on booking reference ID ${booking._id}`, messages: [] }); setActiveTab('support'); }}
                                className="flex-1 md:flex-none bg-primary text-on-primary hover:bg-[#853a01] px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase font-label-md text-center shadow-sm"
                              >
                                Support
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Pagination control */}
                        {bookingsTotalPages > 1 && (
                          <div className="flex items-center justify-between pt-4 border-t border-outline-variant/15 text-xs font-label-md">
                            <button
                              disabled={bookingsPage <= 1}
                              onClick={() => setBookingsPage(prev => prev - 1)}
                              className="px-3 py-1.5 border border-outline-variant rounded-xl disabled:opacity-50 text-[10px] font-bold uppercase"
                            >
                              Prev
                            </button>
                            <span>Page {bookingsPage} of {bookingsTotalPages}</span>
                            <button
                              disabled={bookingsPage >= bookingsTotalPages}
                              onClick={() => setBookingsPage(prev => prev + 1)}
                              className="px-3 py-1.5 border border-outline-variant rounded-xl disabled:opacity-50 text-[10px] font-bold uppercase"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. INVOICES & BILLING */}
                {activeTab === 'invoices' && (
                  <div className="glass-card p-6 md:p-8 rounded-3xl border border-outline-variant/30 bg-white">
                    <div className="pb-4 border-b border-outline-variant/20 mb-6">
                      <h2 className="font-headline-md text-xl text-primary font-bold">Invoices & Billing</h2>
                      <p className="text-[10px] text-on-surface-variant font-label-md mt-1">Download and settle filter care invoice statements</p>
                    </div>

                    {invoices.length === 0 ? (
                      <div className="text-center py-16">
                        <FiCreditCard size={32} className="mx-auto text-secondary/30 mb-2" />
                        <p className="text-xs text-on-surface-variant font-label-md">No invoices recorded in billing history.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {invoices.map(inv => (
                          <div
                            key={inv._id}
                            className="border border-outline-variant/30 rounded-2xl p-5 bg-[#faf9f6]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-sm transition-all"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                                  inv.paymentStatus === 'completed' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                }`}>
                                  {inv.paymentStatus}
                                </span>
                                <span className="text-[10px] font-mono text-on-surface-variant font-bold">{inv.invoiceNumber}</span>
                              </div>
                              <h4 className="text-sm font-bold text-shadow-subtle mt-2">
                                {inv.booking?.serviceType?.replace(/_/g, ' ') || 'General Filter Care Service'}
                              </h4>
                              <p className="text-[10px] text-[#6a5e33] mt-1 font-label-md">
                                Issued: {new Date(inv.issueDate).toLocaleDateString()} • GST Included
                              </p>
                              <p className="text-sm font-bold text-primary mt-1">INR {inv.total?.toFixed(2)}</p>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto self-end sm:self-center">
                              {inv.paymentStatus !== 'completed' && (
                                <button
                                  onClick={() => handleOpenCheckout(inv)}
                                  className="flex-1 sm:flex-none bg-[#6c2f00] hover:bg-[#853a01] text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase font-label-md shadow-md text-center"
                                >
                                  Settle Payment
                                </button>
                              )}
                              
                              {/* PDF Download anchor */}
                              <a
                                href={customerService.getInvoicePdfUrl(inv._id)}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="flex-1 sm:flex-none border border-outline-variant text-primary hover:bg-[#ffdbc9]/20 px-3.5 py-2.5 rounded-xl text-[10px] font-bold uppercase font-label-md flex items-center justify-center gap-1.5 text-center transition-all"
                              >
                                <FiDownload size={12} /> PDF
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. PAYMENT RECEIPTS LOG */}
                {activeTab === 'payments' && (
                  <div className="glass-card p-6 md:p-8 rounded-3xl border border-outline-variant/30 bg-white">
                    <div className="pb-4 border-b border-outline-variant/20 mb-6">
                      <h2 className="font-headline-md text-xl text-primary font-bold">Transaction History</h2>
                      <p className="text-[10px] text-on-surface-variant font-label-md mt-1">Receipt logs and transaction details</p>
                    </div>

                    {payments.length === 0 ? (
                      <div className="text-center py-16">
                        <FiCheckCircle size={32} className="mx-auto text-secondary/30 mb-2" />
                        <p className="text-xs text-on-surface-variant font-label-md">No transaction receipts logged.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-label-md">
                          <thead>
                            <tr className="border-b border-outline-variant/30 text-[#6a5e33] font-bold">
                              <th className="py-3 px-2">TXN ID</th>
                              <th className="py-3 px-2">METHOD</th>
                              <th className="py-3 px-2">AMOUNT</th>
                              <th className="py-3 px-2">STATUS</th>
                              <th className="py-3 px-2">DATE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payments.map(pay => (
                              <tr key={pay._id} className="border-b border-outline-variant/15 hover:bg-[#faf9f6]/30">
                                <td className="py-3 px-2 font-mono font-bold text-primary">{pay.transactionId}</td>
                                <td className="py-3 px-2 uppercase font-bold text-[10px]">{pay.method}</td>
                                <td className="py-3 px-2 font-bold">₹{pay.amount?.toFixed(2)}</td>
                                <td className="py-3 px-2">
                                  <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase text-[9px]">
                                    {pay.status}
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-on-surface-variant font-medium">
                                  {new Date(pay.paymentDate).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. CARE MAINTENANCE REMINDERS */}
                {activeTab === 'reminders' && (
                  <div className="glass-card p-6 md:p-8 rounded-3xl border border-outline-variant/30 bg-white">
                    <div className="pb-4 border-b border-outline-variant/20 mb-6">
                      <h2 className="font-headline-md text-xl text-primary font-bold">Purifier Reminders</h2>
                      <p className="text-[10px] text-on-surface-variant font-label-md mt-1">Snooze or reschedule scheduled care checkups</p>
                    </div>

                    {reminders.length === 0 ? (
                      <div className="text-center py-16">
                        <FiClock size={32} className="mx-auto text-secondary/30 mb-2" />
                        <p className="text-xs text-on-surface-variant font-label-md">No maintenance schedules recorded.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reminders.map(rem => (
                          <div
                            key={rem._id}
                            className="border border-outline-variant/30 rounded-2xl p-5 bg-[#faf9f6]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-sm transition-all bg-white"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                                  rem.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-[#ffdbc9] text-[#753401]'
                                }`}>
                                  {rem.scheduleType}
                                </span>
                                {rem.reminderSent && (
                                  <span className="text-[8px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    Alert Sent
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-shadow-subtle mt-2 capitalize">{rem.scheduleType?.replace(/_/g, ' ')} Replacement</h4>
                              <p className="text-[10px] text-[#6a5e33] mt-1 font-label-md">
                                Next Due Date: <span className="font-bold text-primary">{new Date(rem.nextServiceDate).toLocaleDateString()}</span>
                              </p>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto self-end sm:self-center">
                              {rem.status !== 'completed' && (
                                <>
                                  <button
                                    onClick={() => handleSnoozeReminder(rem._id)}
                                    className="flex-1 sm:flex-none border border-outline-variant text-primary hover:bg-[#ffdbc9]/20 px-3.5 py-2.5 rounded-xl text-[10px] font-bold uppercase font-label-md text-center transition-all"
                                  >
                                    Snooze (7d)
                                  </button>
                                  <button
                                    onClick={() => handleOpenRescheduleModal(rem)}
                                    className="flex-1 sm:flex-none bg-[#6a5e33] hover:bg-[#51461e] text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase font-label-md text-center shadow-md transition-all"
                                  >
                                    Reschedule
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 6. SUPPORT HELPDESK CHAT */}
                {activeTab === 'support' && (
                  <div className="glass-card p-6 rounded-3xl border border-outline-variant/30 bg-white grid grid-cols-1 md:grid-cols-3 min-h-[500px]">
                    
                    {/* Tickets Sidebar */}
                    <div className="border-r border-outline-variant/20 pr-4 md:col-span-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
                          <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-label-md">Care Tickets</h3>
                          <button
                            onClick={() => setShowNewTicketModal(true)}
                            className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-on-primary rounded-xl transition-all shadow-sm flex items-center justify-center"
                          >
                            <FiPlus size={14} />
                          </button>
                        </div>

                        {tickets.length === 0 ? (
                          <p className="text-[10px] text-on-surface-variant italic font-label-md text-center py-6">No support tickets.</p>
                        ) : (
                          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                            {tickets.map(tkt => (
                              <button
                                key={tkt._id}
                                onClick={() => setSelectedTicket(tkt)}
                                className={`w-full text-left p-3 rounded-xl border transition-all text-xs font-label-md ${
                                  selectedTicket?._id === tkt._id
                                    ? 'bg-[#ffdbc9]/40 border-primary text-primary font-bold'
                                    : 'border-outline-variant/15 hover:bg-[#faf9f6]/40'
                                }`}
                              >
                                <div className="flex justify-between items-center text-[8px] uppercase">
                                  <span className="font-bold text-shadow-subtle">{tkt.ticketId}</span>
                                  <span className={`px-1.5 py-0.5 rounded-full border ${
                                    tkt.status === 'open' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-500'
                                  }`}>{tkt.status}</span>
                                </div>
                                <h4 className="text-[11px] font-bold mt-1.5 truncate capitalize">{tkt.subject}</h4>
                                <p className="text-[9px] text-on-surface-variant truncate mt-0.5 font-medium">{tkt.category}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chat Panel */}
                    <div className="md:col-span-2 pl-0 md:pl-6 pt-6 md:pt-0 flex flex-col justify-between h-[500px]">
                      {selectedTicket ? (
                        <>
                          {/* Thread Header */}
                          <div className="pb-3 border-b border-outline-variant/15 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-xs font-bold text-primary uppercase font-label-md">{selectedTicket.ticketId}</h3>
                                <span className={`text-[8px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold uppercase ${
                                  selectedTicket.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {selectedSchedule?.priority || 'high priority'}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-shadow-subtle mt-1 capitalize">{selectedTicket.subject}</h4>
                            </div>
                          </div>

                          {/* Message Queue */}
                          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                            {selectedTicket.messages?.map((msg, mIdx) => {
                              const isMe = msg.sender === 'customer';
                              return (
                                <div key={mIdx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[75%] rounded-2xl p-3.5 text-xs ${
                                    isMe 
                                      ? 'bg-primary text-on-primary rounded-tr-none shadow-sm' 
                                      : 'bg-[#faf9f6] text-on-surface rounded-tl-none border border-outline-variant/35'
                                  }`}>
                                    <p className="leading-relaxed font-medium">{msg.text}</p>
                                    <span className="block text-[8px] opacity-60 text-right mt-1.5 font-mono">
                                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                            <div ref={chatBottomRef}></div>
                          </div>

                          {/* Chat Input */}
                          <form onSubmit={handleSendChatMessage} className="pt-3 border-t border-outline-variant/15 flex gap-2">
                            <input
                              type="text"
                              placeholder="Describe your purifier issue..."
                              value={chatMessageText}
                              onChange={(e) => setChatMessageText(e.target.value)}
                              className="flex-1 bg-[#faf9f6] border border-outline-variant/40 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary transition-all font-label-md"
                            />
                            <button
                              type="submit"
                              disabled={isSendingMessage}
                              className="bg-primary hover:bg-[#853a01] text-on-primary p-3 rounded-xl hover:shadow-md transition-all shadow-sm"
                            >
                              <FiSend size={14} />
                            </button>
                          </form>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                          <FiMessageSquare size={32} className="text-secondary/30 mb-2" />
                          <h4 className="text-xs font-bold uppercase text-secondary">Smart Helpdesk Executive</h4>
                          <p className="text-[10px] text-on-surface-variant max-w-[280px] mt-1.5 font-label-md">
                            Select an active ticket thread on the sidebar, or log a new assistance ticket to start.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 7. SETTINGS & DEVICE TIMINGS */}
                {activeTab === 'profile' && (
                  <div className="glass-card p-6 md:p-8 rounded-3xl border border-outline-variant/30 bg-white">
                    <div className="pb-4 border-b border-outline-variant/20 mb-6">
                      <h2 className="font-headline-md text-xl text-primary font-bold">Care Settings & Slots</h2>
                      <p className="text-[10px] text-on-surface-variant font-label-md mt-1">Configure service preferences, preferred slots, and installation records</p>
                    </div>

                    <form onSubmit={handleProfileSave} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-secondary mb-1.5 font-label-md">First Name</label>
                          <input
                            type="text"
                            required
                            value={profileForm.firstName}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                            className="w-full px-4 py-3 bg-[#faf9f6] border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:border-primary transition-all font-label-md font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-secondary mb-1.5 font-label-md">Last Name</label>
                          <input
                            type="text"
                            required
                            value={profileForm.lastName}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                            className="w-full px-4 py-3 bg-[#faf9f6] border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:border-primary transition-all font-label-md font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-secondary mb-1.5 font-label-md">Phone Number</label>
                          <input
                            type="tel"
                            required
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-4 py-3 bg-[#faf9f6] border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:border-primary transition-all font-label-md font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-secondary mb-1.5 font-label-md">Alternate Number</label>
                          <input
                            type="tel"
                            value={profileForm.alternatePhone}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, alternatePhone: e.target.value }))}
                            className="w-full px-4 py-3 bg-[#faf9f6] border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:border-primary transition-all font-label-md"
                          />
                        </div>
                      </div>

                      {/* Preferred slots */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-outline-variant/15">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-secondary mb-1.5 font-label-md">Preferred service day</label>
                          <select
                            value={profileForm.preferredServiceTimings.day}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, preferredServiceTimings: { ...prev.preferredServiceTimings, day: e.target.value } }))}
                            className="w-full px-4 py-3 bg-[#faf9f6] border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:border-primary transition-all font-label-md font-bold"
                          >
                            <option value="Anyday">Anyday</option>
                            <option value="Weekdays">Weekdays Only</option>
                            <option value="Weekends">Weekends Only</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-secondary mb-1.5 font-label-md">Preferred time slot</label>
                          <select
                            value={profileForm.preferredServiceTimings.timeSlot}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, preferredServiceTimings: { ...prev.preferredServiceTimings, timeSlot: e.target.value } }))}
                            className="w-full px-4 py-3 bg-[#faf9f6] border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:border-primary transition-all font-label-md font-bold"
                          >
                            <option value="10:00 AM - 01:00 PM">Morning (10:00 AM - 01:00 PM)</option>
                            <option value="01:00 PM - 04:00 PM">Afternoon (01:00 PM - 04:00 PM)</option>
                            <option value="04:00 PM - 07:00 PM">Evening (04:00 PM - 07:00 PM)</option>
                          </select>
                        </div>
                      </div>

                      {/* Service address details */}
                      <div className="space-y-4 pt-4 border-t border-outline-variant/15">
                        <h4 className="text-[10px] font-bold uppercase text-[#6a5e33] font-label-md">Service Installation Address</h4>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-secondary mb-1.5 font-label-md">Street Address</label>
                          <input
                            type="text"
                            value={profileForm.address.street}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, address: { ...prev.address, street: e.target.value } }))}
                            className="w-full px-4 py-3 bg-[#faf9f6] border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:border-primary transition-all font-label-md font-bold"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <input
                              type="text"
                              placeholder="City"
                              value={profileForm.address.city}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, address: { ...prev.address, city: e.target.value } }))}
                              className="w-full px-3 py-2.5 bg-[#faf9f6] border border-outline-variant/40 rounded-xl text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="State"
                              value={profileForm.address.state}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, address: { ...prev.address, state: e.target.value } }))}
                              className="w-full px-3 py-2.5 bg-[#faf9f6] border border-outline-variant/40 rounded-xl text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Pincode"
                              value={profileForm.address.pincode}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, address: { ...prev.address, pincode: e.target.value } }))}
                              className="w-full px-3 py-2.5 bg-[#faf9f6] border border-outline-variant/40 rounded-xl text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="w-full bg-[#6c2f00] hover:bg-[#853a01] text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider font-label-md shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        {isSavingProfile ? 'Saving profile changes...' : 'Save Timing & Slot preferences'}
                      </button>
                    </form>
                  </div>
                )}

                {/* 8. SECURITY PANEL */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <SecurityDashboard />
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>

      <Footer />

      {/* --- MODAL DIALOGS --- */}

      {/* A. NOTIFICATIONS PANEL DRAWER */}
      <AnimatePresence>
        {showNotificationsDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotificationsDrawer(false)}
              className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative z-10 w-full max-w-sm bg-[#faf9f6]/95 backdrop-blur-2xl border-l border-white/50 h-full p-6 shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
                  <h3 className="text-sm font-bold text-primary font-headline-md flex items-center gap-2 uppercase tracking-wide">
                    <FiBell /> Alerts & Updates
                  </h3>
                  <button
                    onClick={() => setShowNotificationsDrawer(false)}
                    className="p-1 text-secondary hover:text-primary transition-colors text-lg"
                  >
                    ✕
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                    <FiBell size={24} className="text-secondary/30 mb-2" />
                    <p className="text-xs text-on-surface-variant font-label-md">No alerts logged in workspace.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {notifications.map(not => (
                      <div
                        key={not._id}
                        onClick={() => handleMarkNotificationRead(not._id)}
                        className={`p-4 rounded-xl border transition-all relative ${
                          not.isRead 
                            ? 'bg-white/40 border-outline-variant/15 text-on-surface-variant' 
                            : 'bg-[#ffdbc9]/20 border-primary/20 text-on-surface font-bold shadow-sm'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] text-primary uppercase font-bold tracking-wider font-label-md">{not.title || 'System Alert'}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteNotification(not._id); }}
                            className="text-secondary hover:text-error p-1 transition-colors"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                        <p className="text-xs mt-1 leading-relaxed font-medium">{not.message}</p>
                        <span className="block text-[8px] text-right text-on-surface-variant font-mono mt-2">
                          {new Date(not.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* B. CHECKOUT MODAL */}
      <AnimatePresence>
        {showCheckoutModal && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCheckoutModal(false)}
              className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-sm bg-[#faf9f6]/95 backdrop-blur-2xl border border-white/50 rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <div className="pb-3 border-b border-outline-variant/15">
                <h3 className="text-lg font-bold text-primary font-headline-md uppercase tracking-wide">Settle Invoice Payment</h3>
                <p className="text-[10px] font-mono text-on-surface-variant mt-1 font-bold">{selectedInvoice.invoiceNumber}</p>
              </div>

              <div className="space-y-3 font-label-md text-xs">
                <div className="bg-[#ffdbc9]/20 border border-primary/20 p-4 rounded-xl flex justify-between items-center">
                  <span className="font-bold text-shadow-subtle">Grand Total Settle:</span>
                  <span className="text-base font-bold text-primary">INR {selectedInvoice.total?.toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <label className="block text-[9px] font-bold uppercase text-secondary">Checkout method</label>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { id: 'upi', label: 'UPI / QR' },
                      { id: 'card', label: 'Card' },
                      { id: 'wallet', label: 'Wallet' }
                    ].map(method => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setCheckoutMethod(method.id)}
                        className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                          checkoutMethod === method.id 
                            ? 'bg-primary text-on-primary border-primary font-bold shadow-sm' 
                            : 'border-outline-variant/20 hover:bg-[#faf9f6]'
                        }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <form onSubmit={handleCheckoutSubmit} className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="flex-1 border border-outline-variant py-3.5 rounded-xl text-xs font-bold uppercase font-label-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingCheckout}
                  className="flex-1 bg-primary hover:bg-[#853a01] text-white py-3.5 rounded-xl text-xs font-bold uppercase font-label-md shadow-md active:scale-98"
                >
                  {isProcessingCheckout ? 'Processing...' : 'Settle Now'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* C. RESCHEDULE MODAL */}
      <AnimatePresence>
        {showRescheduleModal && selectedSchedule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRescheduleModal(false)}
              className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-sm bg-[#faf9f6]/95 backdrop-blur-2xl border border-white/50 rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <div className="pb-3 border-b border-outline-variant/15">
                <h3 className="text-lg font-bold text-primary font-headline-md uppercase tracking-wide">Reschedule Appointment</h3>
                <p className="text-[10px] text-on-surface-variant mt-1 capitalize font-bold">Category: {selectedSchedule.scheduleType}</p>
              </div>

              <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-secondary mb-1.5 font-label-md">Choose custom date</label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-4 py-3 bg-[#faf9f6] border border-outline-variant/40 rounded-xl text-xs focus:outline-none font-label-md"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRescheduleModal(false)}
                    className="flex-1 border border-outline-variant py-3.5 rounded-xl text-xs font-bold uppercase font-label-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingReschedule}
                    className="flex-1 bg-[#6a5e33] hover:bg-[#51461e] text-white py-3.5 rounded-xl text-xs font-bold uppercase font-label-md shadow-md"
                  >
                    {isProcessingReschedule ? 'Rescheduling...' : 'Reschedule'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* D. NEW TICKET MODAL */}
      <AnimatePresence>
        {showNewTicketModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewTicketModal(false)}
              className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-md bg-[#faf9f6]/95 backdrop-blur-2xl border border-white/50 rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <div className="pb-3 border-b border-outline-variant/15 flex justify-between items-center">
                <h3 className="text-lg font-bold text-primary font-headline-md uppercase tracking-wide">Register Support Ticket</h3>
                <button onClick={() => setShowNewTicketModal(false)} className="text-secondary hover:text-primary">✕</button>
              </div>

              <form onSubmit={handleCreateSupportTicket} className="space-y-4 font-label-md text-xs">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-secondary mb-1.5">Issue Category</label>
                  <select
                    value={newTicketCategory}
                    onChange={(e) => setNewTicketCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-[#faf9f6] border border-outline-variant/40 rounded-xl focus:outline-none"
                  >
                    <option value="technical">Technical Breakdown</option>
                    <option value="billing">Billing & Settle</option>
                    <option value="filter_replacement">Filter / Membrane Replacement</option>
                    <option value="installation">Purifier Installation</option>
                    <option value="other">Other Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase text-secondary mb-1.5">Subject Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Short description of breakdown..."
                    value={newTicketSubject}
                    onChange={(e) => setNewTicketSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-[#faf9f6] border border-outline-variant/40 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase text-secondary mb-1.5">Description details</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide details of purifier performance, error codes, noise level..."
                    value={newTicketDesc}
                    onChange={(e) => setNewTicketDesc(e.target.value)}
                    className="w-full px-4 py-3 bg-[#faf9f6] border border-outline-variant/40 rounded-xl focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="w-full bg-primary hover:bg-[#853a01] text-on-primary py-3.5 rounded-xl font-bold uppercase tracking-wider shadow-md"
                >
                  {isSubmittingTicket ? 'Submitting support ticket...' : 'Open ticket'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CustomerDashboard;