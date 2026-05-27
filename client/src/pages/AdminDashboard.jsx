import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { adminService } from '../services/services';
import toast from 'react-hot-toast';
import SecurityDashboard from '../components/SecurityDashboard';
import { FiUsers, FiMapPin, FiCheckCircle, FiClock, FiLock, FiCreditCard, FiShield, FiUserCheck, FiAlertCircle, FiRefreshCw, FiCheck, FiInfo, FiFileText, FiCamera, FiUpload, FiImage, FiTrash2, FiUser, FiMail } from 'react-icons/fi';

const AdminDashboard = () => {
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get('view') || 'dashboard';
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedBookingForAssign, setSelectedBookingForAssign] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [agentForm, setAgentForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    agentId: '',
    passcode: '',
    profileImage: '',
    aadharNumber: '',
    panNumber: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Aadhaar Verification state variables
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [aadhaarConsent, setAadhaarConsent] = useState(false);
  const [aadhaarStep, setAadhaarStep] = useState('input'); // 'input', 'verifying', 'otp', 'submitting_otp', 'success', 'error'
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [aadhaarError, setAadhaarError] = useState('');
  const [aadhaarOtpError, setAadhaarOtpError] = useState('');
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [aadhaarMaskedPhone, setAadhaarMaskedPhone] = useState('');
  const [aadhaarCooldown, setAadhaarCooldown] = useState(0);
  const [aadhaarShake, setAadhaarShake] = useState(false);
  const [isAadhaarSandbox, setIsAadhaarSandbox] = useState(false);

  // PAN Verification state variables
  const [panInput, setPanInput] = useState('');
  const [panConsent, setPanConsent] = useState(false);
  const [panStep, setPanStep] = useState('input'); // 'input', 'verifying', 'success', 'error'
  const [panError, setPanError] = useState('');
  const [panVerified, setPanVerified] = useState(false);

  // Email Verification state variables
  const [emailInput, setEmailInput] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccessMessage, setEmailSuccessMessage] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailPollingActive, setEmailPollingActive] = useState(false);
  const pollingIntervalRef = useRef(null);

  // Profile Picture Upload state variables
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  
  // Workforce Onboarding upgraded states
  const [agentSubView, setAgentSubView] = useState('active'); // 'active', 'pending', 'rejected_suspended'
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showViewProfileModal, setShowViewProfileModal] = useState(false);
  const [selectedAgentForAction, setSelectedAgentForAction] = useState(null);
  const [approvePasscode, setApprovePasscode] = useState('');
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsResponse = await adminService.getDashboardStats();
        const bookingsResponse = await adminService.getAllBookings(1, 10);
        const agentsResponse = await adminService.getAllAgents(1, 10);
        setStats(statsResponse.data);
        setBookings(bookingsResponse.data.bookings);
        setAgents(agentsResponse.data.agents);
      } catch (error) {
        toast.error('Failed to load admin dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let timer;
    if (aadhaarCooldown > 0) {
      timer = setInterval(() => {
        setAadhaarCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [aadhaarCooldown]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-2xl font-bold text-primary">Loading...</div>
        </div>
      </div>
    );
  }

  const dashboardStats = [
    { label: 'Total Customers', value: stats?.totalCustomers, icon: <FiUsers size={24} /> },
    { label: 'Total Agents', value: stats?.totalAgents, icon: <FiMapPin size={24} /> },
    { label: 'Total Bookings', value: stats?.totalBookings, icon: <FiClock size={24} /> },
    { label: 'Completed', value: stats?.completedBookings, icon: <FiCheckCircle size={24} /> },
  ];

  const viewCopy = {
    dashboard: {
      title: 'Admin Dashboard',
      description: 'High-level overview of customers, agents, bookings and service progress.',
    },
    agents: {
      title: 'Manage Agents',
      description: 'Create service agent accounts, manage credentials and review document details.',
    },
    bookings: {
      title: 'Manage Bookings',
      description: 'Track customer bookings, assigned agents and current service status.',
    },
    analytics: {
      title: 'Analytics',
      description: 'Review operational performance and service activity across the platform.',
    },
  };

  const completedRate = stats?.totalBookings
    ? Math.round((stats.completedBookings / stats.totalBookings) * 100)
    : 0;

  const pendingBookings = bookings.filter((booking) => booking.status === 'pending').length;

  const handleApproveAgentWithPasscode = async (e) => {
    e.preventDefault();
    if (!approvePasscode || approvePasscode.length < 6) {
      toast.error('Passcode must be at least 6 characters');
      return;
    }

    try {
      const response = await adminService.approveAgent(selectedAgentForAction._id, approvePasscode);
      setAgents((currentAgents) =>
        currentAgents.map((agent) => (agent._id === selectedAgentForAction._id ? response.data.agent : agent))
      );
      toast.success('Technician approved and credentials dispatched successfully');
      setShowApproveModal(false);
      setSelectedAgentForAction(null);
      setApprovePasscode('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not approve agent');
    }
  };

  const handleRejectAgentWithReason = async (e) => {
    e.preventDefault();
    if (!rejectionReasonText.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }

    try {
      const response = await adminService.rejectAgent(selectedAgentForAction._id, rejectionReasonText);
      setAgents((currentAgents) =>
        currentAgents.map((agent) => (agent._id === selectedAgentForAction._id ? response.data.agent : agent))
      );
      toast.success('Technician application rejected successfully');
      setShowRejectModal(false);
      setSelectedAgentForAction(null);
      setRejectionReasonText('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not reject agent');
    }
  };

  const handleSuspendAgent = async (agentId) => {
    if (!window.confirm('Are you sure you want to suspend this technician account? This will instantly terminate their active sessions.')) {
      return;
    }

    try {
      const response = await adminService.suspendAgent(agentId);
      setAgents((currentAgents) =>
        currentAgents.map((agent) => (agent._id === agentId ? response.data.agent : agent))
      );
      toast.success('Technician suspended successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not suspend agent');
    }
  };

  const handleDeleteAgent = async (agentId) => {
    if (!window.confirm('Are you sure you want to delete this agent? This will unassign them from any active bookings.')) {
      return;
    }
    try {
      await adminService.deleteAgent(agentId);
      setAgents((currentAgents) => currentAgents.filter((agent) => agent._id !== agentId));
      toast.success('Agent deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not delete agent');
    }
  };

  const handleUnassignAgent = async (bookingId) => {
    try {
      await adminService.unassignAgent(bookingId);
      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking._id === bookingId
            ? {
                ...booking,
                assignedAgent: null,
                status: 'pending',
              }
            : booking
        )
      );
      toast.success('Agent unassigned successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not unassign agent');
    }
  };

  const handleAssignAgent = async () => {
    if (!selectedBookingForAssign || !selectedAgentId) {
      toast.error('Please select both booking and agent');
      return;
    }

    setIsAssigning(true);
    try {
      await adminService.assignAgent(selectedBookingForAssign._id, selectedAgentId);
      
      // Update the bookings list
      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking._id === selectedBookingForAssign._id
            ? {
                ...booking,
                assignedAgent: agents.find((a) => a._id === selectedAgentId),
              }
            : booking
        )
      );

      toast.success('Agent assigned successfully');
      setSelectedBookingForAssign(null);
      setSelectedAgentId('');
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Could not assign agent'
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAgentFormChange = (event) => {
    const { name, value } = event.target;
    if (name === 'phone') {
      const cleanValue = value.replace(/\D/g, '').slice(0, 10);
      setAgentForm((currentForm) => ({ ...currentForm, [name]: cleanValue }));
      return;
    }
    setAgentForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  // Aadhaar Input & Form Bind Handler
  const handleAadhaarChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 12);
    let formattedVal = '';
    for (let i = 0; i < rawVal.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedVal += ' ';
      }
      formattedVal += rawVal[i];
    }
    setAadhaarInput(formattedVal);
    setAadhaarError('');
    setAgentForm(prev => ({ ...prev, aadharNumber: rawVal }));
  };

  // PAN Input & Form Bind Handler
  const handlePanChange = (e) => {
    let rawVal = e.target.value.toUpperCase();
    rawVal = rawVal.replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setPanInput(rawVal);
    
    // Inline real-time regex check once 10 characters are completed
    if (rawVal.length === 10) {
      const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panPattern.test(rawVal)) {
        setPanError('Invalid PAN format (expected ABCDE1234F).');
      } else {
        setPanError('');
      }
    } else {
      setPanError('');
    }
    setAgentForm(prev => ({ ...prev, panNumber: rawVal }));
  };

  const validateEmailFormat = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailInputChange = (e) => {
    const val = e.target.value;
    setEmailInput(val);
    setEmailSuccessMessage('');
    setEmailVerified(false);
    setEmailSent(false);

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setEmailPollingActive(false);
    }

    if (val === '') {
      setEmailError('');
    } else if (!validateEmailFormat(val)) {
      setEmailError('Please enter a valid email format (e.g. name@domain.com)');
    } else {
      setEmailError('');
    }
  };

  const triggerEmailVerify = async (e) => {
    e.preventDefault();
    if (!validateEmailFormat(emailInput)) {
      setEmailError('Please enter a valid email format before verifying.');
      return;
    }
    
    setEmailVerifying(true);
    setEmailError('');
    setEmailSuccessMessage('');
    
    try {
      await adminService.sendEmailVerification(emailInput);
      setEmailVerifying(false);
      setEmailSent(true);
      setEmailSuccessMessage('Verification link sent successfully');
      toast.success('Secure verification email sent successfully!');
      
      // Clear any existing polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      // Start checking verification status every 3 seconds
      setEmailPollingActive(true);
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const res = await adminService.checkEmailVerification(emailInput);
          if (res.data && res.data.isVerified) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            setEmailPollingActive(false);
            setEmailVerified(true);
            setAgentForm(prev => ({ ...prev, email: emailInput }));
            toast.success('Email verified successfully!');
          }
        } catch (err) {
          console.error('Error polling verification status:', err);
        }
      }, 3000);
    } catch (error) {
      setEmailVerifying(false);
      setEmailError(error.response?.data?.error || 'Failed to dispatch verification email');
      toast.error('Could not send verification email');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = async (file) => {
    setUploadError('');
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only JPG, PNG, and WEBP are supported.');
      toast.error('Unsupported image format');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size is too large. Maximum size allowed is 5MB.');
      toast.error('File size exceeds 5MB');
      return;
    }

    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setFilePreviewUrl(localUrl);

    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const progressTimer = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return prev + 15;
        });
      }, 100);

      const response = await adminService.uploadAvatar(formData);
      clearInterval(progressTimer);
      setUploadProgress(100);
      
      setTimeout(() => {
        setIsUploading(false);
        setAgentForm(prev => ({ ...prev, profileImage: response.data.avatarUrl }));
        toast.success('Profile picture uploaded and compressed successfully!');
      }, 300);
    } catch (error) {
      setIsUploading(false);
      setUploadError(error.response?.data?.error || 'Failed to securely upload and compress avatar.');
      toast.error('Secure upload failed');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setFilePreviewUrl('');
    setUploadProgress(0);
    setUploadError('');
    setAgentForm(prev => ({ ...prev, profileImage: '' }));
    toast.success('Profile picture removed');
  };

  const handleCreateAgent = async (event) => {
    event.preventDefault();

    if (!emailVerified) {
      toast.error('Please verify the Email address before registering the agent.');
      return;
    }

    const cleanAadhaar = agentForm.aadharNumber;
    if (cleanAadhaar.length !== 12) {
      toast.error('Aadhaar number must be exactly 12 digits.');
      return;
    }

    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panPattern.test(agentForm.panNumber)) {
      toast.error('Invalid PAN number format (expected ABCDE1234F).');
      return;
    }

    try {
      const response = await adminService.createAgent(agentForm);
      setAgents((currentAgents) => [response.data.agent, ...currentAgents]);
      setAgentForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        agentId: '',
        passcode: '',
        profileImage: '',
        aadharNumber: '',
        panNumber: '',
      });
      
      // Reset Email verification state
      setEmailInput('');
      setEmailVerified(false);
      setEmailVerifying(false);
      setEmailError('');
      setEmailSuccessMessage('');
      setEmailSent(false);

      // Reset Avatar picture upload states
      setSelectedFile(null);
      setFilePreviewUrl('');
      setUploadProgress(0);
      setUploadError('');

      // Reset simplified KYC inputs
      setAadhaarInput('');
      setAadhaarError('');
      setPanInput('');
      setPanError('');

      toast.success(`Agent created successfully! ID: ${response.data.login.agentId}`);
      setShowAddAgentModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not create agent');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl font-bold mb-2">{viewCopy[currentView]?.title || viewCopy.dashboard.title}</h1>
            <p className="text-gray-600">{viewCopy[currentView]?.description || viewCopy.dashboard.description}</p>
          </motion.div>

          {/* Stats Grid & Operations Hub */}
          {currentView === 'dashboard' && (
            <div className="space-y-8">
              {/* Premium Ceramic Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardStats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)] hover:border-primary/20 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mb-2">
                          {stat.label}
                        </p>
                        <p className="text-3xl font-black text-slate-800 tracking-tight">
                          {stat.value || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-[#faf9f6] rounded-2xl border border-slate-100 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/5">
                        {stat.icon}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Split-Column Operations Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
                
                {/* Left Side: Completion Rate Circular Indicator & Recent Bookings List (2 Columns) */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Completion Rate Indicator Card */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-6 justify-between border-b border-slate-100 pb-5 mb-5">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary">Service Performance Metrics</span>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight mt-0.5">Completed Service Calibration</h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                          Calculated based on scheduled maintenance vs authenticated water purity certificates completed by specialists.
                        </p>
                      </div>

                      {/* SVG Circular Progress Ring */}
                      <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="56" cy="56" r="46" stroke="#efeeeb" strokeWidth="8" fill="transparent" />
                          <motion.circle 
                            cx="56" cy="56" r="46" 
                            stroke="url(#progressGradient)" strokeWidth="8" fill="transparent" 
                            strokeDasharray={2 * Math.PI * 46}
                            initial={{ strokeDashoffset: 2 * Math.PI * 46 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 46 * (1 - completedRate / 100) }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                          />
                          <defs>
                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#753401" />
                              <stop offset="100%" stopColor="#d4af37" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center font-semibold">
                          <span className="text-xl font-black text-slate-800 font-mono tracking-tighter">{completedRate}%</span>
                          <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">CALIBRATED</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-[#faf9f6] p-3 border border-slate-100 rounded-2xl">
                        <span className="text-[8px] font-bold text-slate-500 uppercase block">Pending dispatches</span>
                        <span className="text-lg font-black text-slate-800 block mt-0.5">{bookings.filter(b => b.status === 'pending').length}</span>
                      </div>
                      <div className="bg-[#faf9f6] p-3 border border-slate-100 rounded-2xl">
                        <span className="text-[8px] font-bold text-slate-500 uppercase block">Active service</span>
                        <span className="text-lg font-black text-slate-800 block mt-0.5">{bookings.filter(b => b.status === 'in_progress' || b.status === 'confirmed').length}</span>
                      </div>
                      <div className="bg-[#faf9f6] p-3 border border-slate-100 rounded-2xl">
                        <span className="text-[8px] font-bold text-slate-500 uppercase block">Completed Calibration</span>
                        <span className="text-lg font-black text-emerald-600 block mt-0.5">{stats?.completedBookings || 0}</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Recent Bookings Queue Table */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]"
                  >
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                      <h3 className="text-md font-black text-slate-800 uppercase tracking-wider">Active Service Requests Queue</h3>
                      <button
                        onClick={() => setSearchParams({ view: 'bookings' })}
                        className="text-xs font-black uppercase tracking-wider text-primary hover:underline"
                      >
                        Inspect Full Queue
                      </button>
                    </div>

                    {bookings.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-sm">
                        No active bookings currently scheduled in the platform workspace.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-100 text-left text-[10px] font-black uppercase tracking-wider text-secondary">
                              <th className="py-3 px-2">Booking ID</th>
                              <th className="py-3 px-2">Client Name</th>
                              <th className="py-3 px-2">Service Type</th>
                              <th className="py-3 px-2">Status</th>
                              <th className="py-3 px-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookings.slice(0, 5).map((booking) => (
                              <tr key={booking._id} className="border-b border-slate-100 text-xs hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-2 font-mono font-bold text-slate-600">{booking.bookingId}</td>
                                <td className="py-3 px-2 font-semibold text-slate-800">{booking.customer?.firstName || 'Valued Customer'}</td>
                                <td className="py-3 px-2 capitalize font-semibold text-slate-600">{booking.serviceType?.replace(/_/g, ' ')}</td>
                                <td className="py-3 px-2">
                                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                    booking.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    booking.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    'bg-blue-50 text-blue-700 border-blue-200'
                                  }`}>
                                    {booking.status}
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-right">
                                  <button
                                    onClick={() => setSearchParams({ view: 'bookings' })}
                                    className="px-3 py-1.5 bg-slate-50 border hover:bg-primary hover:text-on-primary text-primary rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all"
                                  >
                                    Manage
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Right Side: Platform Dispatch Boundary Map SVG & Specialist Fleet breakdown (1 Column) */}
                <div className="lg:col-span-1 space-y-8">
                  {/* Platform Dispatch Boundary Map */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                        <FiMapPin size={13} className="text-primary animate-pulse" /> Active Dispatch Perimeter
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded">
                        Sync Active
                      </span>
                    </div>

                    <div className="relative h-40 rounded-2xl border border-slate-100 overflow-hidden bg-slate-950 flex items-center justify-center shadow-inner">
                      <svg className="w-full h-full opacity-50 pointer-events-none" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 40 H400 M0 80 H400 M0 120 H400 M0 160 H400" stroke="#1e293b" strokeWidth="0.5" />
                        <path d="M80 0 V200 M160 0 V200 M240 0 V200 M320 0 V200" stroke="#1e293b" strokeWidth="0.5" />
                        <circle cx="200" cy="100" r="70" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="4 4" />
                        <circle cx="200" cy="100" r="40" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" />
                        
                        {/* Dispatch coordinates dots */}
                        <circle cx="200" cy="100" r="5" fill="#753401" className="animate-pulse" />
                        <circle cx="200" cy="100" r="3" fill="#753401" />
                        <circle cx="160" cy="80" r="4" fill="#0ea5e9" />
                        <line x1="200" y1="100" x2="160" y2="80" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="3 3" />
                        <circle cx="250" cy="120" r="4" fill="#10b981" />
                        <line x1="200" y1="100" x2="250" y2="120" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />

                        <text x="210" y="95" fill="#753401" fontSize="8" fontWeight="black">Command Base</text>
                        <text x="110" y="75" fill="#0ea5e9" fontSize="8" fontWeight="bold">Agent Assigned</text>
                        <text x="260" y="125" fill="#10b981" fontSize="8" fontWeight="bold">Technician En Route</text>
                      </svg>
                      <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 border border-slate-800 rounded-xl flex items-center justify-between text-white text-[8px] font-black uppercase tracking-wider">
                        <span>Dispatch perimeter: 25 km</span>
                        <span className="text-emerald-400">HQ Online</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Specialist Fleet Status Card */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 pb-3 border-b border-slate-100 block">
                      <FiShield size={13} className="text-primary" /> Specialist Fleet Status
                    </span>

                    <div className="space-y-3 text-xs font-semibold">
                      <div className="flex justify-between items-center bg-[#faf9f6] border border-slate-100 p-3 rounded-xl">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Active Service Agents</span>
                        <span className="font-mono font-bold text-slate-800">{stats?.totalAgents || 0} Calibrated</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#faf9f6] border border-slate-100 p-3 rounded-xl">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Approved Fleet Coverage</span>
                        <span className="font-mono font-bold text-slate-800">{agents.filter(a => a.isApproved).length} Approved</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#faf9f6] border border-slate-100 p-3 rounded-xl">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Average Specialist Rating</span>
                        <span className="font-mono font-bold text-amber-600">★ 4.8 / 5.0</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Remote Sessions Security Dashboard */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]"
                  >
                    <SecurityDashboard />
                  </motion.div>
                </div>
              </div>
            </div>
          )}

          {/* Agent Management */}
          {currentView === 'agents' && (
          <div className="glass-card rounded-3xl border border-slate-200/80 p-8 mb-12 shadow-sm bg-white/40 backdrop-blur-2xl">
            {/* Header section with Onboard Specialist Button */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-4 border-b border-slate-200/40">
              <div>
                <h2 className="text-2xl font-black text-primary tracking-tight">Workforce Approvals & Fleet Control</h2>
                <p className="text-[#753401]/60 text-xs font-semibold mt-1">Review applicant technicians, approve credentials, and manage your service fleet.</p>
              </div>
              <button
                onClick={() => {
                  setAgentForm({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    passcode: '',
                    profileImage: '',
                    aadharNumber: '',
                    panNumber: '',
                  });
                  setEmailVerified(true); // Direct onboarding has no email link gate
                  setEmailInput('');
                  setFilePreviewUrl('');
                  setAadhaarInput('');
                  setPanInput('');
                  setShowAddAgentModal(true);
                }}
                className="px-5 py-3.5 bg-gradient-primary text-on-primary rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:translate-y-[-1px] active:scale-[0.98] transition-all flex items-center gap-1.5 self-start cursor-pointer hover:shadow-lg"
              >
                ➕ Onboard Specialist
              </button>
            </div>

            {/* Split View Sub-Tabs */}
            <div className="flex gap-6 border-b border-slate-100 mb-6 font-semibold">
              <button
                onClick={() => setAgentSubView('active')}
                className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors relative flex items-center gap-1.5 ${agentSubView === 'active' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Active Fleet ({agents.filter(a => a.registrationStatus === 'active').length})
                {agentSubView === 'active' && (
                  <motion.div layoutId="activeAgentTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setAgentSubView('pending')}
                className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors relative flex items-center gap-1.5 ${agentSubView === 'pending' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Pending Applications ({agents.filter(a => a.registrationStatus === 'pending').length})
                {agents.filter(a => a.registrationStatus === 'pending').length > 0 && (
                  <span className="w-4.5 h-4.5 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                    {agents.filter(a => a.registrationStatus === 'pending').length}
                  </span>
                )}
                {agentSubView === 'pending' && (
                  <motion.div layoutId="activeAgentTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setAgentSubView('rejected_suspended')}
                className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors relative ${agentSubView === 'rejected_suspended' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Rejected / Suspended ({agents.filter(a => ['rejected', 'suspended'].includes(a.registrationStatus)).length})
                {agentSubView === 'rejected_suspended' && (
                  <motion.div layoutId="activeAgentTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>

            {/* List Tables */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest text-left">
                    <th className="py-3 px-4">Photo</th>
                    <th className="py-3 px-4">Specialist ID</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Email / Phone</th>
                    <th className="py-3 px-4">Vetted Documents</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Action Controls</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-semibold text-slate-700">
                  {agents
                    .filter((agent) => {
                      if (agentSubView === 'active') return agent.registrationStatus === 'active';
                      if (agentSubView === 'pending') return agent.registrationStatus === 'pending';
                      return ['rejected', 'suspended'].includes(agent.registrationStatus);
                    })
                    .map((agent) => (
                      <tr key={agent._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        {/* circular profile image */}
                        <td className="py-3.5 px-4">
                          {agent.profileImage ? (
                            <img src={agent.profileImage} alt="" className="h-10 w-10 rounded-full object-cover border shadow-sm" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase">
                              {agent.firstName?.[0]}{agent.lastName?.[0]}
                            </div>
                          )}
                        </td>

                        {/* Specialist ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-primary tracking-wide">
                          {agent.agentId}
                        </td>

                        {/* Name */}
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {agent.firstName} {agent.lastName}
                        </td>

                        {/* Email/Phone */}
                        <td className="py-3.5 px-4 leading-normal">
                          <p className="text-slate-655">{agent.email}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{agent.phone}</p>
                        </td>

                        {/* KYC Proofs */}
                        <td className="py-3.5 px-4 leading-normal">
                          <p className="font-mono text-[11px] text-slate-600">AADHAAR: XXXX XXXX {agent.documents?.aadhar?.slice(-4) || 'None'}</p>
                          <p className="font-mono text-[11px] text-slate-600">PAN: {agent.documents?.panCard || 'None'}</p>
                        </td>

                        {/* Status badges */}
                        <td className="py-3.5 px-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            agent.registrationStatus === 'active'
                              ? 'bg-green-50 text-green-700 border border-green-150'
                              : agent.registrationStatus === 'pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-150'
                                : agent.registrationStatus === 'suspended'
                                  ? 'bg-red-50 text-red-700 border border-red-150'
                                  : 'bg-slate-100 text-slate-600 border'
                          }`}>
                            {agent.registrationStatus}
                          </span>
                          {agent.registrationStatus === 'rejected' && agent.rejectedReason && (
                            <p className="text-[9px] text-amber-600 italic mt-1 max-w-[150px] truncate" title={agent.rejectedReason}>
                              {agent.rejectedReason}
                            </p>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* View Profile details always available */}
                            <button
                              onClick={() => {
                                setSelectedAgentForAction(agent);
                                setShowViewProfileModal(true);
                              }}
                              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200/60 shadow-sm transition"
                            >
                              Details
                            </button>

                            {/* Approve candidate technician */}
                            {['pending', 'rejected', 'suspended'].includes(agent.registrationStatus) && (
                              <button
                                onClick={() => {
                                  setSelectedAgentForAction(agent);
                                  setApprovePasscode('');
                                  setShowApproveModal(true);
                                }}
                                className="px-3 py-1.5 bg-gradient-primary text-on-primary rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm hover:opacity-95 transition"
                              >
                                Approve
                              </button>
                            )}

                            {/* Reject candidate application */}
                            {agent.registrationStatus === 'pending' && (
                              <button
                                onClick={() => {
                                  setSelectedAgentForAction(agent);
                                  setRejectionReasonText('');
                                  setShowRejectModal(true);
                                }}
                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm transition"
                              >
                                Reject
                              </button>
                            )}

                            {/* Suspend active technician */}
                            {agent.registrationStatus === 'active' && (
                              <button
                                onClick={() => handleSuspendAgent(agent._id)}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm transition animate-pulse"
                              >
                                Suspend
                              </button>
                            )}

                            {/* Delete technician record */}
                            <button
                              onClick={() => handleDeleteAgent(agent._id)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-650 hover:border-red-200 border rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {agents.filter((a) => {
                    if (agentSubView === 'active') return a.registrationStatus === 'active';
                    if (agentSubView === 'pending') return a.registrationStatus === 'pending';
                    return ['rejected', 'suspended'].includes(a.registrationStatus);
                  }).length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 font-bold italic">
                        No specialists found in this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ======================================================== */}
            {/* 1. APPROVE TECHNICIAN PASSCODE ENTRY MODAL */}
            {/* ======================================================== */}
            {showApproveModal && selectedAgentForAction && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded bg-[#f3e2ac]/80 text-[#706439] font-black text-[9px] uppercase tracking-wider">
                        Security Vault Action
                      </span>
                      <h3 className="text-lg font-black text-primary tracking-tight mt-1.5">Approve Care Technician</h3>
                    </div>
                    <button 
                      onClick={() => setShowApproveModal(false)}
                      className="text-slate-400 hover:text-slate-650 text-sm focus:outline-none"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 leading-normal">
                    You are activating technician credentials for <strong className="font-bold text-slate-800">{selectedAgentForAction.firstName} {selectedAgentForAction.lastName}</strong>.
                    Please define a secure login passcode which will be securely bcrypt-hashed in our vault.
                  </p>

                  <form onSubmit={handleApproveAgentWithPasscode} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Configure Onboarding Passcode *</label>
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60">
                          <FiLock size={16} />
                        </span>
                        <input
                          type="text"
                          value={approvePasscode}
                          onChange={(e) => setApprovePasscode(e.target.value.replace(/\s/g, ''))}
                          required
                          minLength={6}
                          placeholder="Passcode (min 6 characters)"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-primary focus:bg-white transition-all font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-3 text-xs font-black uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => setShowApproveModal(false)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-655 rounded-lg shadow-inner"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-gradient-primary text-on-primary rounded-lg shadow-md hover:opacity-95"
                      >
                        ✅ Finalize Approval
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 2. REJECT TECHNICIAN MODAL */}
            {/* ======================================================== */}
            {showRejectModal && selectedAgentForAction && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 font-black text-[9px] uppercase tracking-wider">
                        Vetting Filter Board
                      </span>
                      <h3 className="text-lg font-black text-primary tracking-tight mt-1.5">Reject Technician Applicant</h3>
                    </div>
                    <button 
                      onClick={() => setShowRejectModal(false)}
                      className="text-slate-400 hover:text-slate-600 text-sm focus:outline-none"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 leading-normal">
                    Please provide a clear justification why the application submitted by <strong className="font-bold text-slate-800">{selectedAgentForAction.firstName} {selectedAgentForAction.lastName}</strong> is being rejected.
                  </p>

                  <form onSubmit={handleRejectAgentWithReason} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Rejection Reason *</label>
                      <textarea
                        value={rejectionReasonText}
                        onChange={(e) => setRejectionReasonText(e.target.value)}
                        required
                        rows={3}
                        placeholder="Candidate address credentials could not be verified / insufficient field experience parameters."
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary focus:bg-white transition-all leading-relaxed"
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-3 text-xs font-black uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => setShowRejectModal(false)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-655 rounded-lg shadow-inner"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-md"
                      >
                        🚫 Reject Request
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 3. VIEW PROFILE DETAILS OVERLAY MODAL */}
            {/* ======================================================== */}
            {showViewProfileModal && selectedAgentForAction && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      {selectedAgentForAction.profileImage ? (
                        <img src={selectedAgentForAction.profileImage} alt="" className="w-12 h-12 rounded-full object-cover border" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg uppercase">
                          {selectedAgentForAction.firstName?.[0]}{selectedAgentForAction.lastName?.[0]}
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-black text-slate-800 leading-tight">
                          {selectedAgentForAction.firstName} {selectedAgentForAction.lastName}
                        </h3>
                        <p className="text-[10px] text-primary font-mono tracking-wide mt-0.5">{selectedAgentForAction.agentId}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowViewProfileModal(false)}
                      className="text-slate-400 hover:text-slate-655 text-sm focus:outline-none"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Profile Cards */}
                  <div className="space-y-4 text-xs font-semibold">
                    {/* General Grid */}
                    <div className="grid grid-cols-2 gap-4 bg-[#faf9f6] p-4 rounded-2xl border border-slate-100 shadow-inner">
                      <div>
                        <p className="text-[9px] font-black text-[#753401]/60 uppercase tracking-widest">Mobile Number</p>
                        <p className="text-slate-700 font-mono mt-0.5">{selectedAgentForAction.phone}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-[#753401]/60 uppercase tracking-widest">Email Address</p>
                        <p className="text-slate-700 mt-0.5 truncate">{selectedAgentForAction.email}</p>
                      </div>
                    </div>

                    {/* Vetted KYC proofs */}
                    <div className="bg-[#faf9f6] p-4 rounded-2xl border border-slate-100 shadow-inner space-y-3">
                      <div className="flex items-center gap-1.5 pb-1.5 border-b border-[#753401]/5 text-[#753401]/80">
                        <FiShield size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Vetted Document Files</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Aadhaar Card Detail</p>
                          <p className="text-slate-700 font-mono mt-0.5 tracking-wider">
                            {selectedAgentForAction.documents?.aadhar ? `XXXX XXXX ${selectedAgentForAction.documents.aadhar.slice(-4)}` : 'Not verified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">PAN Card Detail</p>
                          <p className="text-slate-700 font-mono mt-0.5 uppercase font-black">
                            {selectedAgentForAction.documents?.panCard || 'Not verified'}
                          </p>
                        </div>
                      </div>
                      {selectedAgentForAction.licenseNumber && (
                        <div className="pt-2 border-t border-slate-200/40">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Driving License Number</p>
                          <p className="text-slate-700 font-mono mt-0.5">{selectedAgentForAction.licenseNumber}</p>
                        </div>
                      )}
                    </div>

                    {/* Permanent Address */}
                    <div className="bg-[#faf9f6] p-4 rounded-2xl border border-slate-100 shadow-inner space-y-2">
                      <div className="flex items-center gap-1.5 pb-1.5 border-b border-[#753401]/5 text-[#753401]/80">
                        <FiMapPin size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Permanent Address</span>
                      </div>
                      {selectedAgentForAction.address ? (
                        <div className="text-slate-650 leading-relaxed">
                          <p>{selectedAgentForAction.address.street}</p>
                          <p className="mt-0.5">{selectedAgentForAction.address.city}, {selectedAgentForAction.address.state} - <span className="font-mono font-bold">{selectedAgentForAction.address.pincode}</span></p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{selectedAgentForAction.address.country || 'India'}</p>
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">No address provided</p>
                      )}
                    </div>

                    {/* Audit Timestamps */}
                    <div className="text-[10px] text-slate-400 bg-slate-50 p-3.5 rounded-xl border flex flex-col gap-1">
                      <p>• Created and Applied: {new Date(selectedAgentForAction.createdAt).toLocaleString()}</p>
                      {selectedAgentForAction.isApproved && selectedAgentForAction.approvalDate && (
                        <p className="text-emerald-600 font-bold">• Approved Vetted Date: {new Date(selectedAgentForAction.approvalDate).toLocaleString()}</p>
                      )}
                      {selectedAgentForAction.registrationStatus === 'rejected' && (
                        <p className="text-amber-600 font-bold">• Rejection reason details: {selectedAgentForAction.rejectedReason}</p>
                      )}
                      {selectedAgentForAction.registrationStatus === 'suspended' && (
                        <p className="text-red-650 font-bold">• Account suspended, remote access terminated.</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end text-xs font-black uppercase tracking-wider border-t border-slate-100">
                    <button
                      onClick={() => setShowViewProfileModal(false)}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-655 rounded-xl shadow-sm"
                    >
                      Close Viewer
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 4. ONBOARD NEW AGENT DIRECT MODAL DIALOGUE */}
            {/* ======================================================== */}
            {showAddAgentModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#faf9f6] rounded-3xl border border-slate-200 p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex justify-between items-start border-b border-[#753401]/10 pb-4">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded bg-primary/10 text-primary font-black text-[9px] uppercase tracking-wider">
                        Workforce Control
                      </span>
                      <h3 className="text-xl font-black text-primary tracking-tight mt-1.5">Direct Specialist Onboarding</h3>
                    </div>
                    <button 
                      onClick={() => setShowAddAgentModal(false)}
                      className="text-slate-400 hover:text-slate-600 text-lg focus:outline-none"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleCreateAgent} className="space-y-6">
                    {/* circular image slot */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-secondary uppercase tracking-wider pl-1 flex items-center gap-1">
                        <FiCamera size={14} className="text-primary" /> Profile Photo *
                      </label>

                      <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative overflow-hidden cursor-pointer border-2 border-dashed rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5 transition-all duration-300 bg-white ${
                          isDragging 
                            ? 'border-primary bg-primary/5 scale-[1.01]' 
                            : 'border-[#753401]/15 hover:border-primary hover:shadow-sm'
                        }`}
                      >
                        <input 
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                        />

                        <div className="relative w-16 h-16 rounded-full flex-shrink-0 border-4 border-slate-100 shadow-md bg-slate-50 flex items-center justify-center overflow-hidden">
                          {filePreviewUrl || agentForm.profileImage ? (
                            <img src={filePreviewUrl || agentForm.profileImage} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <FiUploadCloud size={20} className="text-slate-400" />
                          )}
                          {isUploading && (
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 text-center sm:text-left space-y-1 w-full text-xs font-semibold">
                          <h5 className="font-bold text-xs text-slate-800">Upload Technician Avatar</h5>
                          <p className="text-[11px] text-slate-500">Drag/drop file here or click to browse.</p>
                          <p className="text-[9px] text-slate-400">Max size 5MB. Progressives are auto-square compressed.</p>

                          {isUploading && (
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2 shadow-inner">
                              <motion.div 
                                className="h-full bg-gradient-primary rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress}%` }}
                                transition={{ duration: 0.1 }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* form rows */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-wider pl-1">First Name *</label>
                        <input
                          type="text"
                          name="firstName"
                          value={agentForm.firstName}
                          onChange={handleAgentFormChange}
                          required
                          placeholder="First name"
                          className="w-full px-4 py-3 border border-[#753401]/10 rounded-xl bg-white focus:outline-none focus:border-primary text-xs font-semibold shadow-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-wider pl-1">Last Name *</label>
                        <input
                          type="text"
                          name="lastName"
                          value={agentForm.lastName}
                          onChange={handleAgentFormChange}
                          required
                          placeholder="Last name"
                          className="w-full px-4 py-3 border border-[#753401]/10 rounded-xl bg-white focus:outline-none focus:border-primary text-xs font-semibold shadow-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-wider pl-1">Contact Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={agentForm.email}
                          onChange={handleAgentFormChange}
                          required
                          placeholder="specialist@residence.com"
                          className="w-full px-4 py-3 border border-[#753401]/10 rounded-xl bg-white focus:outline-none focus:border-primary text-xs font-semibold shadow-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-wider pl-1">Contact Phone *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={agentForm.phone}
                          onChange={handleAgentFormChange}
                          required
                          placeholder="10-digit number"
                          className="w-full px-4 py-3 border border-[#753401]/10 rounded-xl bg-white focus:outline-none focus:border-primary text-xs font-semibold shadow-sm font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-wider pl-1">Configure Passcode *</label>
                        <input
                          type="text"
                          name="passcode"
                          value={agentForm.passcode}
                          onChange={handleAgentFormChange}
                          required
                          minLength={6}
                          placeholder="Passcode (min 6 characters)"
                          className="w-full px-4 py-3 border border-[#753401]/10 rounded-xl bg-white focus:outline-none focus:border-primary text-xs font-semibold shadow-sm font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-wider pl-1">Agent ID (Read-only)</label>
                        <input
                          type="text"
                          disabled
                          placeholder="Auto-generated by Security Vault"
                          className="w-full px-4 py-3 border rounded-xl bg-slate-100 text-slate-400 text-xs font-bold shadow-inner cursor-not-allowed italic"
                        />
                      </div>
                    </div>

                    {/* Vetted KYC proofs */}
                    <div className="bg-white border border-[#753401]/10 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-1.5 pb-2 border-b border-[#753401]/5 text-primary">
                        <FiFileText size={16} />
                        <span className="text-[11px] font-black uppercase tracking-wider">KYC Document Vetting</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-[#753401]/60 uppercase tracking-wider pl-1">Aadhaar Number *</label>
                          <input
                            type="text"
                            value={aadhaarInput}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
                              const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
                              setAadhaarInput(formatted);
                              setAgentForm(prev => ({ ...prev, aadharNumber: formatted }));
                            }}
                            required
                            placeholder="XXXX XXXX XXXX"
                            className="w-full px-4 py-3 border border-[#753401]/10 rounded-xl bg-white focus:outline-none focus:border-primary text-xs font-bold shadow-sm font-mono tracking-wider"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-[#753401]/60 uppercase tracking-wider pl-1">PAN Number *</label>
                          <input
                            type="text"
                            value={panInput}
                            onChange={(e) => {
                              const clean = e.target.value.toUpperCase().trim().slice(0, 10);
                              setPanInput(clean);
                              setAgentForm(prev => ({ ...prev, panNumber: clean }));
                            }}
                            required
                            placeholder="ABCDE1234F"
                            className="w-full px-4 py-3 border border-[#753401]/10 rounded-xl bg-white focus:outline-none focus:border-primary text-xs font-black shadow-sm font-mono tracking-widest uppercase"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#753401]/60 uppercase tracking-wider pl-1">Driving License (Optional)</label>
                        <input
                          type="text"
                          name="licenseNumber"
                          value={agentForm.licenseNumber || ''}
                          onChange={handleAgentFormChange}
                          placeholder="DL-XXXXXXXXXXXXX"
                          className="w-full px-4 py-3 border border-[#753401]/10 rounded-xl bg-white focus:outline-none focus:border-primary text-xs font-semibold shadow-sm font-mono"
                        />
                      </div>
                    </div>

                    {/* Address Block */}
                    <div className="space-y-3 bg-white border border-[#753401]/10 rounded-2xl p-5">
                      <div className="flex items-center gap-1.5 pb-2 border-b border-[#753401]/5 text-primary">
                        <FiMapPin size={16} />
                        <span className="text-[11px] font-black uppercase tracking-wider font-semibold">Specialist Permanent Address</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#753401]/60 uppercase pl-1">Street Address</label>
                        <input
                          type="text"
                          name="street"
                          value={agentForm.address?.street || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAgentForm(prev => ({
                              ...prev,
                              address: { ...(prev.address || {}), street: val }
                            }));
                          }}
                          required
                          placeholder="Flat/House No., Building Name, Street Area"
                          className="w-full px-4 py-3 border border-[#753401]/10 rounded-xl bg-white focus:outline-none focus:border-primary text-xs font-semibold shadow-sm"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-[#753401]/60 uppercase pl-1">City</label>
                          <input
                            type="text"
                            name="city"
                            value={agentForm.address?.city || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAgentForm(prev => ({
                                ...prev,
                                address: { ...(prev.address || {}), city: val }
                              }));
                            }}
                            required
                            placeholder="Bangalore"
                            className="w-full px-4 py-3 border border-[#753401]/10 rounded-xl bg-white focus:outline-none focus:border-primary text-xs font-semibold shadow-sm"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-[#753401]/60 uppercase pl-1">State</label>
                          <input
                            type="text"
                            name="state"
                            value={agentForm.address?.state || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAgentForm(prev => ({
                                ...prev,
                                address: { ...(prev.address || {}), state: val }
                              }));
                            }}
                            required
                            placeholder="Karnataka"
                            className="w-full px-4 py-3 border border-[#753401]/10 rounded-xl bg-white focus:outline-none focus:border-primary text-xs font-semibold shadow-sm"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-[#753401]/60 uppercase pl-1">Pincode</label>
                          <input
                            type="text"
                            name="pincode"
                            value={agentForm.address?.pincode || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setAgentForm(prev => ({
                                ...prev,
                                address: { ...(prev.address || {}), pincode: val }
                              }));
                            }}
                            required
                            placeholder="560064"
                            className="w-full px-4 py-3 border border-[#753401]/10 rounded-xl bg-white focus:outline-none focus:border-primary text-xs font-bold shadow-sm font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* buttons */}
                    <div className="pt-2 flex justify-end gap-3 text-xs font-black uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => setShowAddAgentModal(false)}
                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-655 rounded-xl shadow-inner cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-3.5 bg-gradient-primary text-on-primary rounded-xl shadow-md hover:opacity-95 cursor-pointer"
                      >
                        ✅ Register Specialist
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </div>
          )}

          {/* Recent Bookings */}
          {currentView === 'bookings' && (
          <div className="glass rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Booking Queue</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold">Booking ID</th>
                    <th className="text-left py-3 px-4 font-semibold">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold">Service Type</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Agent</th>
                    <th className="text-left py-3 px-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{booking.bookingId}</td>
                      <td className="py-3 px-4">{booking.customer?.firstName}</td>
                      <td className="py-3 px-4 capitalize">{booking.serviceType.replace(/_/g, ' ')}</td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {booking.assignedAgent ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-green-700 text-sm">
                              {booking.assignedAgent?.firstName} {booking.assignedAgent?.lastName}
                            </span>
                            <span className="text-[10px] text-gray-500 font-medium">({booking.assignedAgent?.agentId})</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 italic text-sm">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {!['completed', 'cancelled'].includes(booking.status) && (
                          <div className="flex items-center gap-2">
                            {booking.assignedAgent ? (
                              <>
                                <button
                                  onClick={() => setSelectedBookingForAssign(booking)}
                                  className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 transition shadow-sm"
                                >
                                  Reassign
                                </button>
                                <button
                                  onClick={() => handleUnassignAgent(booking._id)}
                                  className="px-3 py-1.5 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg text-xs font-semibold shadow-sm transition"
                                >
                                  Unassign
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setSelectedBookingForAssign(booking)}
                                className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 transition shadow-sm"
                              >
                                Assign Agent
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* Assign Agent Modal */}
          {selectedBookingForAssign && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl"
              >
                <h3 className="text-2xl font-bold mb-4">Assign Agent</h3>
                <p className="text-gray-600 mb-4">
                  Booking ID: <span className="font-semibold">{selectedBookingForAssign.bookingId}</span>
                </p>
                <p className="text-gray-600 mb-6">
                  Customer: <span className="font-semibold">{selectedBookingForAssign.customer?.firstName}</span>
                </p>

                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2">Select Agent</label>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Choose Agent --</option>
                    {agents
                      .filter((agent) => agent.isActive)
                      .map((agent) => (
                        <option key={agent._id} value={agent._id}>
                          {agent.firstName} {agent.lastName} ({agent.agentId})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedBookingForAssign(null);
                      setSelectedAgentId('');
                    }}
                    disabled={isAssigning}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignAgent}
                    disabled={isAssigning || !selectedAgentId}
                    className="flex-1 px-4 py-3 bg-primary text-on-primary rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAssigning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-on-primary" />
                        Assigning...
                      </>
                    ) : (
                      'Assign Agent'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {currentView === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass rounded-lg p-8">
                <p className="text-gray-600 text-sm mb-2">Completion Rate</p>
                <p className="text-4xl font-bold text-primary">{completedRate}%</p>
              </div>
              <div className="glass rounded-lg p-8">
                <p className="text-gray-600 text-sm mb-2">Pending Bookings</p>
                <p className="text-4xl font-bold text-primary">{pendingBookings}</p>
              </div>
              <div className="glass rounded-lg p-8">
                <p className="text-gray-600 text-sm mb-2">Active Agents</p>
                <p className="text-4xl font-bold text-primary">{stats?.activeAgents || 0}</p>
              </div>
            </div>

            <div className="glass rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Service Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 text-sm mb-2">Total Platform Bookings</p>
                  <div className="h-3 rounded-full bg-primary/10 overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.min(100, stats?.totalBookings || 0)}%` }} />
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-2">Completed Services</p>
                  <div className="h-3 rounded-full bg-primary/10 overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${completedRate}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
