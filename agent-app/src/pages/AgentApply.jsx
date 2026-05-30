import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiCreditCard, 
  FiFileText, FiUploadCloud, FiTrash2, FiCamera, 
  FiCheckCircle, FiInfo, FiChevronRight, FiCheck
} from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { authService } from '../services/services';
import toast from 'react-hot-toast';

const AgentApply = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    aadharNumber: '',
    panNumber: '',
    licenseNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    profileImage: ''
  });

  // UI/Upload States
  const [errors, setErrors] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filePreview, setFilePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Success states
  const [isSuccess, setIsSuccess] = useState(false);
  const [successAgentId, setSuccessAgentId] = useState('');

  // Handle Text Inputs
  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Handle Nested Address Inputs
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [name]: value }
    }));
    setErrors(prev => ({ ...prev, [`address.${name}`]: '' }));
  };

  // Formatting Aadhaar: XXXX XXXX XXXX
  const handleAadhaarChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 12);
    const formatted = rawVal.replace(/(\d{4})(?=\d)/g, '$1 ');
    setFormData(prev => ({ ...prev, aadharNumber: formatted }));
    setErrors(prev => ({ ...prev, aadharNumber: '' }));
  };

  // Formatting PAN: ABCDE1234F (Uppercased)
  const handlePanChange = (e) => {
    const val = e.target.value.toUpperCase().trim().slice(0, 10);
    setFormData(prev => ({ ...prev, panNumber: val }));
    setErrors(prev => ({ ...prev, panNumber: '' }));
  };

  // Drag and Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processImageUpload(files[0]);
    }
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      await processImageUpload(files[0]);
    }
  };

  // Profile Image Upload & Compression
  const processImageUpload = async (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPG, PNG, and WEBP are supported.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB luxury limit.');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('avatar', file);

    setIsUploading(true);
    setUploadProgress(10);

    // Simulate progress while sharp compresses it on backend
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 150);

    try {
      const response = await authService.uploadAgentAvatar(uploadData);
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setFormData(prev => ({ ...prev, profileImage: response.data.avatarUrl }));
      setFilePreview(response.data.avatarUrl);
      toast.success('Profile avatar compressed & secured!');
    } catch (err) {
      clearInterval(progressInterval);
      toast.error(err.response?.data?.error || 'Failed to process avatar upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFilePreview('');
    setFormData(prev => ({ ...prev, profileImage: '' }));
  };

  // Client-side Validation
  const validateForm = () => {
    const nextErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanAadhaar = formData.aadharNumber.replace(/\s/g, '');

    if (!formData.firstName.trim()) nextErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) nextErrors.lastName = 'Last name is required';
    if (!emailPattern.test(formData.email)) nextErrors.email = 'Enter a valid email address';
    if (formData.phone.replace(/\D/g, '').length !== 10) {
      nextErrors.phone = 'Valid 10-digit mobile number required';
    }
    if (cleanAadhaar.length !== 12) {
      nextErrors.aadharNumber = 'Aadhaar must contain exactly 12 digits';
    }
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panPattern.test(formData.panNumber)) {
      nextErrors.panNumber = 'Enter valid PAN (format: ABCDE1234F)';
    }
    if (!formData.address.street.trim()) nextErrors['address.street'] = 'Street address is required';
    if (!formData.address.city.trim()) nextErrors['address.city'] = 'City is required';
    if (!formData.address.state.trim()) nextErrors['address.state'] = 'State is required';
    if (formData.address.pincode.replace(/\D/g, '').length !== 6) {
      nextErrors['address.pincode'] = 'Pincode must be exactly 6 digits';
    }
    if (!formData.profileImage) {
      nextErrors.profileImage = 'Profile avatar photo is mandatory';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Submit Application
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please resolve the highlighted application blocks.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.applyAgent(formData);
      setSuccessAgentId(response.data.agentId);
      setIsSuccess(true);
      toast.success('Technician request submitted!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#faf9f6] min-h-screen flex flex-col justify-between">
      <Navbar />

      <section className="relative py-16 px-4 md:px-8 flex-grow flex items-center justify-center">
        {/* Dynamic Wave Backgrounds */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <img 
            src="/images/hero_kitchen_scene.png" 
            alt="" 
            className="w-full h-full object-cover blur-[5px] scale-[1.02] opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#faf9f6]/90 via-[#faf9f6]/70 to-[#faf9f6]/95" />
        </div>

        <div className="relative z-10 w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_20px_50px_rgba(108,47,0,0.05)]"
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <span className="inline-block px-3.5 py-1 rounded bg-[#f3e2ac]/80 text-[#706439] font-bold text-[10px] uppercase tracking-widest mb-3">
                    Care Specialist Program
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight">
                    Technician Registration Portal
                  </h2>
                  <p className="text-xs text-on-surface-variant font-medium mt-1 leading-relaxed max-w-md mx-auto">
                    Submit your credentials to apply as a certified FilterNest home water technician.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Avatar Uploader */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-secondary uppercase tracking-wider pl-1 flex items-center gap-1">
                      <FiCamera className="text-primary" /> Profile Photo *
                    </label>

                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative overflow-hidden cursor-pointer border-2 border-dashed rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5 transition-all duration-300 bg-white/80 ${
                        isDragging 
                          ? 'border-primary bg-primary/5 scale-[1.01] shadow-md' 
                          : errors.profileImage 
                            ? 'border-red-400 hover:border-red-500'
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

                      {/* circular image slot */}
                      <div className="relative w-20 h-20 rounded-full flex-shrink-0 border-4 border-[#faf9f6] shadow-md bg-slate-50 flex items-center justify-center overflow-hidden group">
                        {filePreview ? (
                          <img src={filePreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-slate-400 flex flex-col items-center">
                            <FiUploadCloud size={24} className="text-slate-400" />
                          </div>
                        )}
                        {isUploading && (
                          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent border-white" />
                          </div>
                        )}
                      </div>

                      {/* Info & Controls */}
                      <div className="flex-1 text-center sm:text-left space-y-1 w-full">
                        <h5 className="font-bold text-xs text-slate-800">
                          {filePreview ? 'Change Profile Picture' : 'Upload Candidate Photo'}
                        </h5>
                        <p className="text-[11px] text-slate-500">
                          Drag and drop here, or <span className="text-primary font-bold hover:underline">click to browse</span>.
                        </p>
                        <p className="text-[9px] text-slate-400">
                          Max size 5MB. Progressive square crops are optimized natively.
                        </p>

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

                        {filePreview && !isUploading && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                            className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-650 font-bold text-[10px] rounded-lg transition-all flex items-center gap-1 mx-auto sm:ml-0 mt-2 border border-red-200"
                          >
                            <FiTrash2 size={11} /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                    {errors.profileImage && (
                      <p className="text-[10px] text-red-600 font-bold pl-1 flex items-center gap-1 mt-1">
                        <FiInfo size={12} /> {errors.profileImage}
                      </p>
                    )}
                  </div>

                  {/* Personal Block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-wider pl-1">First Name *</label>
                      <div className="relative">
                        <FiUser className="absolute left-4 top-3.5 text-on-surface-variant" size={16} />
                        <input
                           type="text"
                           name="firstName"
                           value={formData.firstName}
                           onChange={handleTextChange}
                           required
                           placeholder="First name"
                           className="w-full pl-12 pr-4 py-3 border border-[#753401]/10 rounded-xl bg-white/70 focus:outline-none focus:border-primary text-xs font-semibold shadow-sm focus:bg-white"
                        />
                      </div>
                      {errors.firstName && <p className="text-[9px] text-red-600 font-semibold pl-1">{errors.firstName}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-wider pl-1">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleTextChange}
                        required
                        placeholder="Last name"
                        className="w-full px-4 py-3 border border-[#753401]/10 rounded-xl bg-white/70 focus:outline-none focus:border-primary text-xs font-semibold shadow-sm focus:bg-white"
                      />
                      {errors.lastName && <p className="text-[9px] text-red-600 font-semibold pl-1">{errors.lastName}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-wider pl-1">Email Address *</label>
                      <div className="relative">
                        <FiMail className="absolute left-4 top-3.5 text-on-surface-variant" size={16} />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleTextChange}
                          required
                          placeholder="email@example.com"
                          className="w-full pl-12 pr-4 py-3 border border-[#753401]/10 rounded-xl bg-white/70 focus:outline-none focus:border-primary text-xs font-semibold shadow-sm focus:bg-white"
                        />
                      </div>
                      {errors.email && <p className="text-[9px] text-red-600 font-semibold pl-1">{errors.email}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-wider pl-1">Mobile Number *</label>
                      <div className="relative">
                        <FiPhone className="absolute left-4 top-3.5 text-on-surface-variant" size={16} />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                          required
                          placeholder="10-digit phone"
                          className="w-full pl-12 pr-4 py-3 border border-[#753401]/10 rounded-xl bg-white/70 focus:outline-none focus:border-primary text-xs font-semibold shadow-sm focus:bg-white font-mono"
                        />
                      </div>
                      {errors.phone && <p className="text-[9px] text-red-600 font-semibold pl-1">{errors.phone}</p>}
                    </div>
                  </div>

                  {/* Documents Block */}
                  <div className="bg-[#faf9f6] border border-[#753401]/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-[#753401]/5">
                      <FiFileText className="text-primary" size={16} />
                      <span className="text-[11px] font-black text-primary uppercase tracking-wider">KYC Documentations</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#753401]/60 uppercase tracking-wider pl-1">Aadhaar Number *</label>
                        <div className="relative">
                          <FiCreditCard className="absolute left-4 top-3.5 text-[#753401]/40" size={16} />
                          <input
                            type="text"
                            value={formData.aadharNumber}
                            onChange={handleAadhaarChange}
                            required
                            placeholder="XXXX XXXX XXXX"
                            className="w-full pl-12 pr-4 py-3 border border-[#753401]/10 rounded-xl bg-white focus:outline-none focus:border-primary text-xs font-bold shadow-sm font-mono tracking-wider"
                          />
                        </div>
                        {errors.aadharNumber && <p className="text-[9px] text-red-600 font-semibold pl-1">{errors.aadharNumber}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#753401]/60 uppercase tracking-wider pl-1">PAN Number *</label>
                        <div className="relative">
                          <FiFileText className="absolute left-4 top-3.5 text-[#753401]/40" size={16} />
                          <input
                            type="text"
                            value={formData.panNumber}
                            onChange={handlePanChange}
                            required
                            placeholder="ABCDE1234F"
                            className="w-full pl-12 pr-4 py-3 border border-[#753401]/10 rounded-xl bg-white focus:outline-none focus:border-primary text-xs font-black shadow-sm font-mono tracking-widest uppercase"
                          />
                        </div>
                        {errors.panNumber && <p className="text-[9px] text-red-600 font-semibold pl-1">{errors.panNumber}</p>}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#753401]/60 uppercase tracking-wider pl-1">Driving License Number (Optional)</label>
                      <input
                        type="text"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleTextChange}
                        placeholder="DL-XXXXXXXXXXXXX"
                        className="w-full px-4 py-3 border border-[#753401]/10 rounded-xl bg-white focus:outline-none focus:border-primary text-xs font-semibold shadow-sm font-mono"
                      />
                    </div>
                  </div>

                  {/* Address Block */}
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-secondary uppercase tracking-wider pl-1 flex items-center gap-1">
                      <FiMapPin className="text-primary" /> Permanent Home Address *
                    </label>

                    <div className="space-y-3 bg-[#faf9f6] border border-[#753401]/10 rounded-2xl p-5">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#753401]/60 uppercase pl-1">Street Address</label>
                        <input
                          type="text"
                          name="street"
                          value={formData.address.street}
                          onChange={handleAddressChange}
                          required
                          placeholder="Flat/House No., Building Name, Street Area"
                          className="w-full px-4 py-3 border border-[#753401]/10 rounded-xl bg-white focus:outline-none focus:border-primary text-xs font-semibold shadow-sm"
                        />
                        {errors['address.street'] && <p className="text-[9px] text-red-600 font-semibold pl-1">{errors['address.street']}</p>}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1 space-y-1">
                          <label className="text-[9px] font-bold text-[#753401]/60 uppercase pl-1">City</label>
                          <input
                            type="text"
                            name="city"
                            value={formData.address.city}
                            onChange={handleAddressChange}
                            required
                            placeholder="Bangalore"
                            className="w-full px-4 py-3 border border-[#753401]/10 rounded-xl bg-white focus:outline-none focus:border-primary text-xs font-semibold shadow-sm"
                          />
                          {errors['address.city'] && <p className="text-[9px] text-red-600 font-semibold pl-1">{errors['address.city']}</p>}
                        </div>

                        <div className="col-span-1 space-y-1">
                          <label className="text-[9px] font-bold text-[#753401]/60 uppercase pl-1">State</label>
                          <input
                            type="text"
                            name="state"
                            value={formData.address.state}
                            onChange={handleAddressChange}
                            required
                            placeholder="Karnataka"
                            className="w-full px-4 py-3 border border-[#753401]/10 rounded-xl bg-white focus:outline-none focus:border-primary text-xs font-semibold shadow-sm"
                          />
                          {errors['address.state'] && <p className="text-[9px] text-red-600 font-semibold pl-1">{errors['address.state']}</p>}
                        </div>

                        <div className="col-span-1 space-y-1">
                          <label className="text-[9px] font-bold text-[#753401]/60 uppercase pl-1">Pincode</label>
                          <input
                            type="text"
                            name="pincode"
                            value={formData.address.pincode}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setFormData(prev => ({
                                ...prev,
                                address: { ...prev.address, pincode: clean }
                              }));
                            }}
                            required
                            placeholder="560064"
                            className="w-full px-4 py-3 border border-[#753401]/10 rounded-xl bg-white focus:outline-none focus:border-primary text-xs font-bold shadow-sm font-mono"
                          />
                          {errors['address.pincode'] && <p className="text-[9px] text-red-600 font-semibold pl-1">{errors['address.pincode']}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="w-full bg-gradient-primary text-on-primary text-xs py-4 rounded-xl shadow-[0_8px_20px_rgba(108,47,0,0.1)] hover:shadow-[0_12px_24px_rgba(108,47,0,0.18)] hover:translate-y-[-1px] active:scale-[0.98] disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2 font-bold uppercase tracking-wider mt-4 cursor-pointer"
                  >
                    {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                    {!isSubmitting && <FiChevronRight size={15} />}
                  </button>

                  <div className="text-center pt-2">
                    <p className="text-[10px] text-slate-500 font-medium">
                      Already have active credentials?{' '}
                      <Link to="/login" className="text-primary font-bold hover:underline uppercase tracking-wide">
                        Sign In Portal
                      </Link>
                    </p>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_20px_50px_rgba(108,47,0,0.06)] text-center space-y-6"
              >
                {/* Check Animation */}
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-md"
                  >
                    <FiCheck size={36} className="stroke-[3]" />
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <span className="inline-block px-3 py-1 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase tracking-widest">
                    Verification Submitted
                  </span>
                  <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                    Technician Request Filed Successfully
                  </h3>
                </div>

                {/* Read Only Agent ID Card */}
                <div className="bg-[#faf9f6] border border-[#753401]/10 rounded-2xl p-6 max-w-sm mx-auto shadow-inner">
                  <p className="text-[9px] font-black text-[#753401]/60 uppercase tracking-widest">Technician Onboarding ID</p>
                  <p className="text-2xl font-black text-primary font-mono tracking-widest mt-1.5 uppercase leading-none select-all">
                    {successAgentId}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-2 leading-none">
                    Write down or copy your ID for future reference
                  </p>
                </div>

                <div className="max-w-md mx-auto space-y-3">
                  <p className="text-xs text-slate-650 leading-relaxed font-bold">
                    Your technician onboarding request has been submitted successfully.
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Our administration team will review your documents and activate your account shortly.
                  </p>
                  <p className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-100/50 rounded-xl p-3 inline-block">
                    ⚠️ Email Notification: Once approved, you will receive a secure welcome email containing your login portal passcode.
                  </p>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row gap-3 items-center justify-center">
                  <Link
                    to="/login"
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-primary text-on-primary text-xs rounded-xl shadow-md font-bold uppercase tracking-wider hover:opacity-95 cursor-pointer"
                  >
                    Go To Portal
                  </Link>
                  <Link
                    to="/"
                    className="w-full sm:w-auto px-8 py-3.5 bg-slate-100 hover:bg-slate-200 border text-slate-700 text-xs rounded-xl font-bold uppercase tracking-wider shadow-sm"
                  >
                    Return Home
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AgentApply;
