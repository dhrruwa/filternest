import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { adminService } from '../services/services';
import toast from 'react-hot-toast';
import SecurityDashboard from '../components/SecurityDashboard';
import {
  FiUsers, FiMapPin, FiCheckCircle, FiClock, FiLock, FiCreditCard, FiShield,
  FiUserCheck, FiAlertCircle, FiRefreshCw, FiCheck, FiInfo, FiFileText,
  FiCamera, FiUpload, FiImage, FiTrash2, FiUser, FiMail, FiGrid,
  FiCalendar, FiDollarSign, FiMessageSquare, FiSend, FiChevronLeft,
  FiChevronRight, FiSearch, FiFilter, FiX, FiArrowUp, FiArrowDown,
  FiActivity, FiZap, FiBell, FiTrendingUp, FiBarChart2, FiPieChart,
  FiSliders, FiMoreVertical, FiEye, FiEdit, FiTrash, FiDownload,
  FiUploadCloud
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';

/* ──────────────────────────────────────────────────────────────
   SIDEBAR TABS CONFIGURATION
   ────────────────────────────────────────────────────────────── */
const SIDEBAR_TABS = [
  { id: 'overview',   label: 'Overview',    icon: FiGrid,          shortLabel: 'Home' },
  { id: 'customers',  label: 'Customers',   icon: FiUsers,         shortLabel: 'CRM' },
  { id: 'workforce',  label: 'Workforce',   icon: FiUserCheck,     shortLabel: 'Team' },
  { id: 'bookings',   label: 'Bookings',    icon: FiCalendar,      shortLabel: 'Ops' },
  { id: 'finance',    label: 'Finance',     icon: FaRupeeSign,     shortLabel: 'Pay' },
  { id: 'helpdesk',   label: 'Helpdesk',    icon: FiMessageSquare, shortLabel: 'Help' },
  { id: 'broadcast',  label: 'Broadcaster', icon: FiBell,          shortLabel: 'Cast' },
];

/* ──────────────────────────────────────────────────────────────
   MINI SVG CHART COMPONENTS
   ────────────────────────────────────────────────────────────── */

const MiniBarChart = ({ data, width = 280, height = 120 }) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barW = Math.floor((width - (data.length - 1) * 4) / data.length);
  return (
    <svg width={width} height={height + 20} className="overflow-visible">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b4513" />
          <stop offset="100%" stopColor="#d4af37" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const barH = (d.value / maxVal) * height;
        const x = i * (barW + 4);
        const y = height - barH;
        return (
          <g key={i}>
            <motion.rect
              x={x} width={barW} rx={3}
              fill="url(#barGrad)" opacity={0.85}
              initial={{ y: height, height: 0 }}
              animate={{ y, height: barH }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
            />
            <text x={x + barW / 2} y={height + 14} textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="700">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

const MiniDonutChart = ({ segments, size = 120 }) => {
  const r = (size - 20) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cumAngle = -90;

  return (
    <svg width={size} height={size} className="overflow-visible">
      {segments.map((seg, i) => {
        const angle = (seg.value / total) * 360;
        const startRad = (cumAngle * Math.PI) / 180;
        const endRad = ((cumAngle + angle) * Math.PI) / 180;
        const largeArc = angle > 180 ? 1 : 0;
        const x1 = cx + r * Math.cos(startRad);
        const y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad);
        const y2 = cy + r * Math.sin(endRad);
        cumAngle += angle;
        return (
          <motion.path
            key={i}
            d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={seg.color}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.85, scale: 1 }}
            transition={{ delay: i * 0.12, duration: 0.4 }}
            className="hover:opacity-100 transition-opacity cursor-pointer"
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="#faf9f6" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="14" fontWeight="900" fill="#1e293b">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7" fontWeight="800" fill="#94a3b8" textTransform="uppercase">TOTAL</text>
    </svg>
  );
};

const MiniLineChart = ({ data, width = 280, height = 80 }) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const points = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * width;
    const y = height - (d.value / maxVal) * height;
    return `${x},${y}`;
  }).join(' ');
  const areaPath = `M 0,${height} L ${points} L ${width},${height} Z`;

  return (
    <svg width={width} height={height + 20} className="overflow-visible">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b4513" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8b4513" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <motion.path d={areaPath} fill="url(#lineGrad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
      <motion.polyline
        points={points}
        fill="none" stroke="#8b4513" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: 'easeOut' }}
      />
      {data.map((d, i) => {
        const x = (i / Math.max(data.length - 1, 1)) * width;
        const y = height - (d.value / maxVal) * height;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="3" fill="#8b4513" stroke="#faf9f6" strokeWidth="2" />
            <text x={x} y={height + 14} textAnchor="middle" fontSize="7" fill="#94a3b8" fontWeight="700">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

/* ──────────────────────────────────────────────────────────────
   MAIN ADMIN DASHBOARD COMPONENT
   ────────────────────────────────────────────────────────────── */

const AdminDashboard = () => {
  // ──── Sidebar State ────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // ──── Core Data ────
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [agents, setAgents] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ──── Agent Assignment ────
  const [selectedBookingForAssign, setSelectedBookingForAssign] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // ──── Agent Onboarding Form ────
  const [agentForm, setAgentForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    agentId: '', passcode: '', profileImage: '', aadharNumber: '', panNumber: '',
  });

  // ──── Workforce Sub-Tabs & Modals ────
  const [agentSubView, setAgentSubView] = useState('active');
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showViewProfileModal, setShowViewProfileModal] = useState(false);
  const [selectedAgentForAction, setSelectedAgentForAction] = useState(null);
  const [approvePasscode, setApprovePasscode] = useState('');
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  // ──── KYC Verification states ────
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [panInput, setPanInput] = useState('');

  // ──── Profile Picture Upload ────
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // ──── Email Verification ────
  const [emailInput, setEmailInput] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const pollingIntervalRef = useRef(null);

  // ──── Customer Management ────
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerPage, setCustomerPage] = useState(1);

  // ──── Finance ────
  const [financeFilter, setFinanceFilter] = useState('all');

  // ──── Helpdesk ────
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // ──── Broadcaster ────
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', audience: 'all' });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  /* ──── DATA FETCH ──── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, bookingsRes, agentsRes, customersRes] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getAllBookings(1, 50),
          adminService.getAllAgents(1, 50),
          adminService.getAllCustomers(1, 50),
        ]);
        setStats(statsRes.data);
        setBookings(bookingsRes.data.bookings);
        setAgents(agentsRes.data.agents);
        setCustomers(customersRes.data.customers);
      } catch (error) {
        toast.error('Failed to load admin dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch payments when finance tab is activated
  useEffect(() => {
    if (activeTab === 'finance' && payments.length === 0) {
      adminService.getAllPayments(1, 50, financeFilter).then(res => setPayments(res.data.payments || [])).catch(() => {});
    }
  }, [activeTab]);

  // Fetch complaints when helpdesk tab is activated
  useEffect(() => {
    if (activeTab === 'helpdesk' && complaints.length === 0) {
      adminService.getAllComplaints(1, 50).then(res => setComplaints(res.data.tickets || [])).catch(() => {});
    }
  }, [activeTab]);

  useEffect(() => {
    return () => { if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); };
  }, []);

  /* ──── COMPUTED VALUES ──── */
  const completedRate = stats?.totalBookings ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0;

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const s = customerSearch.toLowerCase();
    return customers.filter(c =>
      c.firstName?.toLowerCase().includes(s) ||
      c.lastName?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s) ||
      c.phone?.includes(s)
    );
  }, [customers, customerSearch]);

  /* ──── CHART DATA ──── */
  const bookingsByServiceType = useMemo(() => {
    const counts = {};
    bookings.forEach(b => { counts[b.serviceType] = (counts[b.serviceType] || 0) + 1; });
    return Object.entries(counts).map(([key, value]) => ({
      label: key.replace(/_/g, ' ').slice(0, 8),
      value,
    }));
  }, [bookings]);

  const bookingStatusSegments = useMemo(() => {
    const pending = bookings.filter(b => b.status === 'pending').length;
    const active = bookings.filter(b => ['confirmed', 'in_progress', 'agent_assigned', 'on_the_way'].includes(b.status)).length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    return [
      { label: 'Pending', value: pending, color: '#f59e0b' },
      { label: 'Active', value: active, color: '#3b82f6' },
      { label: 'Completed', value: completed, color: '#10b981' },
      { label: 'Cancelled', value: cancelled, color: '#ef4444' },
    ];
  }, [bookings]);

  const customerTrend = useMemo(() => {
    if (!customers || customers.length === 0) return { trend: '+0%', up: true };
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thisWeek = customers.filter(c => new Date(c.createdAt) >= sevenDaysAgo).length;
    const lastWeek = customers.filter(c => {
      const d = new Date(c.createdAt);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    }).length;
    if (lastWeek === 0) {
      return { trend: thisWeek > 0 ? `+${thisWeek * 100}%` : '+0%', up: true };
    }
    const pct = ((thisWeek - lastWeek) / lastWeek) * 100;
    return { trend: pct >= 0 ? `+${Math.round(pct)}%` : `${Math.round(pct)}%`, up: pct >= 0 };
  }, [customers]);

  const agentTrend = useMemo(() => {
    if (!agents || agents.length === 0) return { trend: '+0%', up: true };
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thisWeek = agents.filter(a => new Date(a.createdAt) >= sevenDaysAgo).length;
    const lastWeek = agents.filter(a => {
      const d = new Date(a.createdAt);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    }).length;
    if (lastWeek === 0) {
      return { trend: thisWeek > 0 ? `+${thisWeek * 100}%` : '+0%', up: true };
    }
    const pct = ((thisWeek - lastWeek) / lastWeek) * 100;
    return { trend: pct >= 0 ? `+${Math.round(pct)}%` : `${Math.round(pct)}%`, up: pct >= 0 };
  }, [agents]);

  const bookingTrend = useMemo(() => {
    if (!bookings || bookings.length === 0) return { trend: '+0%', up: true };
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thisWeek = bookings.filter(b => new Date(b.bookingDate || b.createdAt) >= sevenDaysAgo).length;
    const lastWeek = bookings.filter(b => {
      const d = new Date(b.bookingDate || b.createdAt);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    }).length;
    if (lastWeek === 0) {
      return { trend: thisWeek > 0 ? `+${thisWeek * 100}%` : '+0%', up: true };
    }
    const pct = ((thisWeek - lastWeek) / lastWeek) * 100;
    return { trend: pct >= 0 ? `+${Math.round(pct)}%` : `${Math.round(pct)}%`, up: pct >= 0 };
  }, [bookings]);

  const weeklyTrend = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    
    bookings.forEach(b => {
      if (b.bookingDate) {
        const date = new Date(b.bookingDate);
        const dayName = days[date.getDay()];
        if (counts[dayName] !== undefined) {
          counts[dayName]++;
        }
      }
    });

    const displayDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return displayDays.map(d => ({
      label: d,
      value: counts[d] || 0
    }));
  }, [bookings]);

  /* ──── HANDLER FUNCTIONS ──── */
  const handleApproveAgentWithPasscode = async (e) => {
    e.preventDefault();
    if (!approvePasscode || approvePasscode.length < 6) { toast.error('Passcode must be at least 6 characters'); return; }
    try {
      const response = await adminService.approveAgent(selectedAgentForAction._id, approvePasscode);
      setAgents(curr => curr.map(a => a._id === selectedAgentForAction._id ? response.data.agent : a));
      toast.success('Technician approved successfully');
      setShowApproveModal(false); setSelectedAgentForAction(null); setApprovePasscode('');
    } catch (error) { toast.error(error.response?.data?.error || 'Could not approve agent'); }
  };

  const handleRejectAgentWithReason = async (e) => {
    e.preventDefault();
    if (!rejectionReasonText.trim()) { toast.error('Please enter a rejection reason'); return; }
    try {
      const response = await adminService.rejectAgent(selectedAgentForAction._id, rejectionReasonText);
      setAgents(curr => curr.map(a => a._id === selectedAgentForAction._id ? response.data.agent : a));
      toast.success('Technician rejected successfully');
      setShowRejectModal(false); setSelectedAgentForAction(null); setRejectionReasonText('');
    } catch (error) { toast.error(error.response?.data?.error || 'Could not reject agent'); }
  };

  const handleSuspendAgent = async (agentId) => {
    if (!window.confirm('Suspend this technician? This will terminate their active sessions.')) return;
    try {
      const response = await adminService.suspendAgent(agentId);
      setAgents(curr => curr.map(a => a._id === agentId ? response.data.agent : a));
      toast.success('Technician suspended');
    } catch (error) { toast.error(error.response?.data?.error || 'Could not suspend agent'); }
  };

  const handleDeleteAgent = async (agentId) => {
    if (!window.confirm('Delete this agent? This is irreversible.')) return;
    try {
      await adminService.deleteAgent(agentId);
      setAgents(curr => curr.filter(a => a._id !== agentId));
      toast.success('Agent deleted');
    } catch (error) { toast.error(error.response?.data?.error || 'Could not delete agent'); }
  };

  const handleUnassignAgent = async (bookingId) => {
    try {
      await adminService.unassignAgent(bookingId);
      setBookings(curr => curr.map(b => b._id === bookingId ? { ...b, assignedAgent: null, status: 'pending' } : b));
      toast.success('Agent unassigned');
    } catch (error) { toast.error(error.response?.data?.error || 'Could not unassign agent'); }
  };

  const handleAssignAgent = async () => {
    if (!selectedBookingForAssign || !selectedAgentId) { toast.error('Select both booking and agent'); return; }
    setIsAssigning(true);
    try {
      await adminService.assignAgent(selectedBookingForAssign._id, selectedAgentId);
      setBookings(curr => curr.map(b =>
        b._id === selectedBookingForAssign._id
          ? { ...b, assignedAgent: agents.find(a => a._id === selectedAgentId) }
          : b
      ));
      toast.success('Agent assigned'); setSelectedBookingForAssign(null); setSelectedAgentId('');
    } catch (error) { toast.error(error.response?.data?.error || 'Could not assign agent'); }
    finally { setIsAssigning(false); }
  };

  const handleAgentFormChange = (event) => {
    const { name, value } = event.target;
    if (name === 'phone') { setAgentForm(f => ({ ...f, [name]: value.replace(/\D/g, '').slice(0, 10) })); return; }
    setAgentForm(f => ({ ...f, [name]: value }));
  };

  const processSelectedFile = async (file) => {
    setUploadError('');
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { setUploadError('Invalid file type'); toast.error('Unsupported format'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError('File too large (max 5MB)'); toast.error('File exceeds 5MB'); return; }
    setSelectedFile(file); setFilePreviewUrl(URL.createObjectURL(file));
    setIsUploading(true); setUploadProgress(10);
    const formData = new FormData(); formData.append('avatar', file);
    try {
      const progressTimer = setInterval(() => { setUploadProgress(p => p >= 90 ? (clearInterval(progressTimer), 90) : p + 15); }, 100);
      const response = await adminService.uploadAvatar(formData);
      clearInterval(progressTimer); setUploadProgress(100);
      setTimeout(() => { setIsUploading(false); setAgentForm(f => ({ ...f, profileImage: response.data.avatarUrl })); toast.success('Avatar uploaded!'); }, 300);
    } catch (error) { setIsUploading(false); setUploadError('Upload failed'); toast.error('Upload failed'); }
  };

  const handleCreateAgent = async (event) => {
    event.preventDefault();
    try {
      const response = await adminService.createAgent(agentForm);
      setAgents(curr => [response.data.agent, ...curr]);
      setAgentForm({ firstName: '', lastName: '', email: '', phone: '', agentId: '', passcode: '', profileImage: '', aadharNumber: '', panNumber: '' });
      setEmailInput(''); setEmailVerified(false); setSelectedFile(null); setFilePreviewUrl(''); setUploadProgress(0); setAadhaarInput(''); setPanInput('');
      toast.success(`Agent created! ID: ${response.data.login.agentId}`);
      setShowAddAgentModal(false);
    } catch (error) { toast.error(error.response?.data?.error || 'Could not create agent'); }
  };

  // ── Finance handlers ──
  const handleRefund = async (paymentId) => {
    if (!window.confirm('Process refund for this payment?')) return;
    try {
      const res = await adminService.processRefund(paymentId);
      setPayments(curr => curr.map(p => p._id === paymentId ? res.data.payment : p));
      toast.success('Refund processed');
    } catch (error) { toast.error(error.response?.data?.error || 'Refund failed'); }
  };

  // ── Helpdesk handlers ──
  const handleSendReply = async () => {
    if (!replyText.trim() || !activeTicket) return;
    setIsSendingReply(true);
    try {
      const res = await adminService.replyToComplaint(activeTicket._id, replyText.trim());
      setComplaints(curr => curr.map(t => t._id === activeTicket._id ? res.data.ticket : t));
      setActiveTicket(res.data.ticket);
      setReplyText('');
      toast.success('Reply sent');
    } catch (error) { toast.error('Failed to send reply'); }
    finally { setIsSendingReply(false); }
  };

  const handleCloseTicket = async (ticketId) => {
    try {
      const res = await adminService.updateComplaintStatus(ticketId, 'closed');
      setComplaints(curr => curr.map(t => t._id === ticketId ? res.data.ticket : t));
      if (activeTicket?._id === ticketId) setActiveTicket(res.data.ticket);
      toast.success('Ticket closed');
    } catch (error) { toast.error('Failed to close ticket'); }
  };

  // ── Customer handlers ──
  const handleSuspendCustomer = async (customerId) => {
    if (!window.confirm('Toggle suspension for this customer?')) return;
    try {
      const res = await adminService.suspendCustomer(customerId);
      setCustomers(curr => curr.map(c => c._id === customerId ? res.data.customer : c));
      toast.success(res.data.message);
    } catch (error) { toast.error('Failed to update customer'); }
  };

  // ── Broadcast handlers ──
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) { toast.error('Title and message required'); return; }
    setIsBroadcasting(true);
    try {
      const res = await adminService.broadcastNotification(broadcastForm);
      toast.success(res.data.message);
      setBroadcastForm({ title: '', message: '', audience: 'all' });
    } catch (error) { toast.error('Broadcast failed'); }
    finally { setIsBroadcasting(false); }
  };

  /* ──── LOADING STATE ──── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f6]">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#8b4513] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-black uppercase tracking-widest text-[#8b4513]/60">Initializing Control Center</p>
          </div>
        </div>
      </div>
    );
  }

  /* ────────────────────────────────────────────────────
     RENDER
     ──────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#faf9f6] w-full">
      <Navbar />

      <div className="flex w-full" style={{ minHeight: 'calc(100vh - 80px)' }}>

        {/* ═══════════════════════════════════════════
            COLLAPSIBLE SIDEBAR
            ═══════════════════════════════════════════ */}
        <motion.aside
          animate={{ width: sidebarCollapsed ? 72 : 260 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="sticky top-[80px] h-[calc(100vh-80px)] bg-white/60 backdrop-blur-2xl border-r border-[#8b4513]/8 flex flex-col z-30 overflow-hidden"
          style={{ flexShrink: 0 }}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-[#8b4513]/8 flex items-center justify-between min-h-[60px]">
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-0 leading-none">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8b4513]/50 leading-none">FilterNest</span>
                  <span className="text-sm font-black text-[#6c2f00] tracking-tight leading-none">Control Center</span>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-8 h-8 rounded-lg bg-[#faf9f6] border border-[#8b4513]/10 flex items-center justify-center text-[#8b4513] hover:bg-[#8b4513]/10 transition-all"
            >
              {sidebarCollapsed ? <FiChevronRight size={14} /> : <FiChevronLeft size={14} />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
            {SIDEBAR_TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-[#8b4513]/15 to-[#d4af37]/10 text-[#6c2f00] shadow-sm border border-[#8b4513]/15'
                      : 'text-slate-500 hover:bg-[#faf9f6] hover:text-[#6c2f00]'
                  }`}
                  title={sidebarCollapsed ? tab.label : ''}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-all ${
                    isActive ? 'bg-[#8b4513] text-white shadow-md' : 'bg-transparent text-inherit group-hover:bg-[#8b4513]/5'
                  }`}>
                    <Icon size={16} />
                  </div>
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        className="text-xs font-bold tracking-wide whitespace-nowrap"
                      >
                        {tab.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && (
                    <motion.div layoutId="sidebar-indicator" className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#8b4513] rounded-l-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-[#8b4513]/8">
            <div className={`flex items-center gap-2 px-2 py-2 rounded-xl bg-[#faf9f6] border border-[#8b4513]/8 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8b4513] to-[#d4af37] flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                A
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-700 truncate">Admin Panel</p>
                  <p className="text-[8px] text-emerald-600 font-black uppercase">● Online</p>
                </div>
              )}
            </div>
          </div>
        </motion.aside>

        {/* ═══════════════════════════════════════════
            MAIN CONTENT AREA
            ═══════════════════════════════════════════ */}
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8 lg:py-8 overflow-x-hidden w-full">

          {/* Page Header */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#8b4513]/50 bg-[#8b4513]/5 px-2.5 py-1 rounded-md">
                {SIDEBAR_TABS.find(t => t.id === activeTab)?.label || 'Dashboard'}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">
              {activeTab === 'overview' && 'Operations Overview'}
              {activeTab === 'customers' && 'Customer Management'}
              {activeTab === 'workforce' && 'Workforce Control Deck'}
              {activeTab === 'bookings' && 'Booking Operations'}
              {activeTab === 'finance' && 'Finance Center'}
              {activeTab === 'helpdesk' && 'Support Escalations'}
              {activeTab === 'broadcast' && 'Platform Broadcaster'}
            </h1>
          </motion.div>

          {/* ═══════════ TAB: OVERVIEW ═══════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Customers', value: stats?.totalCustomers || 0, icon: FiUsers, trend: customerTrend.trend, trendUp: customerTrend.up, color: 'from-blue-500/10 to-blue-600/5' },
                  { label: 'Active Agents', value: stats?.activeAgents || 0, icon: FiUserCheck, trend: agentTrend.trend, trendUp: agentTrend.up, color: 'from-emerald-500/10 to-emerald-600/5' },
                  { label: 'Total Bookings', value: stats?.totalBookings || 0, icon: FiCalendar, trend: bookingTrend.trend, trendUp: bookingTrend.up, color: 'from-amber-500/10 to-amber-600/5' },
                  { label: 'Completed', value: stats?.completedBookings || 0, icon: FiCheckCircle, trend: `${completedRate}%`, trendUp: completedRate > 50, color: 'from-purple-500/10 to-purple-600/5' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(139,69,19,0.08)' }}
                    className="bg-white rounded-2xl border border-slate-200/60 p-5 relative overflow-hidden group cursor-default"
                  >
                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${stat.color} blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />
                    <div className="relative flex justify-between items-start">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">{stat.label}</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tight">{stat.value}</p>
                        <span className={`text-[10px] font-bold mt-1 inline-flex items-center gap-0.5 ${stat.trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                          {stat.trendUp ? <FiArrowUp size={10} /> : <FiArrowDown size={10} />} {stat.trend}
                        </span>
                      </div>
                      <div className="p-2.5 bg-[#faf9f6] rounded-xl border border-slate-100 text-[#8b4513] group-hover:scale-110 transition-transform">
                        <stat.icon size={20} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly Trend Line Chart */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl border border-slate-200/60 p-5 lg:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8b4513]">Weekly Booking Trend</p>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">Service requests this week</p>
                    </div>
                    <FiTrendingUp size={16} className="text-[#8b4513]/40" />
                  </div>
                  <MiniLineChart data={weeklyTrend} width={520} height={100} />
                </motion.div>

                {/* Status Donut */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                  className="bg-white rounded-2xl border border-slate-200/60 p-5">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8b4513] mb-4">Booking Status</p>
                  <div className="flex justify-center">
                    <MiniDonutChart segments={bookingStatusSegments} size={130} />
                  </div>
                  <div className="flex flex-wrap gap-3 mt-4 justify-center">
                    {bookingStatusSegments.map((s, i) => (
                      <span key={i} className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} /> {s.label} ({s.value})
                      </span>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Second Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Service Type Bar Chart */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="bg-white rounded-2xl border border-slate-200/60 p-5">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8b4513] mb-4">Service Category Distribution</p>
                  {bookingsByServiceType.length > 0 ? (
                    <MiniBarChart data={bookingsByServiceType} />
                  ) : (
                    <p className="text-xs text-slate-400 italic py-8 text-center">No booking data available</p>
                  )}
                </motion.div>

                {/* Completion Gauge */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                  className="bg-white rounded-2xl border border-slate-200/60 p-5">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8b4513] mb-4">Service Completion Rate</p>
                  <div className="flex items-center justify-center gap-8">
                    <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="46" stroke="#efeeeb" strokeWidth="8" fill="transparent" />
                        <motion.circle
                          cx="56" cy="56" r="46" stroke="url(#overviewGaugeGrad)" strokeWidth="8" fill="transparent"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 46}
                          initial={{ strokeDashoffset: 2 * Math.PI * 46 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 46 * (1 - completedRate / 100) }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                        />
                        <defs>
                          <linearGradient id="overviewGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#753401" />
                            <stop offset="100%" stopColor="#d4af37" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-slate-800 font-mono">{completedRate}%</span>
                        <span className="text-[7px] font-black tracking-widest text-slate-400 uppercase">RATE</span>
                      </div>
                    </div>
                    <div className="space-y-3 text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> <span className="text-slate-500">Pending: {bookings.filter(b => b.status === 'pending').length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" /> <span className="text-slate-500">Active: {bookings.filter(b => ['confirmed', 'in_progress'].includes(b.status)).length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="text-slate-500">Completed: {stats?.completedBookings || 0}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Recent Bookings Quick View */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl border border-slate-200/60 p-5">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8b4513]">Recent Service Requests</p>
                  <button onClick={() => setActiveTab('bookings')} className="text-[9px] font-black uppercase tracking-wider text-[#8b4513] hover:underline">
                    View All →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 text-[9px] font-black uppercase tracking-wider text-slate-400">
                        <th className="py-2.5 px-3 text-left">ID</th>
                        <th className="py-2.5 px-3 text-left">Client</th>
                        <th className="py-2.5 px-3 text-left">Service</th>
                        <th className="py-2.5 px-3 text-left">Status</th>
                        <th className="py-2.5 px-3 text-left">Agent</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-semibold text-slate-600">
                      {bookings.slice(0, 5).map(b => (
                        <tr key={b._id} className="border-b border-slate-50 hover:bg-[#faf9f6]/60 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-[10px] font-bold text-slate-500">{b.bookingId}</td>
                          <td className="py-2.5 px-3">{b.customer?.firstName || 'N/A'}</td>
                          <td className="py-2.5 px-3 capitalize text-[10px]">{b.serviceType?.replace(/_/g, ' ')}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                              b.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              b.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              b.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>{b.status}</span>
                          </td>
                          <td className="py-2.5 px-3 text-[10px]">{b.assignedAgent ? `${b.assignedAgent.firstName} ${b.assignedAgent.lastName}` : <span className="italic text-slate-400">Unassigned</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          )}

          {/* ═══════════ TAB: CUSTOMERS ═══════════ */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="bg-white rounded-2xl border border-slate-200/60 p-4 flex items-center gap-3">
                <FiSearch size={16} className="text-slate-400" />
                <input
                  type="text" placeholder="Search customers by name, email or phone..."
                  value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)}
                  className="flex-1 text-xs font-semibold bg-transparent focus:outline-none placeholder:text-slate-300"
                />
                {customerSearch && <button onClick={() => setCustomerSearch('')} className="text-slate-300 hover:text-slate-500"><FiX size={14} /></button>}
              </div>

              {/* Customer Grid */}
              <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <th className="py-3 px-4 text-left">Customer</th>
                        <th className="py-3 px-4 text-left">Email</th>
                        <th className="py-3 px-4 text-left">Phone</th>
                        <th className="py-3 px-4 text-left">Membership</th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-semibold text-slate-600">
                      {filteredCustomers.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-10 text-slate-400 italic">No customers found</td></tr>
                      ) : filteredCustomers.map(c => (
                        <tr key={c._id} className="border-b border-slate-50 hover:bg-[#faf9f6]/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#8b4513]/10 text-[#8b4513] flex items-center justify-center text-[10px] font-black uppercase">
                                {c.firstName?.[0]}{c.lastName?.[0]}
                              </div>
                              <span className="font-bold text-slate-700">{c.firstName} {c.lastName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[10px] text-slate-500">{c.email}</td>
                          <td className="py-3 px-4 font-mono text-[10px]">{c.phone}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                              c.membershipStatus === 'platinum' ? 'bg-slate-800 text-white border-slate-700' :
                              c.membershipStatus === 'gold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              c.membershipStatus === 'premium' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>{c.membershipStatus || 'standard'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                              c.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
                            }`}>{c.isActive ? 'Active' : 'Suspended'}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleSuspendCustomer(c._id)}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border shadow-sm transition-all ${
                                c.isActive
                                  ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {c.isActive ? 'Suspend' : 'Reactivate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ TAB: WORKFORCE ═══════════ */}
          {activeTab === 'workforce' && (
            <div className="space-y-6">
              <div className="bg-white/60 backdrop-blur-2xl rounded-2xl border border-slate-200/60 p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-4 border-b border-slate-200/40">
                  <div>
                    <h2 className="text-lg font-black text-[#6c2f00] tracking-tight">Workforce Approvals & Fleet Control</h2>
                    <p className="text-[#753401]/60 text-[10px] font-semibold mt-1">Review technicians, approve credentials, manage fleet.</p>
                  </div>
                  <button
                    onClick={() => {
                      setAgentForm({ firstName: '', lastName: '', email: '', phone: '', passcode: '', profileImage: '', aadharNumber: '', panNumber: '' });
                      setEmailVerified(true); setEmailInput(''); setFilePreviewUrl(''); setAadhaarInput(''); setPanInput('');
                      setShowAddAgentModal(true);
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-[#753401] to-[#8b4513] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-md hover:shadow-lg hover:translate-y-[-1px] active:scale-[0.98] transition-all flex items-center gap-1.5 self-start cursor-pointer"
                  >
                    ➕ Onboard Specialist
                  </button>
                </div>

                {/* Sub-Tabs */}
                <div className="flex gap-6 border-b border-slate-100 mb-6 font-semibold">
                  {[
                    { id: 'active', label: 'Active Fleet', count: agents.filter(a => a.registrationStatus === 'active').length },
                    { id: 'pending', label: 'Pending', count: agents.filter(a => a.registrationStatus === 'pending').length, pulse: true },
                    { id: 'rejected_suspended', label: 'Rejected / Suspended', count: agents.filter(a => ['rejected', 'suspended'].includes(a.registrationStatus)).length },
                  ].map(sub => (
                    <button key={sub.id} onClick={() => setAgentSubView(sub.id)}
                      className={`pb-3 text-[10px] font-black uppercase tracking-wider transition-colors relative flex items-center gap-1.5 ${
                        agentSubView === sub.id ? 'text-[#8b4513]' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {sub.label} ({sub.count})
                      {sub.pulse && sub.count > 0 && (
                        <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[8px] font-black flex items-center justify-center animate-pulse">{sub.count}</span>
                      )}
                      {agentSubView === sub.id && <motion.div layoutId="agentSubTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-[#8b4513]" />}
                    </button>
                  ))}
                </div>

                {/* Agent Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <th className="py-3 px-3">Photo</th><th className="py-3 px-3">ID</th><th className="py-3 px-3">Name</th>
                        <th className="py-3 px-3">Contact</th><th className="py-3 px-3">KYC</th><th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-semibold text-slate-700">
                      {agents.filter(a => {
                        if (agentSubView === 'active') return a.registrationStatus === 'active';
                        if (agentSubView === 'pending') return a.registrationStatus === 'pending';
                        return ['rejected', 'suspended'].includes(a.registrationStatus);
                      }).map(agent => (
                        <tr key={agent._id} className="border-b border-slate-50 hover:bg-[#faf9f6]/60 transition-colors">
                          <td className="py-3 px-3">
                            {agent.profileImage ? <img src={agent.profileImage} alt="" className="h-9 w-9 rounded-full object-cover border shadow-sm" /> :
                              <div className="h-9 w-9 rounded-full bg-[#8b4513]/10 text-[#8b4513] flex items-center justify-center font-bold text-[10px] uppercase">{agent.firstName?.[0]}{agent.lastName?.[0]}</div>}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-[#8b4513] text-[10px]">{agent.agentId}</td>
                          <td className="py-3 px-3 font-bold text-slate-800">{agent.firstName} {agent.lastName}</td>
                          <td className="py-3 px-3 text-[10px]">
                            <p className="text-slate-600">{agent.email}</p>
                            <p className="text-slate-400 font-mono mt-0.5">{agent.phone}</p>
                          </td>
                          <td className="py-3 px-3 font-mono text-[10px] text-slate-500">
                            <p>AADHAAR: XXXX {agent.documents?.aadhar?.slice(-4) || 'N/A'}</p>
                            <p>PAN: {agent.documents?.panCard || 'N/A'}</p>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider ${
                              agent.registrationStatus === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              agent.registrationStatus === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              agent.registrationStatus === 'suspended' ? 'bg-red-50 text-red-600 border border-red-200' :
                              'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>{agent.registrationStatus}</span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <button onClick={() => { setSelectedAgentForAction(agent); setShowViewProfileModal(true); }}
                                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-wider border border-slate-200/60 shadow-sm transition">Details</button>
                              {['pending', 'rejected', 'suspended'].includes(agent.registrationStatus) && (
                                <button onClick={() => { setSelectedAgentForAction(agent); setApprovePasscode(''); setShowApproveModal(true); }}
                                  className="px-2.5 py-1.5 bg-gradient-to-r from-[#753401] to-[#8b4513] text-white rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm transition">Approve</button>
                              )}
                              {agent.registrationStatus === 'pending' && (
                                <button onClick={() => { setSelectedAgentForAction(agent); setRejectionReasonText(''); setShowRejectModal(true); }}
                                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[9px] font-black uppercase shadow-sm transition">Reject</button>
                              )}
                              {agent.registrationStatus === 'active' && (
                                <button onClick={() => handleSuspendAgent(agent._id)}
                                  className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[9px] font-black uppercase shadow-sm transition">Suspend</button>
                              )}
                              <button onClick={() => handleDeleteAgent(agent._id)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 border rounded-lg text-[9px] font-black uppercase shadow-sm transition">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {agents.filter(a => {
                        if (agentSubView === 'active') return a.registrationStatus === 'active';
                        if (agentSubView === 'pending') return a.registrationStatus === 'pending';
                        return ['rejected', 'suspended'].includes(a.registrationStatus);
                      }).length === 0 && (
                        <tr><td colSpan={7} className="text-center py-10 text-slate-400 italic">No specialists in this category</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Workforce Modals - Approve */}
              {showApproveModal && selectedAgentForAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded bg-[#f3e2ac]/80 text-[#706439] font-black text-[9px] uppercase tracking-wider">Security Vault</span>
                        <h3 className="text-lg font-black text-[#6c2f00] mt-1.5">Approve Technician</h3>
                      </div>
                      <button onClick={() => setShowApproveModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                    <p className="text-xs text-slate-500">Activating credentials for <strong>{selectedAgentForAction.firstName} {selectedAgentForAction.lastName}</strong>. Set a secure login passcode.</p>
                    <form onSubmit={handleApproveAgentWithPasscode} className="space-y-4">
                      <div className="relative">
                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b4513]/50" size={14} />
                        <input type="text" value={approvePasscode} onChange={e => setApprovePasscode(e.target.value.replace(/\s/g, ''))} required minLength={6}
                          placeholder="Passcode (min 6 chars)" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#8b4513] font-mono" />
                      </div>
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setShowApproveModal(false)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase">Cancel</button>
                        <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-[#753401] to-[#8b4513] text-white rounded-lg text-[10px] font-black uppercase shadow-md">✅ Approve</button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              {/* Workforce Modals - Reject */}
              {showRejectModal && selectedAgentForAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 font-black text-[9px] uppercase tracking-wider">Vetting Board</span>
                        <h3 className="text-lg font-black text-[#6c2f00] mt-1.5">Reject Applicant</h3>
                      </div>
                      <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                    <form onSubmit={handleRejectAgentWithReason} className="space-y-4">
                      <textarea value={rejectionReasonText} onChange={e => setRejectionReasonText(e.target.value)} required rows={3}
                        placeholder="Reason for rejection..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#8b4513]" />
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setShowRejectModal(false)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase">Cancel</button>
                        <button type="submit" className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black uppercase shadow-md">🚫 Reject</button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              {/* Workforce Modals - View Profile */}
              {showViewProfileModal && selectedAgentForAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        {selectedAgentForAction.profileImage ? <img src={selectedAgentForAction.profileImage} alt="" className="w-11 h-11 rounded-full object-cover border" /> :
                          <div className="w-11 h-11 rounded-full bg-[#8b4513]/10 text-[#8b4513] flex items-center justify-center font-bold text-sm uppercase">{selectedAgentForAction.firstName?.[0]}{selectedAgentForAction.lastName?.[0]}</div>}
                        <div>
                          <h3 className="text-sm font-black text-slate-800">{selectedAgentForAction.firstName} {selectedAgentForAction.lastName}</h3>
                          <p className="text-[9px] text-[#8b4513] font-mono">{selectedAgentForAction.agentId}</p>
                        </div>
                      </div>
                      <button onClick={() => setShowViewProfileModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 bg-[#faf9f6] p-4 rounded-xl border border-slate-100 text-xs font-semibold">
                      <div><p className="text-[8px] font-black text-[#753401]/60 uppercase">Phone</p><p className="font-mono mt-0.5">{selectedAgentForAction.phone}</p></div>
                      <div><p className="text-[8px] font-black text-[#753401]/60 uppercase">Email</p><p className="mt-0.5 truncate">{selectedAgentForAction.email}</p></div>
                    </div>
                    <div className="bg-[#faf9f6] p-4 rounded-xl border border-slate-100 text-xs font-semibold space-y-2">
                      <p className="text-[8px] font-black text-[#753401]/80 uppercase flex items-center gap-1"><FiShield size={12} /> KYC Documents</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div><p className="text-[8px] text-slate-400 uppercase">Aadhaar</p><p className="font-mono mt-0.5">XXXX XXXX {selectedAgentForAction.documents?.aadhar?.slice(-4) || 'N/A'}</p></div>
                        <div><p className="text-[8px] text-slate-400 uppercase">PAN</p><p className="font-mono mt-0.5 uppercase font-black">{selectedAgentForAction.documents?.panCard || 'N/A'}</p></div>
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-400 bg-slate-50 p-3 rounded-xl border space-y-0.5">
                      <p>• Applied: {new Date(selectedAgentForAction.createdAt).toLocaleString()}</p>
                      {selectedAgentForAction.registrationStatus === 'rejected' && <p className="text-amber-600 font-bold">• Reason: {selectedAgentForAction.rejectedReason}</p>}
                    </div>
                    <div className="pt-2 flex justify-end border-t border-slate-100">
                      <button onClick={() => setShowViewProfileModal(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase">Close</button>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Workforce Modals - Add Agent */}
              {showAddAgentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#faf9f6] rounded-2xl border border-slate-200 p-6 max-w-xl w-full shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-start border-b border-[#753401]/10 pb-4">
                      <div><span className="inline-block px-2.5 py-0.5 rounded bg-[#8b4513]/10 text-[#8b4513] font-black text-[9px] uppercase tracking-wider">Workforce Control</span>
                        <h3 className="text-lg font-black text-[#6c2f00] mt-1.5">Direct Specialist Onboarding</h3></div>
                      <button onClick={() => setShowAddAgentModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                    </div>
                    <form onSubmit={handleCreateAgent} className="space-y-4">
                      {/* Avatar Upload */}
                      <div onClick={() => fileInputRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                        onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processSelectedFile(f); }}
                        className={`border-2 border-dashed rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all bg-white ${isDragging ? 'border-[#8b4513] bg-[#8b4513]/5' : 'border-[#753401]/15 hover:border-[#8b4513]'}`}>
                        <input type="file" ref={fileInputRef} onChange={e => { const f = e.target.files?.[0]; if (f) processSelectedFile(f); }} accept="image/*" className="hidden" />
                        <div className="w-14 h-14 rounded-full border-4 border-slate-100 shadow-md bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {filePreviewUrl || agentForm.profileImage ? <img src={filePreviewUrl || agentForm.profileImage} alt="" className="w-full h-full object-cover" /> : <FiUploadCloud size={18} className="text-slate-400" />}
                        </div>
                        <div className="text-xs"><p className="font-bold text-slate-700">Upload Avatar</p><p className="text-[10px] text-slate-400">JPG, PNG, WEBP — Max 5MB</p></div>
                      </div>

                      {/* Form Fields */}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { name: 'firstName', label: 'First Name', placeholder: 'First name', type: 'text' },
                          { name: 'lastName', label: 'Last Name', placeholder: 'Last name', type: 'text' },
                          { name: 'email', label: 'Email', placeholder: 'email@domain.com', type: 'email' },
                          { name: 'phone', label: 'Phone', placeholder: '10-digit', type: 'tel' },
                          { name: 'passcode', label: 'Passcode', placeholder: 'Min 6 chars', type: 'text' },
                        ].map(field => (
                          <div key={field.name} className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider pl-1">{field.label} *</label>
                            <input type={field.type} name={field.name} value={agentForm[field.name]} onChange={handleAgentFormChange} required minLength={field.name === 'passcode' ? 6 : undefined}
                              placeholder={field.placeholder} className="w-full px-3 py-2.5 border border-[#753401]/10 rounded-xl bg-white text-xs font-semibold focus:outline-none focus:border-[#8b4513] shadow-sm" />
                          </div>
                        ))}
                      </div>

                      {/* KYC */}
                      <div className="bg-white border border-[#753401]/10 rounded-xl p-4 space-y-3">
                        <p className="text-[10px] font-black text-[#8b4513] uppercase tracking-wider flex items-center gap-1"><FiFileText size={12} /> KYC Documents</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase pl-1">Aadhaar *</label>
                            <input type="text" value={aadhaarInput}
                              onChange={e => { const raw = e.target.value.replace(/\D/g, '').slice(0, 12); setAadhaarInput(raw.replace(/(\d{4})(?=\d)/g, '$1 ')); setAgentForm(f => ({ ...f, aadharNumber: raw.replace(/(\d{4})(?=\d)/g, '$1 ') })); }}
                              required placeholder="XXXX XXXX XXXX" className="w-full px-3 py-2.5 border border-[#753401]/10 rounded-xl bg-white text-xs font-bold font-mono focus:outline-none focus:border-[#8b4513] shadow-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase pl-1">PAN *</label>
                            <input type="text" value={panInput}
                              onChange={e => { const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10); setPanInput(v); setAgentForm(f => ({ ...f, panNumber: v })); }}
                              required placeholder="ABCDE1234F" className="w-full px-3 py-2.5 border border-[#753401]/10 rounded-xl bg-white text-xs font-black font-mono uppercase focus:outline-none focus:border-[#8b4513] shadow-sm" />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setShowAddAgentModal(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-[#753401] to-[#8b4513] text-white rounded-xl text-[10px] font-black uppercase shadow-md">✅ Register</button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════ TAB: BOOKINGS ═══════════ */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <th className="py-3 px-4 text-left">Booking ID</th>
                        <th className="py-3 px-4 text-left">Customer</th>
                        <th className="py-3 px-4 text-left">Service</th>
                        <th className="py-3 px-4 text-left">Date</th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-left">Agent</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-semibold text-slate-600">
                      {bookings.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-10 text-slate-400 italic">No bookings found</td></tr>
                      ) : bookings.map(b => (
                        <tr key={b._id} className="border-b border-slate-50 hover:bg-[#faf9f6]/60 transition-colors">
                          <td className="py-3 px-4 font-mono text-[10px] font-bold text-slate-500">{b.bookingId}</td>
                          <td className="py-3 px-4 font-bold text-slate-700">{b.customer?.firstName || 'N/A'}</td>
                          <td className="py-3 px-4 capitalize text-[10px]">{b.serviceType?.replace(/_/g, ' ')}</td>
                          <td className="py-3 px-4 text-[10px] text-slate-400">{b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : '—'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                              b.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              b.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              b.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>{b.status}</span>
                          </td>
                          <td className="py-3 px-4">
                            {b.assignedAgent ? (
                              <div><span className="font-bold text-emerald-700 text-[10px]">{b.assignedAgent.firstName} {b.assignedAgent.lastName}</span>
                              <p className="text-[8px] text-slate-400 font-mono">({b.assignedAgent.agentId})</p></div>
                            ) : <span className="italic text-slate-400 text-[10px]">Unassigned</span>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {!['completed', 'cancelled'].includes(b.status) && (
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={() => setSelectedBookingForAssign(b)}
                                  className="px-2.5 py-1.5 bg-gradient-to-r from-[#753401] to-[#8b4513] text-white rounded-lg text-[9px] font-black uppercase shadow-sm transition">
                                  {b.assignedAgent ? 'Reassign' : 'Assign'}
                                </button>
                                {b.assignedAgent && (
                                  <button onClick={() => handleUnassignAgent(b._id)}
                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border rounded-lg text-[9px] font-black uppercase shadow-sm transition">Unassign</button>
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

              {/* Assign Agent Modal */}
              {selectedBookingForAssign && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                    <h3 className="text-lg font-black text-[#6c2f00]">Assign Agent</h3>
                    <p className="text-xs text-slate-500">Booking: <strong>{selectedBookingForAssign.bookingId}</strong> — {selectedBookingForAssign.customer?.firstName}</p>
                    <select value={selectedAgentId} onChange={e => setSelectedAgentId(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#8b4513]">
                      <option value="">-- Select Agent --</option>
                      {agents.filter(a => a.isActive || a.registrationStatus === 'active').map(a => (
                        <option key={a._id} value={a._id}>{a.firstName} {a.lastName} ({a.agentId})</option>
                      ))}
                    </select>
                    <div className="flex gap-3">
                      <button onClick={() => { setSelectedBookingForAssign(null); setSelectedAgentId(''); }} disabled={isAssigning}
                        className="flex-1 px-4 py-2.5 border-2 border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition disabled:opacity-50">Cancel</button>
                      <button onClick={handleAssignAgent} disabled={isAssigning || !selectedAgentId}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#753401] to-[#8b4513] text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2">
                        {isAssigning ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Assigning...</> : 'Assign Agent'}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════ TAB: FINANCE ═══════════ */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total Transactions', value: payments.length, icon: FiCreditCard },
                  { label: 'Completed Payments', value: payments.filter(p => p.status === 'completed').length, icon: FiCheckCircle },
                  { label: 'Refunded', value: payments.filter(p => p.status === 'refunded').length, icon: FiRefreshCw },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200/60 p-5 flex items-center gap-4">
                    <div className="p-2.5 bg-[#faf9f6] rounded-xl border border-slate-100 text-[#8b4513]"><s.icon size={18} /></div>
                    <div><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{s.label}</p><p className="text-xl font-black text-slate-800">{s.value}</p></div>
                  </div>
                ))}
              </div>

              {/* Payments Table */}
              <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <th className="py-3 px-4 text-left">Transaction ID</th>
                        <th className="py-3 px-4 text-left">Customer</th>
                        <th className="py-3 px-4 text-left">Amount</th>
                        <th className="py-3 px-4 text-left">Method</th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-left">Date</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-semibold text-slate-600">
                      {payments.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-10 text-slate-400 italic">No payment records found</td></tr>
                      ) : payments.map(p => (
                        <tr key={p._id} className="border-b border-slate-50 hover:bg-[#faf9f6]/60 transition-colors">
                          <td className="py-3 px-4 font-mono text-[10px] font-bold text-slate-500">{p.transactionId}</td>
                          <td className="py-3 px-4">{p.customer?.firstName} {p.customer?.lastName}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">₹{p.amount}</td>
                          <td className="py-3 px-4 uppercase text-[10px]">{p.method}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                              p.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              p.status === 'refunded' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              p.status === 'failed' ? 'bg-red-50 text-red-600 border-red-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>{p.status}</span>
                          </td>
                          <td className="py-3 px-4 text-[10px] text-slate-400">{new Date(p.paymentDate || p.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-center">
                            {p.status === 'completed' && (
                              <button onClick={() => handleRefund(p._id)}
                                className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[9px] font-black uppercase shadow-sm transition">
                                Refund
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ TAB: HELPDESK ═══════════ */}
          {activeTab === 'helpdesk' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: '500px' }}>
              {/* Tickets List */}
              <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/60 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8b4513]">Support Tickets ({complaints.length})</p>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                  {complaints.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-10">No tickets found</p>
                  ) : complaints.map(t => (
                    <button key={t._id} onClick={() => { setActiveTicket(t); setReplyText(''); }}
                      className={`w-full text-left p-4 hover:bg-[#faf9f6]/60 transition-colors ${activeTicket?._id === t._id ? 'bg-[#8b4513]/5 border-l-2 border-[#8b4513]' : ''}`}>
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs font-bold text-slate-700 truncate flex-1">{t.subject}</p>
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider flex-shrink-0 ${
                          t.status === 'open' ? 'bg-amber-50 text-amber-700' :
                          t.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                          'bg-emerald-50 text-emerald-700'
                        }`}>{t.status.replace('_', ' ')}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{t.customer?.firstName} {t.customer?.lastName} • {t.category}</p>
                      <p className="text-[9px] text-slate-300 mt-1">{new Date(t.createdAt).toLocaleDateString()}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Terminal */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 overflow-hidden flex flex-col">
                {activeTicket ? (
                  <>
                    {/* Ticket Header */}
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-black text-slate-800">{activeTicket.subject}</p>
                        <p className="text-[10px] text-slate-400">{activeTicket.ticketId} • {activeTicket.category} • Priority: {activeTicket.priority}</p>
                      </div>
                      {activeTicket.status !== 'closed' && (
                        <button onClick={() => handleCloseTicket(activeTicket._id)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[9px] font-black uppercase shadow-sm transition hover:bg-emerald-100">
                          ✓ Close Ticket
                        </button>
                      )}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '380px' }}>
                      {activeTicket.messages?.map((msg, i) => (
                        <div key={i} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs font-semibold ${
                            msg.sender === 'admin'
                              ? 'bg-gradient-to-r from-[#753401] to-[#8b4513] text-white rounded-br-md'
                              : 'bg-[#faf9f6] text-slate-700 border border-slate-100 rounded-bl-md'
                          }`}>
                            <p className="text-[8px] font-black uppercase tracking-wider mb-1 opacity-70">{msg.sender}</p>
                            <p className="leading-relaxed">{msg.text}</p>
                            <p className="text-[8px] mt-1.5 opacity-50">{new Date(msg.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Reply Input */}
                    {activeTicket.status !== 'closed' && (
                      <div className="p-4 border-t border-slate-100 flex gap-3">
                        <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSendReply(); }}
                          placeholder="Type your reply..."
                          className="flex-1 px-4 py-2.5 bg-[#faf9f6] border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#8b4513]" />
                        <button onClick={handleSendReply} disabled={isSendingReply || !replyText.trim()}
                          className="px-4 py-2.5 bg-gradient-to-r from-[#753401] to-[#8b4513] text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50 flex items-center gap-1.5 transition hover:shadow-lg">
                          <FiSend size={12} /> Send
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <FiMessageSquare size={32} className="text-slate-200 mx-auto" />
                      <p className="text-xs text-slate-400 font-semibold">Select a ticket to view conversation</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════ TAB: BROADCASTER ═══════════ */}
          {activeTab === 'broadcast' && (
            <div className="space-y-6 w-full">
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200/60 p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="p-2.5 bg-[#8b4513]/10 rounded-xl text-[#8b4513]"><FiBell size={18} /></div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">Platform Announcement</h3>
                    <p className="text-[10px] text-slate-400 font-semibold">Broadcast alerts to all customers and agents</p>
                  </div>
                </div>

                <form onSubmit={handleBroadcast} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider pl-1">Announcement Title *</label>
                    <input type="text" value={broadcastForm.title} onChange={e => setBroadcastForm(f => ({ ...f, title: e.target.value }))}
                      required placeholder="e.g. Scheduled Maintenance Alert"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#8b4513] bg-[#faf9f6]" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider pl-1">Message Body *</label>
                    <textarea value={broadcastForm.message} onChange={e => setBroadcastForm(f => ({ ...f, message: e.target.value }))}
                      required rows={4} placeholder="Enter your announcement message..."
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#8b4513] bg-[#faf9f6] leading-relaxed" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider pl-1">Target Audience</label>
                    <select value={broadcastForm.audience} onChange={e => setBroadcastForm(f => ({ ...f, audience: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#8b4513] bg-[#faf9f6]">
                      <option value="all">All Users (Customers + Agents)</option>
                      <option value="customers">Customers Only</option>
                      <option value="agents">Agents Only</option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={isBroadcasting}
                      className="px-6 py-3 bg-gradient-to-r from-[#753401] to-[#8b4513] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2">
                      {isBroadcasting ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Dispatching...</> : <><FiSend size={12} /> Broadcast Now</>}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

        </main>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
