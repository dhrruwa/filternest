import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogOut, FiUser, FiSearch, FiBell, FiCheck, FiMail, FiCalendar, FiAlertCircle } from 'react-icons/fi';
import { useAuthStore } from '../context/authStore';
import { notificationService } from '../services/services';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll every 30 seconds for real-time responsiveness
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Handle outside click to close notifications dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map(n => notificationService.markAsRead(n._id)));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to update all notifications');
    }
  };

  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_confirmed':
      case 'booking_completed':
        return <FiCalendar className="text-amber-500" size={14} />;
      case 'alert':
        return <FiAlertCircle className="text-red-500" size={14} />;
      default:
        return <FiMail className="text-blue-500" size={14} />;
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-[#faf9f6]/95 backdrop-blur-2xl border-b border-slate-200/50 shadow-[0_8px_32px_0_rgba(139,69,19,0.02)]"
    >
      <div className="flex justify-between items-center px-4 md:px-8 py-3.5 w-full max-w-7xl mx-auto">
        {/* FilterNest Logo & Badge */}
        <Link to="/dashboard" className="flex items-center h-10 overflow-hidden shrink-0">
          <img 
            src="/logos/filternest_wordmark.png" 
            alt="FilterNest" 
            className="h-[120px] w-auto mt-[-35px] mb-[-45px] object-contain mix-blend-multiply"
          />
          <span className="ml-2 text-[9px] font-black uppercase tracking-wider text-primary bg-[#8b4513]/10 px-2.5 py-1 rounded-full">ADMIN</span>
        </Link>

        {/* Search Bar - Modern Glassmorphic Design */}
        <div className="hidden md:flex items-center relative max-w-md w-full mx-8">
          <FiSearch className="absolute left-4 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search bookings, customers, technicians..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 focus:border-primary rounded-xl text-xs text-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all placeholder-slate-400"
          />
        </div>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-4 relative">
          
          {/* Notifications Button with Dropdown Container */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 text-slate-500 hover:text-primary hover:bg-slate-55 border rounded-xl transition-all ${
                showNotifications ? 'bg-slate-50 border-slate-100' : 'border-transparent'
              }`}
            >
              <FiBell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col max-h-[480px]"
                >
                  {/* Dropdown Header */}
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-[#faf9f6]">
                    <div>
                      <h3 className="text-xs font-bold text-primary">Notifications</h3>
                      <p className="text-[10px] text-slate-450 font-medium mt-0.5">{unreadCount} unread alerts pending</p>
                    </div>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllAsRead}
                        className="text-[9px] font-black text-[#8b4513] bg-[#8b4513]/5 hover:bg-[#8b4513]/10 px-2.5 py-1 rounded-full uppercase tracking-wider transition-colors"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Dropdown Body - Notification items list */}
                  <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div 
                          key={n._id}
                          className={`p-4 flex gap-3 transition-colors ${n.isRead ? 'bg-white' : 'bg-amber-50/10'}`}
                        >
                          <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl h-fit">
                            {getNotificationIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <p className={`text-xs text-slate-800 truncate ${n.isRead ? 'font-medium' : 'font-bold'}`}>
                                {n.title}
                              </p>
                              <span className="text-[9px] text-slate-400 font-bold shrink-0">
                                {formatTimeAgo(n.createdAt)}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                              {n.message}
                            </p>
                          </div>
                          {!n.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(n._id)}
                              title="Mark as read"
                              className="self-center p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            >
                              <FiCheck size={14} />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3">
                          <FiBell size={20} />
                        </div>
                        <h4 className="text-xs font-bold text-slate-700">All caught up!</h4>
                        <p className="text-[10px] text-slate-450 mt-1 max-w-[200px]">
                          You have no pending notification alerts inside your system deck.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Admin Profile Details */}
          {user && (
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700">
              <div className="w-6 h-6 rounded-full bg-[#8b4513]/10 text-[#8b4513] flex items-center justify-center font-bold text-[10px]">
                {user.firstName ? user.firstName[0].toUpperCase() : 'A'}
              </div>
              <span className="hidden sm:inline shrink-0">{user.firstName || 'Admin'}</span>
            </div>
          )}

          {/* Logout Trigger */}
          {user && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-[#8b4513] text-white hover:bg-[#6c2f00] rounded-xl font-bold text-xs shadow-sm hover:shadow-[0_4px_12px_rgba(108,47,0,0.15)] hover:translate-y-[-1px] active:scale-[0.98] transition-all"
            >
              <FiLogOut size={14} /> <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;
