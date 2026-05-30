import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiCheck, FiX, FiShield, FiAlertTriangle } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('userType') || 'customer';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Real-time strength criteria
  const [strength, setStrength] = useState({
    length: false,
    uppercase: false,
    number: false,
    symbol: false,
  });

  useEffect(() => {
    setStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const isStrong = Object.values(strength).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isStrong) {
      toast.error('Password does not meet the secure enterprise requirements');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: password,
        userType,
      });

      setIsCompleted(true);
      toast.success('Your credentials have been securely updated');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.error || 'Verification or update failed. Reset link may have expired.');
    } finally {
      setIsLoading(false);
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
          className="w-full max-w-md bg-white/40 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 shadow-[0_20px_50px_rgba(108,47,0,0.06)]"
        >
          {/* Brand Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="h-10 overflow-hidden flex items-center mb-1">
              <img 
                src="/logos/filternest_wordmark.png" 
                alt="FilterNest" 
                className="h-[120px] w-auto mt-[-35px] mb-[-45px] object-contain mix-blend-multiply"
              />
            </div>
            <p className="text-[10px] font-black text-secondary tracking-widest uppercase text-center flex items-center gap-1">
              <FiShield className="text-primary animate-pulse" /> Secure Credentials Reset
            </p>
          </div>

          {!isCompleted ? (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-primary mb-1">Create New Password</h2>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                  Enter a strong, secure password. All other active devices will be automatically signed out.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-primary mb-1.5 tracking-wide uppercase">
                    New Password
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 transition-colors group-focus-within:text-primary">
                      <FiLock size={16} />
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3 bg-white/70 backdrop-blur-md border border-outline-variant/30 rounded-xl text-sm text-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-primary mb-1.5 tracking-wide uppercase">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 transition-colors group-focus-within:text-primary">
                      <FiLock size={16} />
                    </span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3 bg-white/70 backdrop-blur-md border border-outline-variant/30 rounded-xl text-sm text-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Password Strength Checklist Indicator */}
                <div className="p-4 bg-black/5 rounded-2xl border border-white/30 space-y-2 text-[11px] text-on-surface-variant font-medium">
                  <p className="font-bold text-xs text-primary mb-1">🔐 Secure Password Requirements:</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5">
                      {strength.length ? (
                        <FiCheck className="text-secondary font-bold" />
                      ) : (
                        <FiX className="text-error" />
                      )}
                      <span className={strength.length ? 'text-primary font-bold' : ''}>At least 8 characters</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {strength.uppercase ? (
                        <FiCheck className="text-secondary font-bold" />
                      ) : (
                        <FiX className="text-error" />
                      )}
                      <span className={strength.uppercase ? 'text-primary font-bold' : ''}>Uppercase letter</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {strength.number ? (
                        <FiCheck className="text-secondary font-bold" />
                      ) : (
                        <FiX className="text-error" />
                      )}
                      <span className={strength.number ? 'text-primary font-bold' : ''}>At least one digit</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {strength.symbol ? (
                        <FiCheck className="text-secondary font-bold" />
                      ) : (
                        <FiX className="text-error" />
                      )}
                      <span className={strength.symbol ? 'text-primary font-bold' : ''}>Special character</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !isStrong || password !== confirmPassword}
                  className="w-full bg-gradient-primary text-on-primary text-xs py-3.5 rounded-xl shadow-[0_8px_20px_rgba(108,47,0,0.1)] hover:shadow-[0_12px_24px_rgba(108,47,0,0.18)] hover:translate-y-[-1px] active:scale-[0.98] disabled:opacity-40 transition-all duration-300 font-bold uppercase tracking-wider"
                >
                  {isLoading ? 'Encrypting Credentials...' : 'Secure & Update Password'}
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-secondary/15 rounded-full flex items-center justify-center border border-secondary/20 text-secondary">
                  <FiCheck size={32} />
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-primary">Update Successful</h3>
                <p className="text-xs text-on-surface-variant font-medium">
                  Your credentials have been securely refreshed. Redirecting you to login...
                </p>
              </div>

              <div className="p-3 bg-error/5 border border-error/10 text-[10px] text-error font-medium rounded-xl flex items-center gap-2 text-left">
                <FiAlertTriangle size={16} className="shrink-0" />
                <span>Notice: All other active session tracking credentials have been fully cleared and invalidated.</span>
              </div>
            </div>
          )}
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default ResetPassword;
