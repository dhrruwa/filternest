import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiArrowRight, FiUser, FiPhone, FiShield, FiAlertTriangle } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuthStore } from '../context/authStore';
import { getRoleLandingPath } from '../utils/auth';
import api from '../services/api';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('session_expired') === 'true';

  const { login, requestLoginOTP, verifyLoginOTP, isLoading } = useAuthStore();

  const [userType, setUserType] = useState('customer');
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'mobile'
  const [step, setStep] = useState(1); // 1: Input details, 2: Verify OTP (both email and SMS)

  // Form Fields
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    agentId: '',
    passcode: '',
    phone: '',
  });

  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState(null);
  const [otpError, setOtpError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  // Google Onboarding Flow
  const [showGoogleOnboard, setShowGoogleOnboard] = useState(false);
  const [showGooglePopup, setShowGooglePopup] = useState(false);
  const [googleData, setGoogleData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'customer',
  });

  // Cinematic Purity Wave Transition States
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [isExpanding, setIsExpanding] = useState(false);
  const [bubbles, setBubbles] = useState([]);

  // Session expired toast alert
  useEffect(() => {
    if (sessionExpired) {
      toast.error('Your session has expired. Please log in again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [sessionExpired]);

  // Bubble animation during liquid morph transition
  useEffect(() => {
    if (!isTransitioning) return;

    const progressInterval = setInterval(() => {
      setTransitionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1.5;
      });
    }, 25);

    const bubbleInterval = setInterval(() => {
      setBubbles((prev) => [
        ...prev.slice(-25),
        {
          id: Math.random(),
          size: Math.random() * 8 + 4,
          left: Math.random() * 90 + 5,
          delay: Math.random() * 0.3,
          duration: Math.random() * 1.8 + 1,
        }
      ]);
    }, 100);

    return () => {
      clearInterval(progressInterval);
      clearInterval(bubbleInterval);
    };
  }, [isTransitioning]);

  // Page navigation trigger when purity alignment finishes
  useEffect(() => {
    if (transitionProgress >= 100 && isTransitioning && !isExpanding) {
      setIsExpanding(true);
      const timer = setTimeout(() => {
        navigate('/my-bookings', { state: { fromLoginTransition: true } });
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [transitionProgress, isTransitioning, isExpanding, navigate]);

  // OTP Countdown timer
  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setOtpError('');
  };

  // Submit First Step (Standard Password or Request Email OTP / Mobile OTP)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1. Mobile OTP Request Flow
      if (loginMethod === 'mobile') {
        const cleanPhone = formData.phone.replace(/\D/g, '');
        if (cleanPhone.length !== 10) {
          toast.error('Please enter a valid 10-digit phone number');
          return;
        }

        const response = await api.post('/auth/login/mobile/request', { phone: cleanPhone });
        setUserId(response.data.userId);
        setUserType(response.data.userType);
        setStep(2);
        setTimeLeft(300); // 5 minutes SMS expiry
        toast.success('Mobile login OTP dispatched');
        return;
      }

      // 2. Standard Legacy / Agent / Admin logins
      if (userType === 'agent') {
        if (!formData.agentId || !formData.passcode) {
          toast.error('Agent ID and Passcode are required');
          return;
        }

        const response = await login(formData.agentId, formData.passcode, 'agent');
        toast.success('Agent workspace calibrated!');
        navigate(getRoleLandingPath(response.agent?.role || 'agent'));
        return;
      }

      if (userType === 'admin') {
        if (!formData.email || !formData.password) {
          toast.error('Email and Password are required');
          return;
        }

        const response = await login(formData.email, formData.password, 'admin');
        toast.success('Admin authorization active!');
        navigate(getRoleLandingPath(response.admin?.role || 'admin'));
        return;
      }

      // 3. Customer OTP Login Request (Standard Two-step verification)
      if (!formData.email || !formData.password) {
        toast.error('Email and Password are required');
        return;
      }

      const response = await requestLoginOTP(formData.email, formData.password, 'customer');
      setUserId(response.userId);
      setStep(2);
      setTimeLeft(600); // 10 minutes email OTP expiry
      toast.success('Verification code sent to email');
    } catch (error) {
      console.error('Login submit error:', error);
      toast.error(error.response?.data?.error || 'Authentication attempt failed');
    }
  };

  // Submit Second Step (Verify OTP for email or SMS)
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setOtpError('Please enter the 6-digit OTP code');
      return;
    }

    try {
      if (loginMethod === 'mobile') {
        // Verify Mobile OTP
        const response = await api.post('/auth/login/mobile/verify', {
          userId,
          otp,
          userType,
        });

        // Store tokens securely in Zustand store
        const store = useAuthStore.getState();
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({ ...response.data.user, role: response.data.role }));
        localStorage.setItem('userType', response.data.role);

        store.hydrateFromStorage();

        toast.success('Verification successful!');
        if (response.data.role === 'customer') {
          setIsTransitioning(true);
        } else {
          navigate(getRoleLandingPath(response.data.role));
        }
        return;
      }

      // Verify Email OTP
      const response = await verifyLoginOTP(userId, otp, userType);
      const role = response?.user?.role || userType;

      if (role === 'customer') {
        setIsTransitioning(true);
      } else {
        toast.success('Login authorized!');
        navigate(getRoleLandingPath(role));
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setOtpError(error.response?.data?.error || 'Verification failed');
      toast.error(error.response?.data?.error || 'Invalid OTP code');
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    try {
      if (loginMethod === 'mobile') {
        await api.post('/auth/login/mobile/request', { phone: formData.phone });
        setTimeLeft(300);
        toast.success('Verification code resent successfully');
        return;
      }

      await requestLoginOTP(formData.email, formData.password, userType);
      setTimeLeft(600);
      toast.success('Verification code resent to email');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to resend code');
    }
  };

  // Simulate Google Sign-In & Onboarding Trigger
  const triggerGoogleOAuth = () => {
    // Open our stunning visual Google Account selector pop-up window!
    setShowGooglePopup(true);
  };

  const handleGoogleAccountSelect = async (selectedEmail) => {
    setShowGooglePopup(false);
    try {
      // Simulate Google token authentication checks
      const response = await api.post('/auth/google', { credential: `GOOGLE_TOKEN_${selectedEmail}` });

      if (response.data.requiresRegistrationCompletion) {
        setGoogleData({
          email: response.data.email,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          phone: '',
          role: 'customer',
        });
        setShowGoogleOnboard(true);
      } else {
        // User logged in directly
        const store = useAuthStore.getState();
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({ ...response.data.user, role: response.data.role }));
        localStorage.setItem('userType', response.data.role);
        store.hydrateFromStorage();

        toast.success('Google authenticated successfully!');
        if (response.data.role === 'customer') {
          setIsTransitioning(true);
        } else {
          navigate(getRoleLandingPath(response.data.role));
        }
      }
    } catch (error) {
      toast.error('Google ID token verification failed');
    }
  };

  const handleGoogleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!googleData.phone || googleData.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      const response = await api.post('/auth/google/complete', googleData);
      setShowGoogleOnboard(false);

      if (googleData.role === 'agent') {
        toast.success('Onboarding complete! Profile is pending admin approval.');
        return;
      }

      // Log in Customer directly
      const store = useAuthStore.getState();
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify({ ...response.data.user, role: response.data.role }));
      localStorage.setItem('userType', response.data.role);
      store.hydrateFromStorage();

      toast.success('Google registration aligned!');
      setIsTransitioning(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Onboarding failed');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#faf9f6] flex flex-col justify-between">
      {/* Background kitchen scene */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="/images/hero_kitchen_scene.png" 
          alt="FilterNest Sanctuary" 
          className="w-full h-full object-cover blur-[5px] scale-[1.02] opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#faf9f6]/95 via-[#faf9f6]/85 sm:via-[#faf9f6]/60 to-transparent"></div>
      </div>

      <Navbar />

      <section className="relative z-10 py-16 px-4 md:px-8 flex-grow flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`w-full max-w-md bg-white/40 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 shadow-[0_20px_50px_rgba(108,47,0,0.06)] transition-all duration-750 ${
            isTransitioning ? 'border-transparent shadow-none bg-transparent backdrop-blur-none' : ''
          }`}
        >
          {isTransitioning ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-6 space-y-8"
            >
              {/* Custom CSS block for liquid animations */}
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes wave-flow { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                @keyframes wave-flow-reverse { 0% { transform: translateX(0); } 100% { transform: translateX(50%); } }
                @keyframes bubble-up {
                  0% { transform: translateY(0) scale(0.6); opacity: 0.15; }
                  20% { opacity: 0.75; transform: translateY(-20px) translateX(4px) scale(1); }
                  50% { transform: translateY(-80px) translateX(-4px) scale(0.9); }
                  85% { transform: translateY(-170px) translateX(2px) scale(1.1); opacity: 0.45; }
                  100% { transform: translateY(-270px) scale(0.5); opacity: 0; }
                }
                .animate-wave-flow { animation: wave-flow 4s linear infinite; }
                .animate-wave-flow-reverse { animation: wave-flow-reverse 3s linear infinite; }
                .animate-bubble-up { animation: bubble-up 2.2s ease-in-out infinite; }
              `}} />

              {/* Glassmorphic Liquid Morph Capsule */}
              <div 
                className={`relative w-48 h-80 rounded-[40px] border-4 border-white/60 shadow-[0_20px_50px_rgba(14,165,233,0.15)] bg-slate-950/5 backdrop-blur-md overflow-hidden flex flex-col justify-end transition-all duration-700 ease-in-out ${
                  isExpanding ? 'scale-[32] shadow-none border-transparent rounded-none' : ''
                }`}
              >
                {/* Wave Fill Level */}
                <motion.div 
                  className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-600/80 via-cyan-500/75 to-sky-400/65"
                  style={{ height: `${transitionProgress}%` }}
                  layout
                >
                  {/* Morph Waves */}
                  <svg className="absolute w-[200%] h-12 bottom-[96%] left-0 animate-wave-flow opacity-80 pointer-events-none" viewBox="0 0 120 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 15C30 15 30 5 60 5C90 5 90 15 120 15V28H0V15Z" fill="#38bdf8" />
                  </svg>
                  <svg className="absolute w-[200%] h-12 bottom-[96%] left-[-50px] animate-wave-flow-reverse opacity-55 pointer-events-none" viewBox="0 0 120 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 15C30 15 30 5 60 5C90 5 90 15 120 15V28H0V15Z" fill="#0ea5e9" />
                  </svg>

                  {/* Rising Bubbles */}
                  {bubbles.map((b) => (
                    <span
                      key={b.id}
                      className="absolute bg-white/50 rounded-full border border-white/20 animate-bubble-up pointer-events-none"
                      style={{
                        width: `${b.size}px`,
                        height: `${b.size}px`,
                        left: `${b.left}%`,
                        bottom: `0px`,
                        animationDelay: `${b.delay}s`,
                        animationDuration: `${b.duration}s`,
                      }}
                    />
                  ))}
                </motion.div>

                {/* Digital purity readout */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center z-15 pointer-events-none select-none transition-opacity duration-300 ${isExpanding ? 'opacity-0' : 'opacity-100'}`}>
                  <span className="text-4xl font-black font-mono tracking-tighter text-white drop-shadow-[0_2px_8px_rgba(2,132,199,0.35)]">
                    {Math.round(transitionProgress)}%
                  </span>
                  <span className="text-[10px] font-black tracking-widest uppercase text-white/80 mt-1">
                    PURITY ALIGNED
                  </span>
                </div>
              </div>

              {/* Breathing messages */}
              <div className="text-center space-y-2 max-w-xs animate-pulse">
                <p className="text-sm font-extrabold text-primary uppercase tracking-wider">
                  FilterNest Smart Vault
                </p>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                  Calibrating your smart water ecosystem...
                </p>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Logo Brand Header */}
              <div className="flex flex-col items-center mb-6">
                <div className="h-10 overflow-hidden flex items-center mb-1">
                  <img 
                    src="/logos/filternest_wordmark.png" 
                    alt="FilterNest" 
                    className="h-[120px] w-auto mt-[-35px] mb-[-45px] object-contain mix-blend-multiply"
                  />
                </div>
                <p className="text-[10px] font-black text-secondary tracking-widest uppercase text-center flex items-center gap-1.5">
                  <FiShield size={12} className="text-primary" /> Security Identity Vault
                </p>
              </div>

              {/* Onboarding Complete Selection modal for Google OAuth */}
              <AnimatePresence>
                {showGoogleOnboard && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-[#faf9f6] rounded-3xl p-6 flex flex-col justify-center space-y-6"
                  >
                    <div className="text-center">
                      <FiShield className="text-secondary mx-auto mb-2" size={32} />
                      <h3 className="text-lg font-bold text-primary">Complete Google Registration</h3>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                        We verified your Google account <span className="font-bold text-slate-800">{googleData.email}</span>. Choose your role and enter your mobile number.
                      </p>
                    </div>

                    <form onSubmit={handleGoogleOnboardSubmit} className="space-y-4 text-xs font-semibold">
                      {/* Role selection */}
                      <div className="grid grid-cols-2 gap-2 p-1 bg-[#efeeeb]/60 rounded-xl border border-outline-variant/10">
                        {['customer', 'agent'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setGoogleData(prev => ({ ...prev, role: type }))}
                            className={`py-2 rounded-lg font-bold transition-all ${
                              googleData.role === type
                                ? 'bg-gradient-primary text-white shadow-sm'
                                : 'text-on-surface-variant hover:text-primary'
                            }`}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>

                      {/* Phone number */}
                      <div>
                        <label className="block text-primary font-bold uppercase mb-1 tracking-wider">Mobile Number</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60"><FiPhone size={14} /></span>
                          <input
                            type="tel"
                            required
                            placeholder="10-digit number"
                            value={googleData.phone}
                            onChange={(e) => setGoogleData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                            className="w-full pl-10 pr-4 py-3 border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gradient-primary text-on-primary font-bold py-3.5 rounded-xl uppercase tracking-wider shadow-sm hover:translate-y-[-1px] transition-all"
                      >
                        Complete Onboarding
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowGoogleOnboard(false)}
                        className="w-full text-center text-primary font-bold hover:underline"
                      >
                        Cancel
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Google Account Selector Pop-Up Overlay (Simulating Google GIS Popup) */}
              <AnimatePresence>
                {showGooglePopup && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowGooglePopup(false)}
                      className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
                    />

                    {/* Google Account Picker Window Box */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 15 }}
                      transition={{ type: 'spring', duration: 0.4 }}
                      className="relative z-10 w-full max-w-[380px] bg-white rounded-2xl p-6 shadow-2xl border border-slate-200/80 flex flex-col justify-between"
                      style={{ fontFamily: "'Roboto', 'Segoe UI', Arial, sans-serif" }}
                    >
                      {/* Close Button */}
                      <button
                        onClick={() => setShowGooglePopup(false)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 transition-colors focus:outline-none"
                      >
                        ✕
                      </button>

                      <div className="flex flex-col items-center">
                        {/* Google Logo */}
                        <svg className="h-6 w-auto mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l3.66-2.82z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.08l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z" fill="#EA4335"/>
                        </svg>

                        <h3 className="text-lg font-bold text-slate-800 text-center tracking-tight mb-0.5">Choose an account</h3>
                        <p className="text-xs text-slate-500 text-center mb-6">to continue to <span className="font-bold text-slate-600">FilterNest</span></p>
                      </div>

                      {/* Accounts list */}
                      <div className="space-y-2 mb-6 max-h-[220px] overflow-y-auto pr-1">
                        {/* Account 1: Dhruva */}
                        <button
                          onClick={() => handleGoogleAccountSelect('dhrruwa@gmail.com')}
                          className="w-full p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-all flex items-center gap-3 text-left focus:outline-none"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-primary text-white flex items-center justify-center font-bold text-sm">
                            D
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate leading-tight">Dhruva</p>
                            <p className="text-[10px] text-slate-500 truncate leading-none mt-1">dhrruwa@gmail.com</p>
                          </div>
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded uppercase tracking-wider shrink-0">
                            Active
                          </span>
                        </button>

                        {/* Account 2: Guest */}
                        <button
                          onClick={() => handleGoogleAccountSelect('guest@gmail.com')}
                          className="w-full p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-all flex items-center gap-3 text-left focus:outline-none"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">
                            G
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate leading-tight">Guest Account</p>
                            <p className="text-[10px] text-slate-500 truncate leading-none mt-1">guest@gmail.com</p>
                          </div>
                        </button>

                        {/* Account 3: Custom account */}
                        <button
                          onClick={async () => {
                            const customEmail = window.prompt("Enter your Google Account email address:");
                            if (customEmail && customEmail.includes('@')) {
                              await handleGoogleAccountSelect(customEmail);
                            } else if (customEmail) {
                              toast.error('Invalid email format (expected user@domain.com)');
                            }
                          }}
                          className="w-full p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-all flex items-center gap-3 text-left focus:outline-none"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center text-xs">
                            ➕
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate leading-tight">Use another account</p>
                            <p className="text-[10px] text-slate-500 truncate leading-none mt-1">Sign in with a different email</p>
                          </div>
                        </button>
                      </div>

                      {/* Footer */}
                      <div className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-100 pt-4 text-center">
                        Google will share your name, email, profile picture, and preferences with FilterNest to establish your credentials securely.
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Form Content Wrapper */}
              <div className="space-y-6">
                {step === 1 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-primary mb-1">Welcome Back</h2>
                      <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                        Sign in to calibrate your water purification ecosystem.
                      </p>
                    </div>

                    {/* Tactile Role Selector Tabs */}
                    <div className="relative grid grid-cols-3 gap-1 mb-6 p-1 bg-[#efeeeb]/60 backdrop-blur-md rounded-2xl border border-outline-variant/10">
                      {['customer', 'agent', 'admin'].map((type) => {
                        const isSelected = userType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setUserType(type);
                              if (type !== 'customer') setLoginMethod('password'); // Mobile OTP only for customers/agents
                            }}
                            disabled={isLoading}
                            className={`relative z-10 py-2.5 rounded-xl font-label-md text-xs transition-all duration-300 ${
                              isSelected 
                                ? 'text-on-primary font-bold' 
                                : 'text-on-surface-variant hover:text-primary font-semibold'
                            }`}
                          >
                            {isSelected && (
                              <motion.div
                                layoutId="activeTabGlow"
                                className="absolute inset-0 z-[-1] bg-gradient-primary rounded-xl shadow-[0_4px_12px_rgba(108,47,0,0.1)]"
                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                              />
                            )}
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        );
                      })}
                    </div>

                    {/* Choice between Password & Mobile OTP login (only for customers/agents) */}
                    {userType === 'customer' && (
                      <div className="flex justify-center gap-6 text-xs font-bold uppercase tracking-wider mb-5 pb-3 border-b border-outline-variant/10">
                        <button
                          type="button"
                          onClick={() => setLoginMethod('password')}
                          className={`pb-1 transition-colors ${loginMethod === 'password' ? 'text-primary border-b-2 border-primary font-extrabold' : 'text-on-surface-variant/70 hover:text-primary'}`}
                        >
                          Password
                        </button>
                        <button
                          type="button"
                          onClick={() => setLoginMethod('mobile')}
                          className={`pb-1 transition-colors ${loginMethod === 'mobile' ? 'text-primary border-b-2 border-primary font-extrabold' : 'text-on-surface-variant/70 hover:text-primary'}`}
                        >
                          Mobile OTP
                        </button>
                      </div>
                    )}

                    {/* Conditional Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {loginMethod === 'password' ? (
                        <>
                          {/* Standard Username/Email */}
                          <div>
                            <label className="block text-[11px] font-bold text-primary mb-1.5 uppercase tracking-wide">
                              {userType === 'agent' ? 'Agent ID' : 'Email Address'}
                            </label>
                            <div className="relative group">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 transition-colors group-focus-within:text-primary">
                                {userType === 'agent' ? <FiUser size={16} /> : <FiMail size={16} />}
                              </span>
                              <input
                                type={userType === 'agent' ? 'text' : 'email'}
                                name={userType === 'agent' ? 'agentId' : 'email'}
                                value={userType === 'agent' ? formData.agentId : formData.email}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                                placeholder={userType === 'agent' ? 'Enter Agent ID' : 'you@example.com'}
                                className="w-full pl-11 pr-4 py-3 bg-white/70 backdrop-blur-md border border-outline-variant/30 rounded-xl text-sm text-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all duration-300 placeholder-on-surface-variant/40 shadow-sm"
                              />
                            </div>
                          </div>

                          {/* Password */}
                          <div>
                            <label className="block text-[11px] font-bold text-primary mb-1.5 uppercase tracking-wide">
                              {userType === 'agent' ? 'Passcode' : 'Password'}
                            </label>
                            <div className="relative group">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 transition-colors group-focus-within:text-primary">
                                <FiLock size={16} />
                              </span>
                              <input
                                type="password"
                                name={userType === 'agent' ? 'passcode' : 'password'}
                                value={userType === 'agent' ? formData.passcode : formData.password}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                                placeholder="••••••••"
                                className="w-full pl-11 pr-4 py-3 bg-white/70 backdrop-blur-md border border-outline-variant/30 rounded-xl text-sm text-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all duration-300 placeholder-on-surface-variant/40 shadow-sm"
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Mobile OTP Input */
                        <div>
                          <label className="block text-[11px] font-bold text-primary mb-1.5 uppercase tracking-wide">
                            Mobile Number
                          </label>
                          <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 transition-colors group-focus-within:text-primary">
                              <FiPhone size={16} />
                            </span>
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                              required
                              disabled={isLoading}
                              placeholder="10-digit number"
                              className="w-full pl-11 pr-4 py-3 bg-white/70 backdrop-blur-md border border-outline-variant/30 rounded-xl text-sm text-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all duration-300 placeholder-on-surface-variant/40 shadow-sm font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-primary text-on-primary text-xs py-3.5 rounded-xl shadow-[0_8px_20px_rgba(108,47,0,0.1)] hover:shadow-[0_12px_24px_rgba(108,47,0,0.18)] hover:translate-y-[-1px] active:scale-[0.98] disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2 font-bold uppercase tracking-wider"
                      >
                        {isLoading ? 'Processing...' : loginMethod === 'mobile' ? 'Request Login OTP' : 'Sign In'}
                        {!isLoading && <FiArrowRight size={16} />}
                      </button>
                    </form>

                    {/* divider */}
                    <div className="relative my-6 flex items-center justify-center">
                      <div className="absolute inset-x-0 h-px bg-outline-variant/20"></div>
                      <span className="relative bg-[#faf9f6]/95 backdrop-blur-sm px-3 text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">or continue with</span>
                    </div>

                    {/* Google OAuth Login Button */}
                    <button
                      type="button"
                      onClick={triggerGoogleOAuth}
                      className="w-full bg-white/80 hover:bg-white border border-outline-variant/40 hover:border-outline-variant text-primary font-bold text-xs py-3.5 rounded-xl hover:translate-y-[-1px] shadow-sm active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-wide"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.136 4.2A5.632 5.632 0 0 1 8.24 13a5.632 5.632 0 0 1 5.75-5.6c1.65 0 3.037.66 4.09 1.6l3.14-3.14c-2.31-2.12-5.34-3.41-8.98-3.41A10.36 10.36 0 0 0 1.88 13a10.36 10.36 0 0 0 10.36 10.36c5.78 0 10.42-4.72 10.42-10.42 0-.66-.08-1.32-.22-1.93l-10.2-.025z"/>
                      </svg>
                      Google
                    </button>

                    {/* Footer links */}
                    <div className="mt-6 text-center space-y-2">
                      {userType === 'customer' && (
                        <p className="text-on-surface-variant/80 text-xs font-semibold">
                          Don't have an account?{' '}
                          <Link to="/register" className="text-primary font-bold hover:underline">
                            Register
                          </Link>
                        </p>
                      )}
                      {userType === 'agent' && (
                        <div className="pt-4 border-t border-[#753401]/10 mt-4 space-y-2">
                          <p className="text-on-surface-variant/80 text-xs font-semibold tracking-wide">
                            Want to join FilterNest as a technician?
                          </p>
                          <div className="pt-1">
                            <Link 
                              to="/technician-application" 
                              className="inline-block px-6 py-2.5 bg-gradient-primary text-on-primary rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm hover:translate-y-[-1px] active:scale-[0.98] transition-all duration-300 hover:shadow-lg"
                            >
                              Apply for Technician Access
                            </Link>
                          </div>
                        </div>
                      )}
                      {loginMethod === 'password' && userType !== 'agent' && (
                        <p className="text-xs font-semibold">
                          <Link to="/forgot-password" className="text-primary font-bold hover:underline">
                            Forgot Password?
                          </Link>
                        </p>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* OTP Header */}
                    <div className="mb-6">
                      <button
                        onClick={() => setStep(1)}
                        className="text-primary hover:underline font-bold mb-4 text-xs flex items-center gap-1.5 transition-all"
                      >
                        ← Back to Details
                      </button>
                      <h2 className="text-2xl font-bold text-primary mb-1">Verify Security Code</h2>
                      <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                        Enter the secure one-time code sent to{' '}
                        <span className="font-bold text-primary">
                          {loginMethod === 'mobile' ? `+91 ${formData.phone}` : formData.email}
                        </span>
                      </p>
                    </div>

                    {/* OTP Verification form */}
                    <form onSubmit={handleVerifyOTP} className="space-y-5">
                      <div>
                        <label className="block text-[11px] font-bold text-primary mb-2 text-center uppercase tracking-wider">
                          Verification Code (OTP)
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => {
                            setOtp(e.target.value.replace(/\D/g, ''));
                            setOtpError('');
                          }}
                          className="w-full px-4 py-3.5 text-center text-3xl font-mono font-bold tracking-[0.5em] bg-white/70 backdrop-blur-md border-2 border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all duration-300"
                          placeholder="000000"
                        />
                        {otpError && (
                          <p className="text-error text-xs mt-2 text-center font-bold">
                            {otpError}
                          </p>
                        )}
                      </div>

                      {/* Expiry count-down */}
                      <div className="text-center py-2 bg-black/5 rounded-xl border border-white/20 text-xs font-semibold text-on-surface-variant">
                        {timeLeft > 0 ? (
                          <p>
                            Code expires in:{' '}
                            <span className="font-bold text-primary font-mono">{formatTime(timeLeft)}</span>
                          </p>
                        ) : (
                          <p className="text-error font-bold">Code expired.</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || otp.length !== 6}
                        className="w-full bg-gradient-primary text-on-primary text-xs py-3.5 rounded-xl shadow-[0_8px_20px_rgba(108,47,0,0.1)] hover:shadow-[0_12px_24px_rgba(108,47,0,0.18)] hover:translate-y-[-1px] active:scale-[0.98] disabled:opacity-50 transition-all duration-300 font-bold uppercase tracking-wider"
                      >
                        {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                      </button>

                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={isLoading}
                        className="w-full text-center text-primary font-bold text-xs hover:underline transition-colors"
                      >
                        Resend OTP Code
                      </button>
                    </form>
                  </motion.div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Login;