import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiPhone } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuthStore } from '../context/authStore';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const { register, verifyOTP, resendOTP, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    role: 'customer',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [otp, setOtp] = useState('');
  const [isOtpStep, setIsOtpStep] = useState(false);

  const validateForm = () => {
    const nextErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[+()\-\s0-9]{7,20}$/;
    const strongPassword = /^(?=.*\d).{8,}$/;

    if (!formData.firstName.trim()) nextErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) nextErrors.lastName = 'Last name is required';
    if (!emailPattern.test(formData.email)) nextErrors.email = 'Enter a valid email address';
    if (!phonePattern.test(formData.phone)) nextErrors.phone = 'Enter a valid phone number';
    if (!strongPassword.test(formData.password)) {
      nextErrors.password = 'Use at least 8 characters with at least one number';
    }
    if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role || 'customer',
      });
      toast.success('OTP sent to your email');
      setIsOtpStep(true);
    } catch (error) {
      const validationMessage = error.response?.data?.errors?.[0]?.msg;
      toast.error(validationMessage || error.response?.data?.error || 'Registration failed');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      setErrors((prev) => ({ ...prev, otp: 'Enter the 6-digit OTP' }));
      return;
    }

    try {
      await verifyOTP(formData.email, otp, formData.role);
      toast.success('Email verified. You can now log in.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.error || 'OTP verification failed');
    }
  };

  const handleResendOTP = async () => {
    try {
      await resendOTP(formData.email, formData.role);
      toast.success('OTP resent to your email');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not resend OTP');
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <Navbar />

      <section className="py-20 px-margin-mobile md:px-margin-desktop min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container rounded-3xl p-8 md:p-16 shadow-lg w-full max-w-lg"
        >
              <h2 className="text-headline-lg text-headline-lg text-primary mb-2">Create Account</h2>
              <p className="text-on-surface-variant text-body-md mb-8">Join the luxury wellness movement</p>

              {!isOtpStep ? (
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label-md font-label-md text-on-surface mb-2">First Name</label>
                    <div className="relative">
                      <FiUser className="absolute left-4 top-4 text-on-surface-variant" size={18} />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface text-on-surface placeholder-on-surface-variant/60 ${errors.firstName ? 'border-error' : 'border-outline'}`}
                        placeholder="Alexander"
                      />
                    </div>
                    {errors.firstName && <p className="mt-2 text-label-sm text-error">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-label-md font-label-md text-on-surface mb-2">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface text-on-surface placeholder-on-surface-variant/60 ${errors.lastName ? 'border-error' : 'border-outline'}`}
                      placeholder="Sterling"
                    />
                    {errors.lastName && <p className="mt-2 text-label-sm text-error">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-2">Email Address</label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-4 text-on-surface-variant" size={18} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface text-on-surface placeholder-on-surface-variant/60 ${errors.email ? 'border-error' : 'border-outline'}`}
                      placeholder="alex@residence.com"
                    />
                  </div>
                  {errors.email && <p className="mt-2 text-label-sm text-error">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-2">Phone Number</label>
                  <div className="relative">
                    <FiPhone className="absolute left-4 top-4 text-on-surface-variant" size={18} />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface text-on-surface placeholder-on-surface-variant/60 ${errors.phone ? 'border-error' : 'border-outline'}`}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  {errors.phone && <p className="mt-2 text-label-sm text-error">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-2">Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-4 text-on-surface-variant" size={18} />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface text-on-surface placeholder-on-surface-variant/60 ${errors.password ? 'border-error' : 'border-outline'}`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && <p className="mt-2 text-label-sm text-error">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-2">Confirm Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-4 text-on-surface-variant" size={18} />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface text-on-surface placeholder-on-surface-variant/60 ${errors.confirmPassword ? 'border-error' : 'border-outline'}`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.confirmPassword && <p className="mt-2 text-label-sm text-error">{errors.confirmPassword}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-on-primary py-3 rounded-xl font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Creating Account...' : 'CREATE ACCOUNT'}
                </button>
              </form>
              ) : (
              <form onSubmit={handleVerifyOTP} noValidate className="space-y-6">
                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-2">Verification OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => {
                      setOtp(event.target.value.replace(/\D/g, ''));
                      setErrors((prev) => ({ ...prev, otp: '' }));
                    }}
                    className={`w-full px-4 py-3 border rounded-xl text-center tracking-[0.5em] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface text-on-surface placeholder-on-surface-variant/60 ${errors.otp ? 'border-error' : 'border-outline'}`}
                    placeholder="000000"
                  />
                  {errors.otp && <p className="mt-2 text-label-sm text-error">{errors.otp}</p>}
                  <p className="mt-3 text-body-sm text-on-surface-variant">
                    We sent a 6-digit code to {formData.email}.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-on-primary py-3 rounded-xl font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'VERIFY ACCOUNT'}
                </button>

                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="w-full px-6 py-3 border border-outline rounded-xl font-label-md text-label-md text-primary hover:bg-surface-container-low transition disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </form>
              )}

              <div className="mt-8 pt-8 border-t border-outline">
                <p className="text-center text-body-md text-on-surface-variant">
                  Already a member?{' '}
                  <Link to="/login" className="text-primary font-label-md hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Register;
