import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import JobDetailsModal from '../components/JobDetailsModal';
import { agentService, bookingService, notificationService } from '../services/services';
import { useAuthStore } from '../context/authStore';
import toast from 'react-hot-toast';
import SecurityDashboard from '../components/SecurityDashboard';
import { 
  FiMapPin, 
  FiPhone, 
  FiMail, 
  FiCheckCircle, 
  FiClock, 
  FiTrendingUp, 
  FiUser, 
  FiChevronRight, 
  FiSettings, 
  FiBell, 
  FiBellOff, 
  FiInfo, 
  FiAlertCircle, 
  FiActivity, 
  FiAward, 
  FiSliders, 
  FiShield, 
  FiMap,
  FiPrinter
} from 'react-icons/fi';

const AgentDashboard = () => {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get('view') || 'assigned';
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [completedServices, setCompletedServices] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Availability status state for breathing pulse toggle
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Purity Certification Wizard States
  const [showPurityModal, setShowPurityModal] = useState(false);
  const [certifyingJob, setCertifyingJob] = useState(null);
  const [purityData, setPurityData] = useState({
    tdsInput: 280,
    tdsOutput: 18,
    phLevel: 7.2,
    sedimentHealth: 95,
    carbonHealth: 98,
    membraneHealth: 90,
    remarks: 'Water filtration system fully serviced, filters sanitized, and optimal purity levels achieved.'
  });
  const [generatedCertificate, setGeneratedCertificate] = useState(null);

  const [settingsData, setSettingsData] = useState({
    status: 'available',
    emailNotifications: true,
    smsNotifications: true,
    travelRadius: 15,
    emergencyDispatch: false,
    firstName: '',
    lastName: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    }
  });

  const certificateRef = useRef(null);

  // Fetch initial profile & bookings
  const fetchData = async () => {
    try {
      const [jobsRes, completedRes, profileRes, notificationsRes] = await Promise.all([
        agentService.getAssignedBookings(),
        agentService.getCompletedServices(),
        agentService.getProfile(),
        notificationService.getNotifications(),
      ]);
      
      setAssignedJobs(jobsRes.data || []);
      setCompletedServices(completedRes.data || []);
      setProfile(profileRes.data);
      setNotifications(notificationsRes.data || []);
    } catch (error) {
      console.error('Failed to load dashboard details:', error.response?.data || error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Update Settings initial states when profile loads
  useEffect(() => {
    if (profile) {
      setSettingsData({
        status: profile.status || 'offline',
        emailNotifications: localStorage.getItem('agent_email_notif') !== 'false',
        smsNotifications: localStorage.getItem('agent_sms_notif') !== 'false',
        travelRadius: parseInt(localStorage.getItem('agent_radius') || '15', 10),
        emergencyDispatch: localStorage.getItem('agent_emergency') === 'true',
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        address: {
          street: profile.address?.street || '',
          city: profile.address?.city || '',
          state: profile.address?.state || '',
          pincode: profile.address?.pincode || '',
          country: profile.address?.country || 'India',
        }
      });
    }
  }, [profile]);

  // Handle availability mode quick status switch
  const handleToggleDutyStatus = async (newStatus) => {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await agentService.updateStatus(newStatus);
      setProfile(prev => ({ ...prev, status: newStatus }));
      setSettingsData(prev => ({ ...prev, status: newStatus }));
      toast.success(`Duty status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => prev.map(n =>
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      if (unreadNotifications.length === 0) return;
      await Promise.all(unreadNotifications.map(n => notificationService.markAsRead(n._id)));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleViewJobDetails = (bookingId) => {
    const job = assignedJobs.find(j => j._id === bookingId) || completedServices.find(j => j._id === bookingId);
    if (job) {
      setSelectedBooking(job);
      setShowDetailsModal(true);
    } else {
      toast.error('Job details not found');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await Promise.all([
        agentService.updateStatus(settingsData.status),
        agentService.updateProfile({
          firstName: settingsData.firstName,
          lastName: settingsData.lastName,
          phone: settingsData.phone,
          address: settingsData.address,
        })
      ]);
      
      localStorage.setItem('agent_email_notif', settingsData.emailNotifications);
      localStorage.setItem('agent_sms_notif', settingsData.smsNotifications);
      localStorage.setItem('agent_radius', settingsData.travelRadius);
      localStorage.setItem('agent_emergency', settingsData.emergencyDispatch);

      setProfile(prev => ({
        ...prev,
        status: settingsData.status,
        firstName: settingsData.firstName,
        lastName: settingsData.lastName,
        phone: settingsData.phone,
        address: settingsData.address,
      }));

      toast.success('Settings saved successfully!');
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Failed to update settings details:', error.response?.data || error);
      toast.error(error.response?.data?.error || 'Failed to update settings');
    }
  };

  // Update Status state pipeline tracker
  const handleUpdateStatus = async (bookingId, status) => {
    try {
      await bookingService.updateBookingStatus(bookingId, { status });
      toast.success(`Job marked as ${status.replace(/_/g, ' ')}`);
      setAssignedJobs(prev => prev.map(job => 
        job._id === bookingId ? { ...job, status } : job
      ));
      if (selectedBooking && selectedBooking._id === bookingId) {
        setSelectedBooking(prev => ({ ...prev, status }));
      }
    } catch (error) {
      toast.error('Failed to update job status');
    }
  };

  // Launch Purity Certification wizard
  const triggerPurityCertification = (job) => {
    setCertifyingJob(job);
    // Reset to professional baseline defaults
    setPurityData({
      tdsInput: 280,
      tdsOutput: 18,
      phLevel: 7.2,
      sedimentHealth: 95,
      carbonHealth: 98,
      membraneHealth: 90,
      remarks: 'Water filtration system fully serviced, filters sanitized, and optimal purity levels achieved.'
    });
    setShowPurityModal(true);
  };

  // Submit Purity Certificate to backend & complete the job
  const handleCompleteWithCertificate = async (e) => {
    e.preventDefault();
    if (!certifyingJob) return;

    const purificationRate = Math.round(((purityData.tdsInput - purityData.tdsOutput) / purityData.tdsInput) * 100);
    const certPayload = {
      certId: `FN-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toLocaleDateString('en-US', { dateStyle: 'long' }),
      specialist: `${profile?.firstName} ${profile?.lastName}`,
      specialistId: profile?.agentId,
      jobType: certifyingJob.serviceType?.replace(/_/g, ' '),
      customer: certifyingJob.customer?.firstName && certifyingJob.customer?.lastName 
        ? `${certifyingJob.customer.firstName} ${certifyingJob.customer.lastName}`
        : 'Care Recipient',
      metrics: {
        tdsInput: purityData.tdsInput,
        tdsOutput: purityData.tdsOutput,
        purificationRate,
        phLevel: purityData.phLevel,
        sedimentHealth: purityData.sedimentHealth,
        carbonHealth: purityData.carbonHealth,
        membraneHealth: purityData.membraneHealth,
      },
      remarks: purityData.remarks,
      signatureCode: `SIG-${profile?.agentId}-${Date.now().toString().slice(-4)}`
    };

    const notesString = `[PURITY_CERTIFICATE]:${JSON.stringify(certPayload)}`;

    try {
      await bookingService.updateBookingStatus(certifyingJob._id, {
        status: 'completed',
        notes: notesString
      });
      
      toast.success('Purity Certificate registered & service completed successfully!');
      
      // Update local state dispatches
      setAssignedJobs(prev => prev.filter(j => j._id !== certifyingJob._id));
      setCompletedServices(prev => [
        { ...certifyingJob, status: 'completed', agentNotes: notesString, completedAt: new Date() },
        ...prev
      ]);

      setGeneratedCertificate(certPayload);
      setShowPurityModal(false);
    } catch (error) {
      console.error('Failed to complete service:', error);
      toast.error('Failed to complete job');
    }
  };

  // Stagger variants for elegant dashboard entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  // Helper: TDS evaluation
  const getTdsStatus = (tds) => {
    if (tds < 50) return { label: 'Optimal Purity', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
    if (tds <= 150) return { label: 'Excellent', color: 'text-teal-600 bg-teal-50 border-teal-100' };
    if (tds <= 300) return { label: 'Fair/Acceptable', color: 'text-amber-600 bg-amber-50 border-amber-100' };
    return { label: 'Substandard', color: 'text-rose-600 bg-rose-50 border-rose-100' };
  };

  // Helper: pH evaluation
  const getPhStatus = (ph) => {
    if (ph >= 7.0 && ph <= 7.8) return { label: 'Neutral (Optimal)', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
    if (ph < 7.0) return { label: 'Slightly Acidic', color: 'text-sky-600 bg-sky-50 border-sky-100' };
    return { label: 'Slightly Alkaline', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f6]">
        <Navbar />
        <div className="flex items-center justify-center h-[70vh]">
          <div className="text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
            </div>
            <p className="text-sm font-semibold tracking-wider text-primary uppercase">Synchronizing Dispatches...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#faf9f6] text-on-surface">
      {/* Premium backdrop glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -left-1/4 top-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute -right-1/4 top-1/3 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-3xl"></div>
      </div>

      <Navbar />

      <main className="relative z-10 py-12 px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto">
        {/* Welcome Workspace Greeting Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10 pb-6 border-b border-outline-variant/20"
        >
          <div>
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-primary animate-ping"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">Operations Command Center</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black font-headline-xl text-primary mt-1 tracking-tight">
              Welcome, {profile?.firstName ? (profile.firstName.charAt(0).toUpperCase() + profile.firstName.slice(1)) : 'Specialist'}
            </h1>
            <p className="text-on-surface-variant text-sm mt-1 leading-relaxed max-w-xl">
              Sanitize wellness grids, calibrate water purity standards, and manage scheduled service dispatches.
            </p>
          </div>

          {/* Quick status bar */}
          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md px-4 py-2 border border-outline-variant/30 rounded-2xl shadow-sm self-start md:self-center">
            <span className="text-xs text-on-surface-variant/80 font-bold">Command Mode</span>
            <div className="h-4 w-px bg-outline-variant/30"></div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${profile?.status === 'available' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-400'}`}></span>
              <span className="text-xs font-black uppercase tracking-wider text-primary">{profile?.status || 'offline'}</span>
            </div>
          </div>
        </motion.div>

        {/* Dual-Column Main Command Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
          
          {/* LEFT SIDE: Assigned Jobs, Completed List, Notifications Center (2 Columns) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Navigational Tabs Bar */}
            <div className="relative z-10 flex gap-1 p-1 bg-[#efeeeb]/60 backdrop-blur-md rounded-2xl border border-outline-variant/10 max-w-lg overflow-x-auto scrollbar-none">
              {[
                { id: 'assigned', label: `Assigned Jobs`, count: assignedJobs.length, icon: FiActivity },
                { id: 'completed', label: `History`, count: completedServices.length, icon: FiCheckCircle },
                { id: 'notifications', label: `Alerts`, count: notifications.filter(n => !n.isRead).length, icon: FiBell }
              ].map((view) => {
                const Icon = view.icon;
                const isSelected = currentView === view.id;
                return (
                  <button
                    key={view.id}
                    type="button"
                    onClick={() => setSearchParams({ view: view.id })}
                    className={`relative z-10 px-5 py-3 rounded-xl font-label-md text-xs transition-all duration-300 flex items-center gap-2 whitespace-nowrap uppercase tracking-wider ${
                      isSelected 
                        ? 'text-on-primary font-bold shadow-md' 
                        : 'text-on-surface-variant hover:text-primary font-semibold'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeAgentTabGlow"
                        className="absolute inset-0 z-[-1] bg-gradient-primary rounded-xl"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon size={14} />
                    <span>{view.label}</span>
                    {view.count > 0 && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isSelected ? 'bg-white text-primary' : 'bg-primary/10 text-primary'}`}>
                        {view.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* TAB CONTAINER VIEW */}
            <AnimatePresence mode="wait">
              {currentView === 'assigned' && (
                <motion.div
                  key="assigned"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-6"
                >
                  {assignedJobs.length === 0 ? (
                    <motion.div 
                      variants={itemVariants}
                      className="glass-card p-16 text-center border border-outline-variant/15 rounded-3xl"
                    >
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                        <FiSliders size={28} className="text-primary animate-pulse" />
                      </div>
                      <h3 className="text-primary font-bold text-lg font-headline-md mb-1">Queue Fully Clear</h3>
                      <p className="text-on-surface-variant text-sm max-w-sm mx-auto leading-relaxed">
                        There are no purification maintenance dispatches assigned to you today. Enjoy your day or toggle availability in Settings.
                      </p>
                    </motion.div>
                  ) : (
                    assignedJobs.map((job) => {
                      const customerName = job.customer?.firstName && job.customer?.lastName
                        ? `${job.customer.firstName} ${job.customer.lastName}`
                        : 'Valued Customer';
                      
                      // Active workflow index helper
                      const stepIndex = 
                        job.status === 'pending' ? 0 : 
                        job.status === 'confirmed' ? 1 : 
                        job.status === 'in_progress' ? 2 : 3;

                      return (
                        <motion.div
                          key={job._id}
                          variants={itemVariants}
                          className="glass-card border border-outline-variant/30 hover:border-primary/40 rounded-3xl p-6 shadow-md hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 relative overflow-hidden"
                        >
                          {/* Accent line based on active status */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                            job.status === 'pending' ? 'bg-amber-400' :
                            job.status === 'confirmed' ? 'bg-primary' :
                            job.status === 'in_progress' ? 'bg-orange-500 animate-pulse' :
                            'bg-emerald-500'
                          }`}></div>

                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 pl-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-xl font-bold text-primary capitalize font-headline-md">
                                  {job.serviceType?.replace(/_/g, ' ')}
                                </h3>
                                <span className={`text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase border ${
                                  job.priority === 'high' ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm animate-pulse' :
                                  job.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  {job.priority || 'medium'} priority
                                </span>
                              </div>
                              <p className="text-on-surface-variant/80 text-xs mt-1.5 font-semibold flex items-center gap-1.5">
                                <FiClock className="text-primary/70" />
                                {new Date(job.bookingDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(job.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>

                            <span className={`self-start px-3 py-1.5 rounded-full font-black text-[10px] tracking-wider border uppercase ${
                              job.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              job.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              job.status === 'in_progress' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {job.status?.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {/* Customer Profile Card */}
                          <div className="bg-[#efeeeb]/55 rounded-2xl p-4 mb-5 border border-outline-variant/10 pl-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                  <FiUser size={15} />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[9px] uppercase font-black tracking-wider text-secondary">Customer Profile</span>
                                  <p className="text-xs font-bold text-primary truncate leading-tight mt-0.5">{customerName}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                  <FiPhone size={15} />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[9px] uppercase font-black tracking-wider text-secondary">Mobile Line</span>
                                  <a href={`tel:${job.customer?.phone}`} className="block text-xs font-bold text-primary hover:underline truncate leading-tight mt-0.5">{job.customer?.phone || 'N/A'}</a>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                  <FiMail size={15} />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[9px] uppercase font-black tracking-wider text-secondary">Email Coordinates</span>
                                  <a href={`mailto:${job.customer?.email}`} className="block text-xs font-bold text-primary hover:underline truncate leading-tight mt-0.5">{job.customer?.email || 'N/A'}</a>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Estate Service Location */}
                          <div className="bg-white/60 p-4 border border-outline-variant/10 rounded-2xl mb-6">
                            <div className="flex items-start gap-3">
                              <FiMapPin className="text-primary mt-0.5 flex-shrink-0" size={16} />
                              <div className="min-w-0">
                                <span className="text-[9px] uppercase font-black tracking-wider text-secondary">Sanitary Target Grid</span>
                                <p className="text-xs font-bold text-primary mt-0.5 leading-normal">
                                  {job.serviceLocation?.address?.street}, {job.serviceLocation?.address?.city}
                                  {job.serviceLocation?.address?.state && `, ${job.serviceLocation.address.state}`}
                                  {job.serviceLocation?.address?.pincode && ` - ${job.serviceLocation.address.pincode}`}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Workflow Pipeline Progress Indicator */}
                          <div className="mb-6 px-2">
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-secondary mb-3">
                              <span>Service Pipeline Status</span>
                              <span className="text-primary font-bold">{Math.round((stepIndex / 3) * 100)}% Optimized</span>
                            </div>
                            <div className="relative flex items-center justify-between w-full">
                              {/* Background Line */}
                              <div className="absolute left-0 right-0 h-1 bg-[#efeeeb] rounded-full z-0"></div>
                              {/* Filled Line */}
                              <div className="absolute left-0 h-1 bg-gradient-primary rounded-full z-0 transition-all duration-500" style={{ width: `${(stepIndex / 3) * 100}%` }}></div>

                              {/* Pipeline Nodes */}
                              {['Assigned', 'Confirmed', 'Active Dispatch', 'Certified'].map((stepName, idx) => {
                                const isPassed = stepIndex >= idx;
                                const isCurrent = stepIndex === idx;
                                return (
                                  <div key={idx} className="relative z-10 flex flex-col items-center">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                      isPassed ? 'bg-primary border-primary text-white scale-110 shadow-sm' : 'bg-white border-[#efeeeb] text-secondary'
                                    }`}>
                                      {isPassed ? <FiCheckCircle size={10} /> : <span className="text-[8px] font-bold">{idx + 1}</span>}
                                    </div>
                                    <span className={`text-[8px] font-bold mt-1.5 uppercase tracking-wider transition-colors ${isCurrent ? 'text-primary' : isPassed ? 'text-secondary' : 'text-on-surface-variant/40'}`}>
                                      {stepName}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Interactive Operations Quick-Actions */}
                          <div className="flex flex-wrap gap-2.5 pt-4 border-t border-outline-variant/20">
                            {job.status === 'pending' && (
                              <button
                                onClick={() => handleUpdateStatus(job._id, 'confirmed')}
                                className="bg-gradient-primary text-on-primary font-label-md text-xs px-5 py-3 rounded-xl shadow-sm hover:translate-y-[-1px] active:scale-95 transition-all flex items-center gap-1.5 font-bold uppercase tracking-wider"
                              >
                                <FiCheckCircle size={14} /> Accept Dispatch
                              </button>
                            )}

                            {job.status === 'confirmed' && (
                              <button
                                onClick={() => handleUpdateStatus(job._id, 'in_progress')}
                                className="bg-gradient-primary text-on-primary font-label-md text-xs px-5 py-3 rounded-xl shadow-sm hover:translate-y-[-1px] active:scale-95 transition-all flex items-center gap-1.5 font-bold uppercase tracking-wider"
                              >
                                <FiClock size={14} /> Initiate Service
                              </button>
                            )}

                            {job.status === 'in_progress' && (
                              <button
                                onClick={() => triggerPurityCertification(job)}
                                className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-label-md text-xs px-5 py-3 rounded-xl shadow-md hover:shadow-lg hover:translate-y-[-1px] active:scale-95 transition-all flex items-center gap-1.5 font-bold uppercase tracking-wider"
                              >
                                <FiAward size={14} /> Certified Complete
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedBooking(job);
                                setShowDetailsModal(true);
                              }}
                              className="bg-white/60 hover:bg-white border border-outline-variant/30 text-primary font-label-md text-xs px-4 py-3 rounded-xl hover:translate-y-[-1px] active:scale-95 transition-all flex items-center gap-1 font-bold uppercase tracking-wider shadow-sm ml-auto"
                            >
                              Details <FiChevronRight size={14} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}

              {currentView === 'completed' && (
                <motion.div
                  key="completed"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-6"
                >
                  {completedServices.length === 0 ? (
                    <motion.div 
                      variants={itemVariants}
                      className="glass-card p-16 text-center border border-outline-variant/15 rounded-3xl"
                    >
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                        <FiCheckCircle size={28} className="text-primary" />
                      </div>
                      <h3 className="text-primary font-bold text-lg font-headline-md mb-1">Archive is Empty</h3>
                      <p className="text-on-surface-variant text-sm max-w-sm mx-auto leading-relaxed">
                        Completed dispatches, customer reports, and filtration certificates will list in this panel.
                      </p>
                    </motion.div>
                  ) : (
                    completedServices.map((service) => {
                      const customerName = service.customer?.firstName && service.customer?.lastName
                        ? `${service.customer.firstName} ${service.customer.lastName}`
                        : 'Customer';

                      // Extract certificate if stored inside notes
                      let certificationData = null;
                      if (service.agentNotes && service.agentNotes.startsWith('[PURITY_CERTIFICATE]:')) {
                        try {
                          certificationData = JSON.parse(service.agentNotes.replace('[PURITY_CERTIFICATE]:', ''));
                        } catch (e) {
                          console.error('Failed to parse completed certificate data', e);
                        }
                      }

                      return (
                        <motion.div
                          key={service._id}
                          variants={itemVariants}
                          className="glass-card border border-outline-variant/20 rounded-3xl p-6 shadow-sm border-l-4 border-l-emerald-600 relative overflow-hidden flex flex-col justify-between"
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-primary capitalize font-headline-md">
                                {service.serviceType?.replace(/_/g, ' ')}
                              </h3>
                              <p className="text-on-surface-variant/80 text-[11px] font-semibold mt-0.5">
                                Verified on {new Date(service.completedAt || service.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 self-start">
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full font-black text-[9px] tracking-wider uppercase">
                                COMPLETED
                              </span>
                              {certificationData && (
                                <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-black text-[9px] tracking-wider uppercase flex items-center gap-1">
                                  <FiAward size={10} /> Certified
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Customer info card */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#efeeeb]/30 rounded-2xl p-4 border border-outline-variant/10">
                            <div>
                              <span className="text-[9px] uppercase font-black tracking-wider text-secondary">Care Recipient</span>
                              <p className="text-xs font-bold text-primary leading-none mt-1">{customerName}</p>
                              <p className="text-on-surface-variant text-[10px] font-semibold mt-1.5">{service.customer?.email}</p>
                            </div>
                            {certificationData && (
                              <div className="border-t md:border-t-0 md:border-l border-outline-variant/20 pt-3 md:pt-0 md:pl-4">
                                <span className="text-[9px] uppercase font-black tracking-wider text-secondary">Calibrated Purity Metrics</span>
                                <div className="grid grid-cols-2 gap-2 mt-1.5">
                                  <div>
                                    <span className="text-[8px] font-bold text-secondary uppercase block">Output TDS</span>
                                    <span className="text-xs font-bold text-emerald-600">{certificationData.metrics?.tdsOutput} ppm</span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] font-bold text-secondary uppercase block">pH Balance</span>
                                    <span className="text-xs font-bold text-primary">{certificationData.metrics?.phLevel} pH</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {certificationData && (
                            <button
                              onClick={() => setGeneratedCertificate(certificationData)}
                              className="mt-4 w-full flex items-center justify-center gap-2 text-primary hover:text-on-primary font-bold py-3 border border-primary/20 rounded-xl hover:bg-primary transition-all duration-300 font-label-md text-xs shadow-sm bg-white/40 uppercase tracking-wider"
                            >
                              <FiAward size={13} /> View Purification Certificate
                            </button>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}

              {currentView === 'notifications' && (
                <motion.div
                  key="notifications"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-4"
                >
                  {notifications.length > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-primary font-bold text-sm uppercase tracking-wider">
                        Operational Alerts ({notifications.filter(n => !n.isRead).length} unread)
                      </p>
                      {notifications.some(n => !n.isRead) && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-all"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  )}

                  {notifications.length === 0 ? (
                    <motion.div 
                      variants={itemVariants}
                      className="glass-card p-16 text-center border border-outline-variant/15 rounded-3xl"
                    >
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                        <FiBellOff size={28} className="text-primary animate-pulse" />
                      </div>
                      <h3 className="text-primary font-bold text-lg font-headline-md mb-1">Clear Horizon</h3>
                      <p className="text-on-surface-variant text-sm max-w-sm mx-auto leading-relaxed">
                        No active operational alerts or customer dispatches in your feed at the moment.
                      </p>
                    </motion.div>
                  ) : (
                    notifications.map((notif, idx) => {
                      const Icon = notif.type === 'new_assignment' 
                        ? FiBell 
                        : notif.type === 'status_update' 
                        ? FiClock 
                        : notif.type === 'alert' 
                        ? FiAlertCircle 
                        : FiInfo;

                      return (
                        <motion.div
                          key={notif._id}
                          variants={itemVariants}
                          onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                          className={`glass-card p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                            !notif.isRead
                              ? 'bg-[#f3e2ac]/10 border-l-4 border-l-primary border-outline-variant/40 shadow-sm'
                              : 'bg-white/40 border-outline-variant/20 hover:bg-white/60'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl border ${
                              !notif.isRead 
                                ? 'bg-primary/20 text-primary border-primary/30' 
                                : 'bg-[#efeeeb]/60 text-secondary border-outline-variant/20'
                            }`}>
                              <Icon size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`font-bold text-sm ${!notif.isRead ? 'text-primary' : 'text-on-surface'}`}>
                                  {notif.title || 'System Alert'}
                                </h4>
                                {!notif.isRead && (
                                  <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
                                )}
                              </div>
                              <p className="text-on-surface-variant text-xs mt-1 leading-relaxed max-w-2xl font-semibold">
                                {notif.message}
                              </p>
                              <span className="text-[9px] text-on-surface-variant/70 font-semibold mt-2 inline-block">
                                {new Date(notif.createdAt).toLocaleString('en-IN', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            {notif.relatedBooking && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!notif.isRead) {
                                    handleMarkAsRead(notif._id);
                                  }
                                  handleViewJobDetails(notif.relatedBooking);
                                }}
                                className="bg-primary hover:bg-[#853a01] text-on-primary text-xs font-bold px-4 py-2 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-1.5 whitespace-nowrap uppercase tracking-wider"
                              >
                                Inspect Job <FiChevronRight size={14} />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Remote Sessions Security Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-card p-6 md:p-8 rounded-3xl border border-outline-variant/30 mt-8"
            >
              <SecurityDashboard />
            </motion.div>
          </div>

          {/* RIGHT SIDEBAR: Agent Profile, Availability toggle, Active Map SVG, Live Metrics Widget */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* specialist live duty profile card */}
            {profile && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-card p-6 rounded-3xl border border-outline-variant/30 space-y-6 relative overflow-hidden"
              >
                {/* Visual accent backdrop glow */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none"></div>

                <div className="flex items-center gap-4 pb-4 border-b border-outline-variant/10">
                  <div className="relative w-16 h-16 rounded-full border-2 border-white shadow bg-primary/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {profile.profileImage ? (
                      <img src={profile.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-primary font-bold text-xl uppercase">
                        {profile.firstName?.[0] || 'A'}{profile.lastName?.[0] || ''}
                      </span>
                    )}
                    {/* Breathing available status dot */}
                    <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                      profile.status === 'available' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}></span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-primary text-lg font-headline-md truncate leading-tight">
                      {profile.firstName} {profile.lastName}
                    </h3>
                    <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-wider mt-1">Care Specialist</p>
                  </div>
                </div>

                {/* Duty toggle switch */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-secondary block">Duty Mode Command</span>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-[#efeeeb]/60 rounded-2xl border border-outline-variant/10">
                    {['available', 'offline'].map((statusOption) => {
                      const isSelected = profile.status === statusOption;
                      return (
                        <button
                          key={statusOption}
                          type="button"
                          onClick={() => handleToggleDutyStatus(statusOption)}
                          disabled={isUpdatingStatus}
                          className={`py-2 px-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-gradient-primary text-on-primary font-bold shadow-md'
                              : 'text-on-surface-variant hover:text-primary'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            statusOption === 'available' ? 'bg-emerald-400' : 'bg-slate-400'
                          } ${isSelected && statusOption === 'available' ? 'animate-ping' : ''}`}></span>
                          {statusOption}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Info Parameters */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center bg-[#efeeeb]/30 border border-outline-variant/10 p-3.5 rounded-xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-secondary">Specialist ID</span>
                    <span className="text-xs font-bold text-primary tracking-wide font-mono">{profile.agentId}</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#efeeeb]/30 border border-outline-variant/10 p-3.5 rounded-xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-secondary">Registered Phone</span>
                    <span className="text-xs font-bold text-primary font-mono">{profile.phone}</span>
                  </div>
                </div>

                {/* Quick edit settings button */}
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white/60 hover:bg-primary hover:text-on-primary text-primary font-bold text-xs border border-primary/20 rounded-xl hover:translate-y-[-1px] active:scale-95 transition-all uppercase tracking-wider shadow-sm"
                >
                  <FiSettings size={14} /> Configure Workspace
                </button>
              </motion.div>
            )}

            {/* Premium Active Dispatch SVG Route Map Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 rounded-3xl border border-outline-variant/30 space-y-4 relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <FiMap size={13} className="text-primary" /> Active Service Radius Map
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded">
                  GPS Live
                </span>
              </div>

              {/* Graphic Dispatch Map SVG */}
              <div className="relative h-44 rounded-2xl border border-outline-variant/20 overflow-hidden bg-slate-900 shadow-inner flex items-center justify-center">
                {/* SVG Mockup */}
                <svg className="w-full h-full object-cover opacity-60 pointer-events-none" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Grid Lines */}
                  <path d="M0 40 H400 M0 80 H400 M0 120 H400 M0 160 H400" stroke="#1e293b" strokeWidth="0.5" />
                  <path d="M80 0 V200 M160 0 V200 M240 0 V200 M320 0 V200" stroke="#1e293b" strokeWidth="0.5" />
                  
                  {/* Service Radius Outer Boundary */}
                  <circle cx="200" cy="100" r="80" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                  <circle cx="200" cy="100" r="5" fill="#f59e0b" className="animate-ping" />
                  <circle cx="200" cy="100" r="3" fill="#f59e0b" />

                  {/* Route Paths */}
                  <path d="M200 100 Q150 140 120 120 Q90 100 80 130" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
                  <path d="M200 100 Q260 70 310 90 Q340 100 330 60" stroke="#10b981" strokeWidth="2" />

                  {/* Nodes */}
                  <circle cx="120" cy="120" r="4" fill="#0ea5e9" />
                  <circle cx="310" cy="90" r="4" fill="#10b981" />
                  <circle cx="330" cy="60" r="4" fill="#10b981" />

                  {/* Route Labels */}
                  <text x="210" y="95" fill="#f59e0b" fontSize="8" fontWeight="bold">HQ Command</text>
                  <text x="70" y="145" fill="#0ea5e9" fontSize="8" fontWeight="bold">Active: Client A</text>
                  <text x="280" y="105" fill="#10b981" fontSize="8" fontWeight="bold">Client B (Route Next)</text>
                </svg>
                
                {/* Floating overlay readout */}
                <div className="absolute bottom-3 left-3 right-3 bg-slate-950/80 backdrop-blur-md px-3.5 py-2 border border-slate-800 rounded-xl flex items-center justify-between text-white text-[9px] font-black uppercase tracking-wider shadow-md">
                  <span>Duty Radius: {settingsData.travelRadius} km</span>
                  <span className="text-emerald-400">HQ Sync Online</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-[10px] text-on-surface-variant/80 font-semibold leading-relaxed">
                  Calculated active route dispatches optimized within a {settingsData.travelRadius} km travel perimeter. Use Google Maps inside job dispatches for turn-by-turn guidance.
                </p>
              </div>
            </motion.div>

            {/* Performance Analytics Widget */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass-card p-6 rounded-3xl border border-outline-variant/30 space-y-5"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 pb-3 border-b border-outline-variant/10">
                <FiTrendingUp size={13} className="text-primary" /> Specialist Performance Ratings
              </span>

              {/* Specialist statistics dials/bars */}
              <div className="space-y-4">
                {/* Average Customer Rating out of 5 */}
                <div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-secondary mb-1.5">
                    <span>Average Customer Rating</span>
                    <span className="text-primary font-bold flex items-center gap-1">★ {profile?.rating?.toFixed(1) || '0.0'}/5.0</span>
                  </div>
                  <div className="h-2 bg-[#efeeeb] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${((profile?.rating || 0) / 5) * 100}%` }}></div>
                  </div>
                </div>

                {/* Service Success Rate */}
                <div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-secondary mb-1.5">
                    <span>Cleanliness Completion Rate</span>
                    <span className="text-primary font-bold">100% Calibrated</span>
                  </div>
                  <div className="h-2 bg-[#efeeeb] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-primary rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

                {/* Total jobs dispatched */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-[#efeeeb]/30 border border-outline-variant/10 p-3.5 rounded-2xl text-center">
                    <span className="text-[8px] font-black uppercase tracking-wider text-secondary block">Assigned Queue</span>
                    <span className="text-2xl font-black text-primary mt-1 block">{assignedJobs.length}</span>
                  </div>
                  <div className="bg-[#efeeeb]/30 border border-outline-variant/10 p-3.5 rounded-2xl text-center">
                    <span className="text-[8px] font-black uppercase tracking-wider text-secondary block">Completed History</span>
                    <span className="text-2xl font-black text-primary mt-1 block">{completedServices.length}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <JobDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        job={selectedBooking}
      />

      {/* Water Purity Test Certification Slider/Gauge Modal */}
      <AnimatePresence>
        {showPurityModal && certifyingJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPurityModal(false)}
              className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative z-10 w-full max-w-2xl bg-[#faf9f6]/95 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-outline-variant/20">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                    <FiShield size={11} className="text-primary animate-pulse" /> Calibration Command
                  </span>
                  <h3 className="text-2xl font-black text-primary font-headline-md tracking-tight mt-0.5">
                    FilterNest Purity Certification
                  </h3>
                </div>
                <button
                  onClick={() => setShowPurityModal(false)}
                  className="text-on-surface-variant hover:text-primary transition-colors text-xl font-bold focus:outline-none"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCompleteWithCertificate} className="space-y-6">
                
                {/* Alert Warning */}
                <div className="bg-[#efeeeb]/60 border border-outline-variant/20 p-4 rounded-2xl flex items-start gap-3">
                  <FiAward className="text-primary mt-0.5 flex-shrink-0" size={18} />
                  <p className="text-xs text-on-surface-variant font-semibold leading-relaxed">
                    You are completing the service request for booking ID <span className="font-bold text-primary">{certifyingJob.bookingId}</span>. Calibrate and log the professional filtration metrics below to certify this purifier system.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Calibrate TDS parameters */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-secondary pb-1 border-b border-outline-variant/10 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span> Calibrate TDS Levels (ppm)
                    </h4>
                    
                    {/* TDS Input (Raw Water) */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-semibold text-primary">Raw Water TDS Input</label>
                        <span className="text-xs font-bold text-secondary font-mono">{purityData.tdsInput} ppm</span>
                      </div>
                      <input
                        type="range"
                        min="150"
                        max="500"
                        value={purityData.tdsInput}
                        onChange={(e) => setPurityData(prev => ({ ...prev, tdsInput: parseInt(e.target.value) }))}
                        className="w-full h-1 bg-[#efeeeb] rounded-lg appearance-none cursor-pointer accent-primary border border-outline-variant/10"
                      />
                    </div>

                    {/* TDS Output (Filtered Water) */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-semibold text-primary">Filtered TDS Output (Target: &lt;50)</label>
                        <span className="text-xs font-bold text-emerald-600 font-mono">{purityData.tdsOutput} ppm</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="80"
                        value={purityData.tdsOutput}
                        onChange={(e) => setPurityData(prev => ({ ...prev, tdsOutput: parseInt(e.target.value) }))}
                        className="w-full h-1 bg-[#efeeeb] rounded-lg appearance-none cursor-pointer accent-emerald-500 border border-outline-variant/10"
                      />
                    </div>

                    {/* Purification Rate Calculation Preview */}
                    <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl text-center">
                      <span className="text-[8px] font-black uppercase tracking-wider text-emerald-800 block">System Purification Rate</span>
                      <span className="text-xl font-black text-emerald-600 mt-1 block">
                        {Math.round(((purityData.tdsInput - purityData.tdsOutput) / purityData.tdsInput) * 100)}% Purity Alignment
                      </span>
                    </div>
                  </div>

                  {/* Calibrate pH Parameters */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-secondary pb-1 border-b border-outline-variant/10 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span> Calibrate pH Balance
                    </h4>

                    {/* pH Level Slider */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-semibold text-primary">Calibrated pH Balance</label>
                        <span className="text-xs font-bold text-primary font-mono">{purityData.phLevel} pH</span>
                      </div>
                      <input
                        type="range"
                        min="6.0"
                        max="9.0"
                        step="0.1"
                        value={purityData.phLevel}
                        onChange={(e) => setPurityData(prev => ({ ...prev, phLevel: parseFloat(e.target.value) }))}
                        className="w-full h-1 bg-[#efeeeb] rounded-lg appearance-none cursor-pointer accent-primary border border-outline-variant/10"
                      />
                      <div className="flex justify-between text-[8px] text-on-surface-variant/50 font-bold mt-1 uppercase tracking-wider">
                        <span>Acidic (6.0)</span>
                        <span className="text-emerald-600">Neutral (7.0 - 7.5)</span>
                        <span>Alkaline (9.0)</span>
                      </div>
                    </div>

                    {/* pH status indicator */}
                    <div className={`p-3.5 border rounded-2xl text-center font-bold text-xs ${getPhStatus(purityData.phLevel).color}`}>
                      <span className="text-[8px] uppercase tracking-wider block mb-0.5">Evaluated pH Index</span>
                      {getPhStatus(purityData.phLevel).label}
                    </div>
                  </div>
                </div>

                {/* Filter Cartridges calibration dials */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-secondary pb-1 border-b border-outline-variant/10 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary"></span> Cartridge Health Calibration (%)
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-primary mb-1">Sediment Filter</label>
                      <input
                        type="number"
                        min="50"
                        max="100"
                        value={purityData.sedimentHealth}
                        onChange={(e) => setPurityData(prev => ({ ...prev, sedimentHealth: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 bg-white border border-outline rounded-xl text-xs font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-primary mb-1">Active Carbon</label>
                      <input
                        type="number"
                        min="50"
                        max="100"
                        value={purityData.carbonHealth}
                        onChange={(e) => setPurityData(prev => ({ ...prev, carbonHealth: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 bg-white border border-outline rounded-xl text-xs font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-primary mb-1">RO Membrane</label>
                      <input
                        type="number"
                        min="50"
                        max="100"
                        value={purityData.membraneHealth}
                        onChange={(e) => setPurityData(prev => ({ ...prev, membraneHealth: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 bg-white border border-outline rounded-xl text-xs font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-[11px] font-semibold text-primary mb-1">Specialist Remarks</label>
                  <textarea
                    required
                    rows={3}
                    value={purityData.remarks}
                    onChange={(e) => setPurityData(prev => ({ ...prev, remarks: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-outline rounded-2xl text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-semibold leading-relaxed"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-label-md text-xs py-4 rounded-xl shadow-md hover:shadow-lg hover:translate-y-[-1px] active:scale-95 transition-all font-bold uppercase tracking-wider"
                >
                  Confirm calibration & complete service
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Printable Gold-Accented Certificate View Modal */}
      <AnimatePresence>
        {generatedCertificate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setGeneratedCertificate(null)}
              className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-xl bg-white rounded-3xl p-1 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              
              {/* Gold borders certificate layout wrapper */}
              <div 
                ref={certificateRef}
                className="bg-[#faf9f6] border-[10px] border-double border-[#d4af37] rounded-[22px] p-8 space-y-6 relative overflow-hidden"
              >
                {/* Watermark branding */}
                <div className="absolute inset-0 opacity-5 flex items-center justify-center pointer-events-none select-none">
                  <span className="text-primary font-black font-headline-xl text-7xl tracking-widest uppercase">FILTERNEST</span>
                </div>

                {/* Certificate Branding Header */}
                <div className="text-center space-y-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#8b4513] block">Official Purification Record</span>
                  <h2 className="text-[#8b4513] font-bold text-2xl font-headline-md tracking-tight uppercase">Certificate of Purity Calibration</h2>
                  <div className="w-16 h-0.5 bg-[#d4af37] mx-auto mt-2"></div>
                </div>

                <div className="space-y-4 text-center text-xs text-on-surface-variant font-semibold">
                  <p className="leading-relaxed">
                    This document certifies that the residential filtration system assigned under service type <span className="font-bold text-primary">{generatedCertificate.jobType}</span> for customer <span className="font-bold text-primary">{generatedCertificate.customer}</span> has been professionally calibrated, sanitized, and authenticated by FilterNest Specialist team.
                  </p>
                </div>

                {/* Metrics Table Grid */}
                <div className="border border-outline-variant/30 rounded-2xl overflow-hidden bg-white/70 backdrop-blur-sm shadow-sm pl-0">
                  <div className="grid grid-cols-2 bg-[#efeeeb]/30 border-b border-outline-variant/20 p-3.5 text-center">
                    <div>
                      <span className="text-[8px] font-bold text-secondary uppercase block">Raw Water Input TDS</span>
                      <span className="text-sm font-bold text-primary font-mono">{generatedCertificate.metrics?.tdsInput} ppm</span>
                    </div>
                    <div className="border-l border-outline-variant/20">
                      <span className="text-[8px] font-bold text-secondary uppercase block">Calibrated Output TDS</span>
                      <span className="text-sm font-bold text-emerald-600 font-mono">{generatedCertificate.metrics?.tdsOutput} ppm</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 p-3.5 text-center text-xs">
                    <div>
                      <span className="text-[8px] font-bold text-secondary uppercase block">pH Balance</span>
                      <span className="text-xs font-bold text-primary font-mono mt-0.5 block">{generatedCertificate.metrics?.phLevel} pH</span>
                    </div>
                    <div className="border-l border-outline-variant/20">
                      <span className="text-[8px] font-bold text-secondary uppercase block">Purification Efficiency</span>
                      <span className="text-xs font-bold text-emerald-600 font-mono mt-0.5 block">{generatedCertificate.metrics?.purificationRate}%</span>
                    </div>
                    <div className="border-l border-outline-variant/20">
                      <span className="text-[8px] font-bold text-secondary uppercase block">Membrane Integrity</span>
                      <span className="text-xs font-bold text-primary font-mono mt-0.5 block">{generatedCertificate.metrics?.membraneHealth}% Health</span>
                    </div>
                  </div>
                </div>

                {/* Filter state badges */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-center">
                    <span className="text-[7px] font-bold text-emerald-800 uppercase block">Sediment Cleanliness</span>
                    <span className="text-xs font-black text-emerald-600 font-mono block mt-0.5">{generatedCertificate.metrics?.sedimentHealth}%</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-center">
                    <span className="text-[7px] font-bold text-emerald-800 uppercase block">Active Carbon</span>
                    <span className="text-xs font-black text-emerald-600 font-mono block mt-0.5">{generatedCertificate.metrics?.carbonHealth}%</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-center">
                    <span className="text-[7px] font-bold text-emerald-800 uppercase block">RO Membrane</span>
                    <span className="text-xs font-black text-emerald-600 font-mono block mt-0.5">{generatedCertificate.metrics?.membraneHealth}%</span>
                  </div>
                </div>

                {/* Specialist remarks details */}
                <div className="bg-white/40 p-4 border border-outline-variant/20 rounded-2xl text-center">
                  <span className="text-[8px] font-bold text-secondary uppercase block">Official Remarks</span>
                  <p className="text-[10px] text-on-surface-variant font-semibold leading-relaxed mt-1 italic">
                    "{generatedCertificate.remarks}"
                  </p>
                </div>

                {/* Credentials & stamp footprint */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant/20 text-xs">
                  <div>
                    <span className="text-[8px] font-bold text-secondary uppercase block">Calibrated Specialist</span>
                    <span className="font-bold text-primary mt-1 block">{generatedCertificate.specialist}</span>
                    <span className="text-[9px] text-on-surface-variant/80 font-semibold block">Care Specialist ID: {generatedCertificate.specialistId}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-bold text-secondary uppercase block">Verification Seal</span>
                    <span className="text-[10px] font-bold text-[#8b4513] font-mono mt-1 block uppercase tracking-wide">{generatedCertificate.certId}</span>
                    <span className="text-[8px] font-bold text-secondary uppercase block mt-1">Signature Authorization</span>
                    <span className="text-[10px] font-black text-primary font-mono tracking-widest block uppercase mt-0.5">{generatedCertificate.signatureCode}</span>
                  </div>
                </div>

                {/* Brand watermark Footer */}
                <div className="text-center pt-2">
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest">FilterNest Smart Water Sanctuary</p>
                </div>
              </div>

              {/* Operations Action Bar */}
              <div className="bg-[#efeeeb] p-4 flex gap-3 justify-end rounded-b-3xl">
                <button
                  onClick={() => {
                    const printContent = certificateRef.current.innerHTML;
                    const originalContent = document.body.innerHTML;
                    const styleBlock = `
                      <style>
                        body { background: white !important; font-family: system-ui, -apple-system, sans-serif; p: 20px; }
                        #print-frame { max-width: 600px; margin: 40px auto; border: 10px double #d4af37; border-radius: 22px; padding: 30px; background: #faf9f6; }
                        h2 { color: #8b4513; text-align: center; margin-bottom: 20px; }
                        .text-center { text-align: center; }
                        .w-16 { width: 64px; }
                        .h-0.5 { height: 2px; }
                        .bg-gold { background: #d4af37; }
                        .mx-auto { margin-left: auto; margin-right: auto; }
                        .mt-2 { margin-top: 8px; }
                        .mb-6 { margin-bottom: 24px; }
                        .space-y-6 > * + * { margin-top: 24px; }
                        .grid { display: grid; }
                        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                        .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                        .border { border: 1px solid #e2e8f0; }
                        .rounded-2xl { border-radius: 16px; }
                        .rounded-xl { border-radius: 12px; }
                        .p-3\\.5 { padding: 14px; }
                        .p-4 { padding: 16px; }
                        .bg-white { background: white; }
                        .font-bold { font-weight: bold; }
                        .font-black { font-weight: 900; }
                        .font-mono { font-family: monospace; }
                        .text-xs { font-size: 12px; }
                        .text-sm { font-size: 14px; }
                        .text-lg { font-size: 18px; }
                        .text-emerald-600 { color: #059669; }
                        .bg-emerald-50 { background: #ecfdf5; }
                        .border-emerald-100 { border-color: #d1fae5; }
                        .text-slate-500 { color: #64748b; }
                        .uppercase { text-transform: uppercase; }
                        .tracking-wider { letter-spacing: 0.05em; }
                        .tracking-widest { letter-spacing: 0.1em; }
                        .italic { font-style: italic; }
                        .pt-4 { padding-top: 16px; }
                        .border-t { border-top: 1px solid #e2e8f0; }
                        .text-right { text-align: right; }
                        .flex-shrink-0 { flex-shrink: 0; }
                        .bg-white\\/40 { background: rgba(255, 255, 255, 0.4); }
                      </style>
                    `;
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>FilterNest Water Purity Calibration Certificate</title>
                          ${styleBlock}
                        </head>
                        <body>
                          <div id="print-frame">
                            ${printContent}
                          </div>
                          <script>
                            window.onload = function() {
                              window.print();
                              window.close();
                            }
                          </script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }}
                  className="bg-primary hover:bg-[#853a01] text-on-primary font-bold text-xs px-5 py-3 rounded-xl shadow transition-all flex items-center gap-1.5 uppercase tracking-wider"
                >
                  <FiPrinter size={13} /> Print Certificate
                </button>
                <button
                  onClick={() => setGeneratedCertificate(null)}
                  className="bg-white hover:bg-gray-50 border border-outline-variant/30 text-primary font-bold text-xs px-5 py-3 rounded-xl transition-all uppercase tracking-wider"
                >
                  Close Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal Config Tray */}
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
                  <FiSettings className="text-primary" /> Specialist Settings
                </h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-on-surface-variant hover:text-primary transition-colors text-xl font-semibold focus:outline-none"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* Availability Status */}
                <div>
                  <label className="block text-[10px] font-black text-secondary uppercase tracking-wider mb-3">
                    Availability Duty Mode
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#efeeeb]/60 rounded-2xl border border-outline-variant/10">
                    {['available', 'offline'].map((statusOption) => {
                      const isSelected = settingsData.status === statusOption;
                      return (
                        <button
                          key={statusOption}
                          type="button"
                          onClick={() => setSettingsData(prev => ({ ...prev, status: statusOption }))}
                          className={`py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all duration-300 capitalize ${
                            isSelected
                              ? 'bg-gradient-primary text-on-primary font-bold shadow-md'
                              : 'text-on-surface-variant hover:text-primary'
                          }`}
                        >
                          {statusOption}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Personal Details */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-secondary uppercase tracking-wider pb-1 border-b border-outline-variant/10">
                    Personal Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-primary mb-1 uppercase tracking-wider">First Name</label>
                      <input
                        type="text"
                        required
                        value={settingsData.firstName}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-white border border-outline rounded-xl text-xs font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-primary mb-1 uppercase tracking-wider">Last Name</label>
                      <input
                        type="text"
                        required
                        value={settingsData.lastName}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-white border border-outline rounded-xl text-xs font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-primary mb-1 uppercase tracking-wider">Mobile Coordinates</label>
                    <input
                      type="tel"
                      required
                      value={settingsData.phone}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-white border border-outline rounded-xl text-xs font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                    />
                  </div>
                </div>

                {/* Service Address */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-secondary uppercase tracking-wider pb-1 border-b border-outline-variant/10">
                    Dispatch Base Address
                  </h4>
                  <div>
                    <label className="block text-[9px] font-bold text-primary mb-1 uppercase tracking-wider">Street Base</label>
                    <input
                      type="text"
                      value={settingsData.address.street}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, address: { ...prev.address, street: e.target.value } }))}
                      className="w-full px-3.5 py-2.5 bg-white border border-outline rounded-xl text-xs font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-primary mb-1 uppercase tracking-wider">City</label>
                      <input
                        type="text"
                        value={settingsData.address.city}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, address: { ...prev.address, city: e.target.value } }))}
                        className="w-full px-3.5 py-2.5 bg-white border border-outline rounded-xl text-xs font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-primary mb-1 uppercase tracking-wider">State</label>
                      <input
                        type="text"
                        value={settingsData.address.state}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, address: { ...prev.address, state: e.target.value } }))}
                        className="w-full px-3.5 py-2.5 bg-white border border-outline rounded-xl text-xs font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-primary mb-1 uppercase tracking-wider">Pincode</label>
                    <input
                      type="text"
                      value={settingsData.address.pincode}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, address: { ...prev.address, pincode: e.target.value } }))}
                      className="w-full px-3.5 py-2.5 bg-white border border-outline rounded-xl text-xs font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                    />
                  </div>
                </div>

                {/* Travel Radius Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[10px] font-black text-secondary uppercase tracking-wider">
                      Duty Radius Perimeter
                    </label>
                    <span className="text-primary font-bold text-xs bg-primary/10 px-2.5 py-0.5 rounded-full">
                      {settingsData.travelRadius} km
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={settingsData.travelRadius}
                    onChange={(e) => setSettingsData(prev => ({ ...prev, travelRadius: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-[#efeeeb] rounded-lg appearance-none cursor-pointer accent-primary border border-outline-variant/20"
                  />
                  <div className="flex justify-between text-[8px] text-on-surface-variant/60 font-bold mt-1">
                    <span>5 km</span>
                    <span>25 km</span>
                    <span>50 km</span>
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="space-y-4 pt-2">
                  <label className="block text-[10px] font-black text-secondary uppercase tracking-wider mb-2">
                    Alert Configurations
                  </label>
                  
                  {/* Email Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-semibold text-xs uppercase tracking-wider">New Dispatch Email Alerts</span>
                    <button
                      type="button"
                      onClick={() => setSettingsData(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settingsData.emailNotifications ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settingsData.emailNotifications ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* SMS Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-semibold text-xs uppercase tracking-wider">Dispatched Jobs SMS Alerts</span>
                    <button
                      type="button"
                      onClick={() => setSettingsData(prev => ({ ...prev, smsNotifications: !prev.smsNotifications }))}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settingsData.smsNotifications ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settingsData.smsNotifications ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Emergency Off-Hours Dispatch */}
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-semibold text-xs uppercase tracking-wider">Emergency Dispatch Support</span>
                    <button
                      type="button"
                      onClick={() => setSettingsData(prev => ({ ...prev, emergencyDispatch: !prev.emergencyDispatch }))}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settingsData.emergencyDispatch ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settingsData.emergencyDispatch ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-primary text-on-primary font-label-md text-xs py-3.5 rounded-xl shadow-md hover:shadow-lg hover:translate-y-[-1px] active:scale-95 transition-all font-bold uppercase tracking-wider mt-4"
                >
                  Save Settings Details
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

export default AgentDashboard;
