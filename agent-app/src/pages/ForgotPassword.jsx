import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiArrowLeft, FiCheckCircle, FiShield } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email, userType });
      setIsSubmitted(true);
      toast.success('Security link dispatched successfully.');
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(error.response?.data?.error || 'Failed to dispatch reset request');
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
              <FiShield className="text-primary animate-pulse" /> Security Identity Vault
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-primary mb-1">Forgot Password</h2>
                  <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                    Confirm your registration type and email, and we'll dispatch a secure recovery link.
                  </p>
                </div>

                {/* Role selection tab */}
                <div className="grid grid-cols-3 gap-1 mb-6 p-1 bg-[#efeeeb]/60 backdrop-blur-md rounded-2xl border border-outline-variant/15">
                  {['customer', 'agent', 'admin'].map((type) => {
                    const isSelected = userType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setUserType(type)}
                        disabled={isLoading}
                        className={`relative z-10 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 ${
                          isSelected 
                            ? 'text-on-primary font-bold' 
                            : 'text-on-surface-variant hover:text-primary font-medium'
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="forgotRoleTab"
                            className="absolute inset-0 z-[-1] bg-gradient-primary rounded-xl shadow-[0_4px_12px_rgba(108,47,0,0.1)]"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    );
                  })}
                </div>

                {/* Form inputs */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-primary mb-2 tracking-wide uppercase">
                      Email Address
                    </label>
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 transition-colors group-focus-within:text-primary">
                        <FiMail size={16} />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        placeholder="you@example.com"
                        className="w-full pl-12 pr-4 py-3.5 bg-white/70 backdrop-blur-md border border-outline-variant/30 rounded-xl text-sm text-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all duration-300 placeholder-on-surface-variant/40 shadow-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-primary text-on-primary text-xs py-4 rounded-xl shadow-[0_8px_20px_rgba(108,47,0,0.12)] hover:shadow-[0_12px_24px_rgba(108,47,0,0.2)] hover:translate-y-[-2px] active:scale-[0.98] disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2 font-bold uppercase tracking-wider"
                  >
                    {isLoading ? 'Requesting Link...' : 'Dispatch Reset Link'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline transition-all"
                  >
                    <FiArrowLeft size={14} /> Back to Login
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center py-6 space-y-4"
              >
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                  >
                    <FiCheckCircle className="text-secondary" size={64} />
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-primary">Check Your Email</h3>
                  <p className="text-sm text-on-surface-variant font-medium leading-relaxed max-w-sm mx-auto">
                    A secure recovery dispatch link has been transmitted to <span className="font-bold text-primary">{email}</span>.
                  </p>
                </div>

                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-xs text-on-surface-variant/80 text-left space-y-1">
                  <p className="font-bold text-primary mb-1">🔐 Next Steps & Details:</p>
                  <p>• The reset link remains valid for only <strong>15 minutes</strong>.</p>
                  <p>• For safety, it is <strong>one-time use only</strong>.</p>
                  <p>• Check your spam/junk folder if the email does not land shortly.</p>
                </div>

                <Link
                  to="/login"
                  className="inline-block w-full bg-gradient-primary text-on-primary text-xs py-3.5 rounded-xl font-bold uppercase tracking-wider shadow-sm hover:translate-y-[-1px] transition-all"
                >
                  Return to Login
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default ForgotPassword;
