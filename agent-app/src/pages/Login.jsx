import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiLock, FiArrowRight, FiShield } from 'react-icons/fi';
import { useAuthStore } from '../context/authStore';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('session_expired') === 'true';

  const { login, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    agentId: '',
    passcode: '',
  });

  useEffect(() => {
    if (sessionExpired) {
      toast.error('Your session has expired. Please log in again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [sessionExpired]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.agentId || !formData.passcode) {
      toast.error('Agent ID and Passcode are required');
      return;
    }

    try {
      await login(formData.agentId, formData.passcode);
      toast.success('Agent workspace calibrated!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#f7faf7] flex flex-col items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/3 rounded-full blur-3xl"></div>
      </div>

      <section className="relative z-10 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full bg-white/40 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,106,104,0.06)]"
        >
          {/* Logo Brand Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-10 overflow-hidden flex items-center mb-2">
              <img 
                src="/logos/filternest_wordmark.png" 
                alt="FilterNest" 
                className="h-[120px] w-auto mt-[-35px] mb-[-45px] object-contain mix-blend-multiply"
              />
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">AGENT PORTAL</span>
            <p className="text-[10px] font-black text-secondary tracking-widest uppercase text-center flex items-center gap-1.5">
              <FiShield size={12} className="text-primary" /> Field Workforce Access
            </p>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-primary mb-1">Agent Sign In</h2>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                Enter your Agent ID and passcode to access your workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Agent ID */}
              <div>
                <label className="block text-[11px] font-bold text-primary mb-1.5 uppercase tracking-wide">
                  Agent ID
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 transition-colors group-focus-within:text-primary">
                    <FiUser size={16} />
                  </span>
                  <input
                    type="text"
                    name="agentId"
                    value={formData.agentId}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    placeholder="Enter Agent ID (e.g. AG000001)"
                    className="w-full pl-11 pr-4 py-3 bg-white/70 backdrop-blur-md border border-outline-variant/30 rounded-xl text-sm text-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all duration-300 placeholder-on-surface-variant/40 shadow-sm"
                  />
                </div>
              </div>

              {/* Passcode */}
              <div>
                <label className="block text-[11px] font-bold text-primary mb-1.5 uppercase tracking-wide">
                  Passcode
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 transition-colors group-focus-within:text-primary">
                    <FiLock size={16} />
                  </span>
                  <input
                    type="password"
                    name="passcode"
                    value={formData.passcode}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-white/70 backdrop-blur-md border border-outline-variant/30 rounded-xl text-sm text-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all duration-300 placeholder-on-surface-variant/40 shadow-sm"
                  />
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline">
                  Forgot Passcode?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-primary text-on-primary text-xs py-3.5 rounded-xl shadow-[0_8px_20px_rgba(0,106,104,0.1)] hover:shadow-[0_12px_24px_rgba(0,106,104,0.18)] hover:translate-y-[-1px] active:scale-[0.98] disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2 font-bold uppercase tracking-wider"
              >
                {isLoading ? 'Authenticating...' : 'Access Workspace'}
                {!isLoading && <FiArrowRight size={16} />}
              </button>
            </form>

            {/* Apply for Technician Access */}
            <div className="pt-4 border-t border-outline-variant/10 text-center space-y-2">
              <p className="text-on-surface-variant/80 text-xs font-semibold tracking-wide">
                Want to join FilterNest as a technician?
              </p>
              <div className="pt-1">
                <Link 
                  to="/technician-application" 
                  className="inline-block px-6 py-2.5 bg-gradient-primary text-on-primary rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm hover:translate-y-[-1px] active:scale-[0.98] transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                >
                  Apply for Technician Access
                </Link>
              </div>
            </div>

            {/* Info */}
            <div className="text-center pt-2">
              <p className="text-[10px] text-on-surface-variant/75 leading-relaxed">
                Your Agent ID and passcode were provided during onboarding. Contact admin support if you need assistance.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Footer branding */}
        <p className="text-center text-[10px] text-on-surface-variant/60 mt-6 font-medium">
          © 2024 FilterNest · Agent Portal
        </p>
      </section>
    </div>
  );
};

export default Login;
