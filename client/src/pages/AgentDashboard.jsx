import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { agentService, bookingService, notificationService } from '../services/services';
import { useAuthStore } from '../context/authStore';
import toast from 'react-hot-toast';
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
  FiActivity, 
  FiAward, 
  FiSliders, 
  FiShield, 
  FiMap,
  FiDollarSign,
  FiXCircle,
  FiNavigation,
  FiHeart,
  FiStar,
  FiPlay,
  FiCheck,
  FiPower
} from 'react-icons/fi';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import L from 'leaflet';

const AgentDashboard = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs', 'earnings', 'performance', 'profile'
  
  // Shift state
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [shiftData, setShiftData] = useState(null);
  const [shiftDuration, setShiftDuration] = useState('00:00:00');
  
  // Dashboard & Bookings state
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [completedServices, setCompletedServices] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeJob, setActiveJob] = useState(null);
  const [incomingJob, setIncomingJob] = useState(null);
  const [acceptanceTimer, setAcceptanceTimer] = useState(60);
  
  // Modals / Drawers
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  // Signature pad references
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Map References for turn-by-turn navigation card
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // Heatmap & Earnings data
  const [attendanceHeatmap, setAttendanceHeatmap] = useState({});
  const [earningsData, setEarningsData] = useState({
    balance: 0,
    todayEarnings: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    incentives: 0,
    bonusRewards: 0,
    completedJobsCount: 0,
    transactions: []
  });
  
  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  
  // Profile / Settings
  const [settingsData, setSettingsData] = useState({
    status: 'offline',
    travelRadius: 15,
    emailNotifications: true,
    smsNotifications: true,
    firstName: '',
    lastName: '',
    phone: '',
    address: { street: '', city: '', state: '', pincode: '', country: 'India' }
  });

  // Socket instance
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5001';
    socketRef.current = io(socketUrl, { withCredentials: true });

    socketRef.current.emit('join', `agent_${user?._id || user?.id}`);

    socketRef.current.on('booking_assigned', (data) => {
      setIncomingJob(data);
      setAcceptanceTimer(60);
      toast.success('⚠️ New Urgent Dispatch Assigned!', { duration: 6000 });
      // Try playing sound if user permitted
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
      audio.play().catch(() => {});
    });

    socketRef.current.on('booking_cancelled', (data) => {
      toast.error('Booking has been cancelled by customer');
      fetchDashboardData();
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user]);

  // Global background watch geolocation logic for real-time tracking
  useEffect(() => {
    let watchId;
    if (isShiftActive && profile?.status !== 'offline') {
      const geoOptions = {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000
      };
      
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          agentService.logGPSPing(latitude, longitude, activeJob?._id).catch(console.error);
        },
        (error) => console.error('[GPS] Watch position error:', error),
        geoOptions
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isShiftActive, profile?.status, activeJob?._id]);

  // Acceptance timer countdown logic
  useEffect(() => {
    let interval;
    if (incomingJob) {
      interval = setInterval(() => {
        setAcceptanceTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            // Handle timeout auto reject
            handleRejectJob('Timeout expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [incomingJob]);

  // Shift Active Duration Timer
  useEffect(() => {
    let interval;
    if (isShiftActive && shiftData?.checkIn) {
      interval = setInterval(() => {
        const start = new Date(shiftData.checkIn).getTime();
        const diff = Date.now() - start;
        
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        
        setShiftDuration(
          `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        );
      }, 1000);
    } else {
      setShiftDuration('00:00:00');
    }
    return () => clearInterval(interval);
  }, [isShiftActive, shiftData]);

  // Turn-by-turn interactive map rendering inside dispatch modal
  useEffect(() => {
    if (activeTab === 'jobs' && activeJob?.serviceLocation?.coordinates && mapRef.current) {
      if (mapInstance.current) {
        mapInstance.current.remove();
      }

      const [lng, lat] = activeJob.serviceLocation.coordinates;
      mapInstance.current = L.map(mapRef.current).setView([lat, lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapInstance.current);

      L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          shadowSize: [41, 41],
        })
      })
        .bindPopup(`<b>Target Location</b><br/>${activeJob.serviceLocation?.address?.street}`)
        .addTo(mapInstance.current)
        .openPopup();
    }
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [activeTab, activeJob]);

  // Fetch all core system data
  const fetchDashboardData = async () => {
    try {
      const [profileRes, assignedRes, completedRes, heatmapRes, earningsRes, notificationsRes] = await Promise.all([
        agentService.getProfile(),
        agentService.getAssignedBookings(),
        agentService.getCompletedServices(),
        agentService.getAttendanceHeatmap(),
        agentService.getEarnings(),
        notificationService.getNotifications()
      ]);

      const agentProfile = profileRes.data;
      setProfile(agentProfile);
      setAssignedJobs(assignedRes.data || []);
      setCompletedServices(completedRes.data || []);
      setAttendanceHeatmap(heatmapRes.data || {});
      setEarningsData(earningsRes.data || {});
      setNotifications(notificationsRes.data || []);

      // Derive shift active state from profile status
      if (agentProfile.status !== 'offline') {
        setIsShiftActive(true);
        // Synthesize temporary check-in info
        setShiftData({ checkIn: agentProfile.updatedAt || new Date() });
      } else {
        setIsShiftActive(false);
        setShiftData(null);
      }

      // Check if there is an active running job in the dispatches queue
      const active = assignedRes.data.find(
        j => ['accepted', 'travelling', 'arrived', 'started'].includes(j.status)
      );
      setActiveJob(active || null);

      // Populate settings config state
      setSettingsData({
        status: agentProfile.status || 'offline',
        travelRadius: parseInt(localStorage.getItem('agent_radius') || '15', 10),
        emailNotifications: localStorage.getItem('agent_email_notif') !== 'false',
        smsNotifications: localStorage.getItem('agent_sms_notif') !== 'false',
        firstName: agentProfile.firstName || '',
        lastName: agentProfile.lastName || '',
        phone: agentProfile.phone || '',
        address: {
          street: agentProfile.address?.street || '',
          city: agentProfile.address?.city || '',
          state: agentProfile.address?.state || '',
          pincode: agentProfile.address?.pincode || '',
          country: agentProfile.address?.country || 'India',
        }
      });

    } catch (error) {
      console.error('Failed to sync partner command dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ----------------------------------------------------
  // WORKFLOW ACTION HANDLERS
  // ----------------------------------------------------

  const handleClockInOut = async () => {
    try {
      if (!isShiftActive) {
        // Clock In
        const res = await agentService.checkIn();
        setIsShiftActive(true);
        setShiftData(res.data.attendance);
        setProfile(prev => ({ ...prev, status: 'available' }));
        toast.success('🟢 Shift Active. GPS Fleet Tracker online!');
      } else {
        // Clock Out
        const res = await agentService.checkOut();
        setIsShiftActive(false);
        setShiftData(null);
        setProfile(prev => ({ ...prev, status: 'offline' }));
        setActiveJob(null);
        toast.success(`🔴 Shift Completed. Worked ${res.data.attendance.workingHours} Hours today.`);
      }
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Shift action failed');
    }
  };

  const handleAcceptJob = async () => {
    if (!incomingJob) return;
    try {
      await agentService.acceptJob(incomingJob._id);
      toast.success('✅ Job Accepted. Set parameters for travel navigation!');
      setIncomingJob(null);
      fetchDashboardData();
    } catch (error) {
      toast.error('Could not accept job');
    }
  };

  const handleRejectJob = async (reasonText) => {
    const job = incomingJob || activeJob;
    if (!job) return;
    try {
      await agentService.rejectJob(job._id, reasonText || 'Declined');
      toast.success('❌ Dispatch rejected and returned to command queue');
      setIncomingJob(null);
      setShowRejectModal(false);
      setRejectReason('');
      fetchDashboardData();
    } catch (error) {
      toast.error('Could not decline job');
    }
  };

  const handleStatusTransition = async (nextStatus) => {
    if (!activeJob) return;
    try {
      // Fetch geolocation coordinates if possible to log tracking points
      let coords = { latitude: null, longitude: null };
      if (navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              coords.latitude = pos.coords.latitude;
              coords.longitude = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { timeout: 5000 }
          );
        });
      }

      await agentService.transitionJobStatus(activeJob._id, nextStatus, coords.latitude, coords.longitude);
      toast.success(`Stage upgraded to: ${nextStatus.toUpperCase()}`);
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to transition job status');
    }
  };

  // Canvas Drawing Methods for Proof Signature
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#6c2f00'; // luxury brown

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleCompleteService = async () => {
    if (!activeJob) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureDataUrl = canvas.toDataURL(); // Base64 signature
    
    // Synthesize Purity certificate details
    const purityMetrics = {
      tdsInput: 275,
      tdsOutput: 16,
      phLevel: 7.3,
      sedimentHealth: 96,
      carbonHealth: 98,
      membraneHealth: 92,
      remarks: 'Water filtration wellness indices perfectly calibrated & certified.'
    };

    try {
      await agentService.submitCompletionProof(activeJob._id, signatureDataUrl, 'System sanitization complete', purityMetrics);
      toast.success('🏆 Job complete. commission balance added successfully!');
      setShowCompleteModal(false);
      setActiveJob(null);
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to register service completion');
    }
  };

  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();
    const val = parseFloat(withdrawAmount);
    if (!val || val <= 0) {
      return toast.error('Enter a valid amount');
    }
    if (val > earningsData.balance) {
      return toast.error('Insufficient withdrawable balance');
    }
    try {
      await agentService.requestWithdrawal(val);
      toast.success(`💸 Cash-out successful! ₹${val} credited to registered bank account.`);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      fetchDashboardData();
    } catch (error) {
      toast.error('Withdrawal request failed');
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

      toast.success('Workspace configurations updated successfully!');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save settings');
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  // Helper: Haversine distance calculator for turn-by-turn details
  const getDistanceToJob = () => {
    if (!activeJob?.serviceLocation?.coordinates || !profile?.currentLocation?.coordinates) return '1.2 km';
    const [cLng, cLat] = profile.currentLocation.coordinates;
    const [jLng, jLat] = activeJob.serviceLocation.coordinates;

    const R = 6371; // Earth radius in km
    const dLat = (jLat - cLat) * Math.PI / 180;
    const dLng = (jLng - cLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(cLat * Math.PI / 180) * Math.cos(jLat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
  };

  // Generate continuous attendance dates list for heatmap rendering
  const getHeatmapGridDates = () => {
    const dates = [];
    const now = new Date();
    // 60 days baseline history
    for (let i = 59; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }
    return dates;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f6]">
        <Navbar />
        <div className="flex items-center justify-center h-[70vh]">
          <div className="text-center space-y-4">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
            </div>
            <p className="text-xs font-bold tracking-widest text-primary/80 uppercase">Synchronizing Command Center...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-on-surface flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow max-w-lg mx-auto w-full px-margin-mobile py-6 pb-24 relative">
        {/* Top welcome widget */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-[9px] font-bold text-primary uppercase tracking-widest block">Operational command</span>
            <h2 className="text-xl font-bold text-primary font-headline-md leading-tight capitalize">
              Hi, {profile?.firstName || 'Specialist'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Notification badge alert bell */}
            <button 
              onClick={() => setShowNotificationsDrawer(true)}
              className="relative p-2.5 bg-white shadow border border-outline-variant/30 rounded-full text-primary hover:scale-105 transition-all"
            >
              <FiBell size={16} />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              )}
            </button>
            {/* Shift clock button */}
            <button
              onClick={handleClockInOut}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow ${
                isShiftActive 
                  ? 'bg-red-50 text-red-600 border border-red-200' 
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}
            >
              <FiPower size={11} />
              {isShiftActive ? 'Clock Out' : 'Clock In'}
            </button>
          </div>
        </div>

        {/* Dynamic content rendering depending on tab selections */}
        <AnimatePresence mode="wait">
          {activeTab === 'jobs' && (
            <motion.div
              key="jobs"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Shift status details when active */}
              {isShiftActive && (
                <div className="bg-gradient-primary text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="flex justify-between items-center border-b border-white/20 pb-4 mb-4">
                    <div>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-[#dac2b6] block">SHIFT STATUS</span>
                      <span className="text-sm font-semibold flex items-center gap-1.5 mt-1 text-emerald-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                        Active Dispatch Duty
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-bold uppercase tracking-widest text-[#dac2b6] block">DURATION</span>
                      <span className="text-lg font-bold font-mono tracking-wide mt-1 block">{shiftDuration}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-[#dac2b6] block">Dispatches Completed</span>
                      <span className="text-lg font-bold mt-1 block">{earningsData.completedJobsCount} Jobs</span>
                    </div>
                    <div className="border-l border-white/20">
                      <span className="text-[8px] font-bold uppercase tracking-widest text-[#dac2b6] block">Earnings Today</span>
                      <span className="text-lg font-bold mt-1 block">₹{earningsData.todayEarnings}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Offline shift barrier */}
              {!isShiftActive ? (
                <div className="glass-card p-12 text-center rounded-3xl border border-outline-variant/20 shadow-lg">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                    <FiSliders size={28} className="text-primary" />
                  </div>
                  <h3 className="text-primary font-bold text-lg font-headline-md mb-2">Technician Offline</h3>
                  <p className="text-on-surface-variant text-xs max-w-xs mx-auto leading-relaxed mb-6">
                    Clock in for your shift to connect to the routing engine, download GPS logs, and receive real-time customer dispatches.
                  </p>
                  <button
                    onClick={handleClockInOut}
                    className="bg-gradient-primary text-white w-full py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all shadow-md active:scale-95"
                  >
                    Go Online Check-In
                  </button>
                </div>
              ) : activeJob ? (
                // Active Service Order layout
                <div className="glass-card border border-outline-variant/30 rounded-3xl p-5 shadow-lg relative overflow-hidden space-y-5">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500"></div>
                  
                  <div className="flex justify-between items-start pl-2">
                    <div>
                      <span className="bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest">
                        Active Service Dispatch
                      </span>
                      <h3 className="text-lg font-bold text-primary mt-1.5 capitalize font-headline-md">
                        {activeJob.serviceType?.replace(/_/g, ' ')}
                      </h3>
                      <p className="text-[10px] text-on-surface-variant/80 font-bold mt-1">ID: {activeJob.bookingId}</p>
                    </div>
                    <span className="text-xs font-bold text-primary bg-secondary-container px-3 py-1.5 rounded-full">
                      ₹{activeJob.cost?.totalCost || 1500}
                    </span>
                  </div>

                  {/* Distance estimation & Call button */}
                  <div className="bg-[#efeeeb]/40 border border-outline-variant/20 rounded-2xl p-3 flex justify-between items-center pl-4">
                    <div className="flex items-center gap-2">
                      <FiNavigation className="text-primary animate-pulse" size={16} />
                      <div>
                        <span className="text-[7px] font-bold text-secondary uppercase block">Perimeter Distance</span>
                        <span className="text-xs font-bold text-primary">{getDistanceToJob()} Away</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={`tel:${activeJob.customer?.phone}`}
                        className="p-2.5 bg-white border border-outline-variant/30 rounded-xl hover:scale-105 transition-all text-primary"
                      >
                        <FiPhone size={14} />
                      </a>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${activeJob.serviceLocation?.coordinates?.[1]},${activeJob.serviceLocation?.coordinates?.[0]}`}
                        target="_blank"
                        className="p-2.5 bg-primary text-white rounded-xl hover:scale-105 transition-all"
                      >
                        <FiMapPin size={14} />
                      </a>
                    </div>
                  </div>

                  {/* Leaflet Navigation Map card */}
                  <div className="relative rounded-2xl overflow-hidden border border-outline-variant/20 h-44 shadow-inner">
                    <div ref={mapRef} className="w-full h-full z-0" />
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-xl flex items-center justify-between text-white text-[8px] font-bold uppercase tracking-wider z-10 shadow-md">
                      <span>Address: {activeJob.serviceLocation?.address?.street}</span>
                    </div>
                  </div>

                  {/* Timeline Workflow Stage buttons */}
                  <div className="space-y-3">
                    <span className="text-[8px] font-bold text-secondary uppercase tracking-widest block">TRANSITION STAGE</span>
                    
                    {activeJob.status === 'accepted' && (
                      <button
                        onClick={() => handleStatusTransition('travelling')}
                        className="bg-primary text-white w-full py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all shadow flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <FiNavigation size={13} /> Initiate Travel (On The Way)
                      </button>
                    )}

                    {activeJob.status === 'travelling' && (
                      <button
                        onClick={() => handleStatusTransition('arrived')}
                        className="bg-primary text-white w-full py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all shadow flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <FiMapPin size={13} /> Log Arrived at Customer Site
                      </button>
                    )}

                    {activeJob.status === 'arrived' && (
                      <button
                        onClick={() => handleStatusTransition('started')}
                        className="bg-gradient-to-r from-orange-600 to-amber-500 text-white w-full py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all shadow flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <FiPlay size={13} /> Start Sanitization Service
                      </button>
                    )}

                    {activeJob.status === 'started' && (
                      <button
                        onClick={() => setShowCompleteModal(true)}
                        className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white w-full py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all shadow flex items-center justify-center gap-1.5 active:scale-95 animate-pulse"
                      >
                        <FiAward size={13} /> Complete Service & Authenticate
                      </button>
                    )}

                    {/* Standard emergency reject button inside active task */}
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="bg-white hover:bg-red-50 text-red-600 border border-red-200 w-full py-3 rounded-xl font-semibold uppercase text-[9px] tracking-wider transition-all mt-1"
                    >
                      Emergency Decline / Reassign Job
                    </button>
                  </div>
                </div>
              ) : (
                // Queue fully clear screen
                <div className="glass-card p-12 text-center rounded-3xl border border-outline-variant/15 shadow shadow-slate-100">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <FiSliders size={22} className="text-primary animate-pulse" />
                  </div>
                  <h3 className="text-primary font-bold text-sm uppercase tracking-wider mb-1">Scanning Dispatches</h3>
                  <p className="text-on-surface-variant text-[11px] max-w-xs mx-auto leading-relaxed">
                    Routing engine scanning for water purification services in your {settingsData.travelRadius} km perimeter...
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: Earnings Dashboard */}
          {activeTab === 'earnings' && (
            <motion.div
              key="earnings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Gold glass payout card */}
              <div className="bg-gradient-to-br from-[#6c2f00] to-[#8b4513] text-white p-6 rounded-3xl shadow-lg relative overflow-hidden border border-[#d4af37]/30">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
                <span className="text-[8px] font-bold uppercase tracking-widest text-[#dac2b6] block">Withdrawable Payout Wallet</span>
                <div className="flex justify-between items-end mt-2">
                  <h2 className="text-3xl font-bold tracking-tight">₹{earningsData.balance}</h2>
                  <button 
                    onClick={() => setShowWithdrawModal(true)}
                    className="bg-[#f3e2ac] hover:bg-white text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow active:scale-95"
                  >
                    Cash-Out Now
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-4 text-center">
                  <div>
                    <span className="text-[7px] font-bold text-[#dac2b6] uppercase block">This Week Earnings</span>
                    <span className="text-sm font-bold mt-0.5 block">₹{earningsData.weeklyEarnings}</span>
                  </div>
                  <div className="border-l border-white/10">
                    <span className="text-[7px] font-bold text-[#dac2b6] uppercase block">Incentives Earned</span>
                    <span className="text-sm font-bold mt-0.5 block">₹{earningsData.incentives}</span>
                  </div>
                </div>
              </div>

              {/* Area graph metrics */}
              <div className="glass-card p-5 border border-outline-variant/30 rounded-3xl shadow shadow-slate-100">
                <span className="text-[9px] font-bold text-primary uppercase tracking-widest block mb-4">Earnings History Trend</span>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={earningsData.transactions.filter(t => t.type !== 'withdrawal').slice(-7).reverse()} 
                      margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                    >
                      <XAxis dataKey="createdAt" tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })} fontSize={8} stroke="#877369" />
                      <YAxis fontSize={8} stroke="#877369" />
                      <Tooltip formatter={(value) => [`₹${value}`, 'Earned']} labelFormatter={(label) => new Date(label).toLocaleString()} />
                      <Area type="monotone" dataKey="amount" stroke="#8b4513" fillOpacity={0.15} fill="url(#colorEarnings)" />
                      <defs>
                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b4513" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b4513" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Transaction history logs list */}
              <div className="space-y-3">
                <span className="text-[9px] font-bold text-secondary uppercase tracking-widest block">Wallet Transaction Logs</span>
                
                {earningsData.transactions.length === 0 ? (
                  <p className="text-center text-xs text-on-surface-variant py-4 font-semibold">No transactions recorded yet.</p>
                ) : (
                  earningsData.transactions.map((tx) => (
                    <div 
                      key={tx._id} 
                      className="bg-white border border-outline-variant/20 rounded-2xl p-4 flex justify-between items-center shadow-sm"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-primary capitalize leading-tight">{tx.type} Log</h4>
                        <span className="text-[9px] text-on-surface-variant font-semibold mt-1 inline-block">
                          {new Date(tx.createdAt || tx.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        <p className="text-[9px] text-on-surface-variant/80 font-bold mt-0.5 truncate max-w-xs">{tx.description}</p>
                      </div>
                      <span className={`text-xs font-bold ${tx.type === 'withdrawal' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {tx.type === 'withdrawal' ? '-' : '+'}₹{Math.abs(tx.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: Performance Metrics & Streaks Heatmap */}
          {activeTab === 'performance' && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Core rating summary scorecards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-outline-variant/30 p-5 rounded-3xl text-center shadow-sm">
                  <span className="text-[8px] font-black text-secondary uppercase tracking-widest block">Rating Metric</span>
                  <span className="text-2xl font-black text-primary mt-2 block flex items-center justify-center gap-1">
                    ★ {profile?.rating?.toFixed(1) || '4.9'}
                  </span>
                  <span className="text-[8px] text-on-surface-variant/70 font-semibold mt-1 block">Based on {profile?.totalRatings || 24} ratings</span>
                </div>
                <div className="bg-white border border-outline-variant/30 p-5 rounded-3xl text-center shadow-sm">
                  <span className="text-[8px] font-black text-secondary uppercase tracking-widest block">Punctuality Score</span>
                  <span className="text-2xl font-black text-primary mt-2 block">98%</span>
                  <span className="text-[8px] text-on-surface-variant/70 font-semibold mt-1 block">Late pings strictly log checked</span>
                </div>
              </div>

              {/* GitHub style streak heatmap visualization */}
              <div className="glass-card p-5 border border-outline-variant/30 rounded-3xl shadow shadow-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Attendance Streak Heatmap</span>
                  <span className="text-[8px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded">
                    Active Streak: 8 days
                  </span>
                </div>
                
                {/* 10 x 6 styled date grids represent streak calendar */}
                <div className="grid grid-cols-10 gap-1.5 py-1 justify-items-center">
                  {getHeatmapGridDates().map((dtString, idx) => {
                    const record = attendanceHeatmap[dtString];
                    const hoursWorked = record?.workingHours || 0;
                    
                    // Determine grid shading based on hours
                    let gridColor = 'bg-gray-100'; // offline
                    if (record) {
                      if (hoursWorked >= 8) gridColor = 'bg-emerald-700 shadow-sm border border-emerald-800'; // High work
                      else if (hoursWorked > 4) gridColor = 'bg-emerald-500 border border-emerald-600'; // Medium work
                      else gridColor = 'bg-emerald-200 border border-emerald-300'; // Present but low hours
                    }

                    return (
                      <div 
                        key={idx}
                        className={`w-7 h-7 rounded-md cursor-pointer transition-all duration-300 hover:scale-110 flex items-center justify-center text-[7px] font-black text-white/95 font-mono ${gridColor}`}
                        title={`${new Date(dtString).toLocaleDateString()}: ${record ? `${hoursWorked} hrs (${record.status})` : 'Offline'}`}
                      >
                        {new Date(dtString).getDate()}
                      </div>
                    );
                  })}
                </div>
                
                {/* Scale hints */}
                <div className="flex justify-end gap-1.5 items-center text-[7px] font-bold uppercase tracking-wider text-secondary mt-3">
                  <span>Offline</span>
                  <span className="w-2.5 h-2.5 rounded bg-gray-100 border" />
                  <span className="w-2.5 h-2.5 rounded bg-emerald-200 border" />
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 border" />
                  <span className="w-2.5 h-2.5 rounded bg-emerald-700 border" />
                  <span>Elite Streak</span>
                </div>
              </div>

              {/* Quick feedback list */}
              <div className="space-y-3">
                <span className="text-[9px] font-bold text-secondary uppercase tracking-widest block">Recent Client Reviews</span>
                <div className="bg-white border border-outline-variant/20 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                    <FiStar size={12} fill="currentColor" />
                    <FiStar size={12} fill="currentColor" />
                    <FiStar size={12} fill="currentColor" />
                    <FiStar size={12} fill="currentColor" />
                    <FiStar size={12} fill="currentColor" />
                    <span className="text-[9px] text-secondary font-black ml-1 uppercase">Sidharth Sen</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant font-semibold leading-relaxed">
                    "Specialist checked our membrane output and calibrated pH. The TDS was 280 and is now 14. Unbelievable precision."
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: Profile Settings Config */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Duty toggle card */}
              <div className="bg-white border border-outline-variant/30 p-5 rounded-3xl shadow-sm space-y-4">
                <div>
                  <span className="text-[8px] font-black text-secondary uppercase tracking-widest block">Specialist ID Card</span>
                  <h3 className="font-bold text-primary text-base font-headline-md mt-1 truncate capitalize">
                    {profile?.firstName} {profile?.lastName}
                  </h3>
                  <span className="text-[9px] text-[#8b4513] font-mono tracking-widest block uppercase mt-0.5">ID: {profile?.agentId}</span>
                </div>
                
                {/* Active Availability Switch */}
                <div className="flex justify-between items-center border-t border-outline-variant/10 pt-3">
                  <div>
                    <span className="text-xs font-bold text-primary block leading-none">Command Duty State</span>
                    <span className="text-[9px] text-on-surface-variant font-semibold mt-0.5 inline-block">Realtime alerts depend on this status</span>
                  </div>
                  <div className="flex gap-1.5 p-1 bg-[#efeeeb] rounded-xl">
                    {['available', 'offline'].map((st) => (
                      <button
                        key={st}
                        onClick={async () => {
                          await agentService.updateStatus(st);
                          setProfile(prev => ({ ...prev, status: st }));
                          setSettingsData(prev => ({ ...prev, status: st }));
                          toast.success(`Duty status updated to ${st}`);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                          profile?.status === st 
                            ? 'bg-[#8b4513] text-white shadow-sm' 
                            : 'text-on-surface-variant hover:text-primary'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Config workspace form */}
              <form onSubmit={handleSaveSettings} className="glass-card p-6 rounded-3xl border border-outline-variant/30 space-y-5">
                <span className="text-[9px] font-bold text-primary uppercase tracking-widest block pb-2 border-b border-outline-variant/10">
                  Update Specialist Details
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-primary mb-1 uppercase tracking-wider">First Name</label>
                    <input 
                      type="text" 
                      required
                      value={settingsData.firstName} 
                      onChange={(e) => setSettingsData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-outline-variant rounded-xl text-xs font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-primary mb-1 uppercase tracking-wider">Last Name</label>
                    <input 
                      type="text" 
                      required
                      value={settingsData.lastName} 
                      onChange={(e) => setSettingsData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3 py-2 border border-outline-variant rounded-xl text-xs font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-primary mb-1 uppercase tracking-wider">Mobile Number</label>
                  <input 
                    type="text" 
                    required
                    value={settingsData.phone} 
                    onChange={(e) => setSettingsData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-outline-variant rounded-xl text-xs font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm bg-white"
                  />
                </div>

                {/* Duty radius settings slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[9px] font-bold text-primary uppercase tracking-wider">Duty Radius Perimeter</label>
                    <span className="text-primary font-bold text-xs bg-primary/10 px-2 py-0.5 rounded-full">{settingsData.travelRadius} km</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    step="5"
                    value={settingsData.travelRadius} 
                    onChange={(e) => setSettingsData(prev => ({ ...prev, travelRadius: parseInt(e.target.value) }))}
                    className="w-full h-1 bg-[#efeeeb] rounded-lg appearance-none cursor-pointer accent-primary border border-outline-variant/10"
                  />
                  <div className="flex justify-between text-[7px] text-on-surface-variant/50 font-bold mt-1 uppercase tracking-widest">
                    <span>5 km</span>
                    <span>25 km</span>
                    <span>50 km</span>
                  </div>
                </div>

                {/* Notification preferences toggles */}
                <div className="space-y-3 pt-2">
                  <span className="text-[8px] font-black text-secondary uppercase tracking-widest block">Operational Alert configs</span>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-semibold text-[11px] uppercase tracking-wider">Dispatch Email Alerts</span>
                    <button 
                      type="button"
                      onClick={() => setSettingsData(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                      className={`relative inline-flex h-4 w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settingsData.emailNotifications ? 'bg-primary' : 'bg-gray-300'}`}
                    >
                      <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settingsData.emailNotifications ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-semibold text-[11px] uppercase tracking-wider">Dispatched SMS Alerts</span>
                    <button 
                      type="button"
                      onClick={() => setSettingsData(prev => ({ ...prev, smsNotifications: !prev.smsNotifications }))}
                      className={`relative inline-flex h-4 w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settingsData.smsNotifications ? 'bg-primary' : 'bg-gray-300'}`}
                    >
                      <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settingsData.smsNotifications ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="bg-gradient-primary text-white w-full py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all shadow-md active:scale-95 mt-4"
                >
                  Save Workspace Configurations
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ----------------------------------------------------
          MODALS & DRAWER TRAYS
         ---------------------------------------------------- */}

      {/* Incoming Job Real-Time Acceptance Card Modal */}
      <AnimatePresence>
        {incomingJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 border-2 border-[#d4af37] shadow-2xl relative overflow-hidden text-center space-y-6"
            >
              {/* Glowing countdown timer circle */}
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="34" stroke="#efeeeb" strokeWidth="6" fill="transparent" />
                  <circle cx="40" cy="40" r="34" stroke="#d4af37" strokeWidth="6" fill="transparent" 
                    strokeDasharray={213}
                    strokeDashoffset={213 - (213 * acceptanceTimer) / 60}
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className="absolute text-xl font-black text-primary font-mono">{acceptanceTimer}s</span>
              </div>

              <div>
                <span className="bg-[#f3e2ac] text-primary border border-primary/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block">
                  ⚡ New Booking Assigned!
                </span>
                <h3 className="text-xl font-black text-primary font-headline-md tracking-tight capitalize mt-3">
                  {incomingJob.serviceType?.replace(/_/g, ' ')}
                </h3>
                <p className="text-[11px] text-on-surface-variant font-semibold mt-2.5 flex items-center justify-center gap-1.5">
                  <FiMapPin className="text-[#8b4513]" /> {incomingJob.serviceLocation?.address?.street}, {incomingJob.serviceLocation?.address?.city}
                </p>
                <div className="bg-[#efeeeb]/40 border border-outline-variant/20 rounded-2xl p-3.5 mt-4 text-center">
                  <span className="text-[8px] font-bold text-secondary uppercase block">Booking Fee Payout</span>
                  <span className="text-lg font-black text-[#8b4513] mt-1 block">₹{Math.round((incomingJob.cost?.totalCost || 1500) * 0.7)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold py-3.5 rounded-xl uppercase text-[9px] tracking-wider transition-all active:scale-95"
                >
                  Decline Job
                </button>
                <button
                  onClick={handleAcceptJob}
                  className="bg-gradient-primary text-white font-bold py-3.5 rounded-xl uppercase text-[9px] tracking-wider transition-all shadow-md active:scale-95"
                >
                  Accept & Travel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Job Reason Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5"
            >
              <h3 className="text-lg font-bold text-primary font-headline-md border-b pb-3">Select Rejection Reason</h3>
              
              <div className="space-y-2">
                {[
                  'Traffic / Distance too far',
                  'Emergency vehicle issue',
                  'Prior schedule delay',
                  'Required tools unavailable',
                  'Off-hours urgent support error'
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setRejectReason(reason)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold border transition-all ${
                      rejectReason === reason 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-outline-variant/30 text-on-surface-variant hover:bg-gray-50'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 border border-outline-variant/30 text-primary font-bold text-[10px] rounded-lg uppercase tracking-wider"
                >
                  Close
                </button>
                <button
                  onClick={() => handleRejectJob(rejectReason)}
                  disabled={!rejectReason}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded-lg uppercase tracking-wider shadow disabled:opacity-50"
                >
                  Decline Dispatch
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Proof-of-Service Signature Drawing Completion Modal */}
      <AnimatePresence>
        {showCompleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5"
            >
              <div>
                <span className="text-[8px] font-bold text-[#8b4513] uppercase tracking-widest block">AUTHENTICATION REQUIRED</span>
                <h3 className="text-xl font-bold text-primary font-headline-md tracking-tight mt-1">Proof of Completed Service</h3>
              </div>

              {/* HTML Canvas drawing pad */}
              <div>
                <label className="block text-[9px] font-bold text-secondary uppercase tracking-wider mb-2">
                  Client Autograph Signature
                </label>
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="border-2 border-dashed border-outline-variant/40 bg-gray-50 rounded-xl cursor-crosshair w-full"
                />
                <div className="flex justify-between items-center mt-2.5 text-[9px] font-bold uppercase tracking-wider">
                  <span className="text-on-surface-variant/50">Draw with touch/cursor</span>
                  <button 
                    type="button" 
                    onClick={clearCanvas}
                    className="text-red-600 hover:underline"
                  >
                    Clear autograph
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="bg-white border border-outline-variant/30 text-primary font-bold py-3.5 rounded-xl uppercase text-[9px] tracking-wider transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteService}
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold py-3.5 rounded-xl uppercase text-[9px] tracking-wider transition-all shadow-md active:scale-95"
                >
                  Authenticate Complete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cash-Out Payout Withdrawal Modal Drawer */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-inverse-surface/40 backdrop-blur-sm">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-[#faf9f6] rounded-t-3xl w-full max-w-sm p-6 shadow-2xl space-y-5 border-t border-outline-variant/30"
            >
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
                <h3 className="text-lg font-bold text-primary font-headline-md">Instant Wallet Cash-Out</h3>
                <button 
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawAmount('');
                  }}
                  className="text-primary font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRequestWithdrawal} className="space-y-4">
                <div className="bg-white border border-outline-variant/30 p-4 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[8px] font-bold text-secondary uppercase block">Registered Bank</span>
                    <span className="text-xs font-bold text-primary mt-1 block">HDFC Bank •••• 9845</span>
                  </div>
                  <span className="bg-[#f3e2ac] text-primary text-[8px] font-bold px-2 py-0.5 rounded border border-primary/20">DEFAULT</span>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5 text-[9px] font-bold uppercase tracking-wider text-secondary">
                    <span>Withdrawal Amount (INR)</span>
                    <span>Max: ₹{earningsData.balance}</span>
                  </div>
                  <div className="relative">
                    <FiDollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                    <input 
                      type="number" 
                      required
                      min="100"
                      max={earningsData.balance}
                      placeholder="Enter amount to cash-out"
                      value={withdrawAmount} 
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 border border-outline-variant rounded-xl text-sm font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm bg-white"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="bg-gradient-primary text-white w-full py-4 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all shadow-md active:scale-95 mt-4"
                >
                  Confirm Payout Transfer
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Real-time Alert Notifications Drawer Panel */}
      <AnimatePresence>
        {showNotificationsDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end bg-inverse-surface/40 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="bg-[#faf9f6] w-full max-w-sm h-full shadow-2xl p-6 flex flex-col justify-between"
            >
              <div className="space-y-5 overflow-y-auto flex-grow pr-1">
                <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
                  <h3 className="text-lg font-bold text-primary font-headline-md flex items-center gap-1.5">
                    <FiBell size={18} /> Operational Alerts
                  </h3>
                  <button 
                    onClick={() => setShowNotificationsDrawer(false)}
                    className="text-primary font-bold text-sm"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-3">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs text-on-surface-variant font-semibold py-8">No alerts or dispatches.</p>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif._id}
                        onClick={() => !notif.isRead && markNotificationRead(notif._id)}
                        className={`p-4 border rounded-2xl transition-all cursor-pointer ${
                          !notif.isRead 
                            ? 'bg-[#f3e2ac]/10 border-l-4 border-l-primary border-outline-variant/40 shadow-sm' 
                            : 'bg-white border-outline-variant/10 opacity-70'
                        }`}
                      >
                        <h4 className="text-xs font-bold text-primary leading-tight">{notif.title}</h4>
                        <p className="text-[10px] text-on-surface-variant font-semibold mt-1 leading-normal">{notif.message}</p>
                        <span className="text-[8px] text-on-surface-variant/60 font-semibold mt-2 inline-block">
                          {new Date(notif.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/20">
                <button 
                  onClick={async () => {
                    const unread = notifications.filter(n => !n.isRead);
                    await Promise.all(unread.map(n => notificationService.markAsRead(n._id)));
                    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                    toast.success('All alerts marked as read');
                  }}
                  className="w-full py-3 bg-[#efeeeb] hover:bg-gray-200 border border-outline-variant/20 text-primary rounded-xl font-bold text-[10px] uppercase tracking-wider"
                >
                  Mark all as read
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Sticky Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#faf9f6]/95 backdrop-blur-md border-t border-outline-variant/30 px-margin-mobile py-2.5 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] flex justify-around max-w-lg mx-auto rounded-t-3xl">
        {[
          { id: 'jobs', label: 'Dispatches', icon: FiActivity },
          { id: 'earnings', label: 'Earnings', icon: FiDollarSign },
          { id: 'performance', label: 'Performance', icon: FiAward },
          { id: 'profile', label: 'Configure', icon: FiSettings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 transition-all ${
                isSel ? 'text-primary scale-105' : 'text-on-surface-variant/60 hover:text-primary/75'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                isSel ? 'bg-[#f3e2ac] text-primary' : 'bg-transparent'
              }`}>
                <Icon size={16} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <Footer />
    </div>
  );
};

export default AgentDashboard;
