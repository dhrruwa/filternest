import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LocationPicker from '../components/LocationPicker';
import { bookingService, customerService } from '../services/services';
import { useAuthStore } from '../context/authStore';
import toast from 'react-hot-toast';
import { FiMapPin } from 'react-icons/fi';

// Custom Elegant Vector SVGs for Services (transparent background, professional outlines)
const GeneralServiceIcon = () => (
  <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3-3a1 1 0 0 0 0-1.4l-1.6-1.6a1 1 0 0 0-1.4 0l-3 3z" />
    <path d="M16 8l-6 6M4 20l6-6" />
    <path d="M14.5 14.5L9 9M5.5 18.5l-2 2a1.5 1.5 0 0 0 2 2l2-2" />
  </svg>
);

const PrefilterIcon = () => (
  <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="5" width="6" height="14" rx="1.5" fill="currentColor" fillOpacity="0.15" />
    <path d="M12 2v3M12 19v3M15 8H9M15 12H9M15 16H9" />
    <path d="M20 7.5a8 8 0 0 0-4.5-5M4 16.5a8 8 0 0 0 4.5 5" />
    <path d="M21 4v4h-4M3 20v-4h4" />
  </svg>
);

const MembraneIcon = () => (
  <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C12 2 6 8.5 6 13c0 3.3 2.7 6 6 6s6-2.7 6-6c0-4.5-6-11-6-11z" fill="currentColor" fillOpacity="0.15" />
    <path d="M4 14h16M4 11h16M4 17h16" strokeDasharray="2 2" />
    <path d="M12 8v10" />
  </svg>
);

const InstallationIcon = () => (
  <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="7" y="3" width="10" height="15" rx="2" fill="currentColor" fillOpacity="0.15" />
    <path d="M12 6h2M12 9h2M10 18v3h4" />
    <path d="M7 14h10" />
    <path d="M17 11h2.5c.8 0 1.5.7 1.5 1.5v1c0 .8-.7 1.5-1.5 1.5H17" />
  </svg>
);

const RepairIcon = () => (
  <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3-3a1 1 0 0 0 0-1.4l-1.6-1.6a1 1 0 0 0-1.4 0l-3 3z" />
    <path d="M16 8l-6 6M4 20l6-6" />
    <path d="M14.5 14.5L9 9M5.5 18.5l-2 2a1.5 1.5 0 0 0 2 2l2-2" />
    <path d="M14.7 9.3l-2.4 2.4" />
  </svg>
);

const BookService = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  // Static Services with Icons and Descriptions
  const services = [
    {
      id: 1,
      value: 'general_service',
      name: 'General Service',
      price: 200,
      icon: <GeneralServiceIcon />,
      desc: 'Complete inspection, interior sanitization, and basic performance tuning.',
    },
    {
      id: 2,
      value: 'prefilter_replacement',
      name: 'Pre-filter Replacement',
      price: 250,
      icon: <PrefilterIcon />,
      desc: 'Replacing external filter elements to keep large sediment away from vital components.',
    },
    {
      id: 3,
      value: 'membrane_replacement',
      name: 'Membrane Replacement',
      price: 700,
      icon: <MembraneIcon />,
      desc: 'Replacing key RO/UV membrane modules to ensure total microbiological purity.',
    },
    {
      id: 4,
      value: 'installation',
      name: 'Installation',
      price: 500,
      icon: <InstallationIcon />,
      desc: 'Secure wall-mounting, customized plumbing alignments, and initial system calibrations.',
    },
    {
      id: 5,
      value: 'repair',
      name: 'Repair Service',
      price: 500,
      icon: <RepairIcon />,
      desc: 'Targeted expert troubleshooting for leakages, motor noise, electrical issues, or low pressure.',
    },
  ];

  const [formData, setFormData] = useState({
    serviceType: '',
    bookingDate: '',
    address: '',
    landmark: '',
    latitude: null,
    longitude: null,
    city: '',
    state: '',
    pincode: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  // Check Login & Load Default Address
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchDefaultAddress = async () => {
      try {
        const res = await customerService.getProfile();
        const profile = res.data;
        if (profile && profile.address && profile.address.street) {
          setFormData((prev) => ({
            ...prev,
            address: profile.address.street || '',
            city: profile.address.city || '',
            state: profile.address.state || '',
            pincode: profile.address.pincode || '',
            latitude: profile.location?.coordinates?.[1] || null,
            longitude: profile.location?.coordinates?.[0] || null,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch profile for default address:', err);
      }
    };
    fetchDefaultAddress();

    // Auto-select service from Book Now button
    if (location.state?.selectedService) {
      setFormData((prev) => ({
        ...prev,
        serviceType: services.find((service) => service.name === location.state.selectedService || service.value === location.state.selectedService)?.value || location.state.selectedService,
      }));
    }
  }, [user, navigate, location.state]);

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle Location Selection from Map
  const handleSelectLocation = (locationData) => {
    setFormData((prev) => ({
      ...prev,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      address: locationData.address,
      city: locationData.city,
      state: locationData.state,
      pincode: locationData.pincode,
    }));
    toast.success('Location selected successfully');
  };

  // Submit Booking
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.serviceType) {
      toast.error('Please select a service');
      return;
    }

    if (!formData.bookingDate) {
      toast.error('Please select booking date & time');
      return;
    }

    if (!formData.address) {
      toast.error('Please enter your address');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      toast.error('Please enable location services and pin your address');
      return;
    }

    try {
      setIsLoading(true);

      await bookingService.createBooking({
        serviceType: formData.serviceType,
        bookingDate: formData.bookingDate,
        address: formData.address,
        landmark: formData.landmark,
        latitude: formData.latitude,
        longitude: formData.longitude,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      });

      toast.success('Booking created successfully!');
      navigate('/my-bookings');
    } catch (error) {
      console.log(error);

      toast.error(
        error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create booking'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const selectedServiceObj = services.find((s) => s.value === formData.serviceType);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-on-surface">
      <Navbar />

      {/* Hero Header Section */}
      <section className="pt-24 pb-8 px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-headline-xl text-headline-xl text-primary mb-4 text-shadow-subtle">
            Schedule Excellence
          </h1>
          <p className="text-on-surface-variant max-w-2xl mx-auto text-body-lg">
            Experience meticulous care tailored specifically for your residential water system. FilterNest technicians are background checked and fully certified.
          </p>
        </motion.div>
      </section>

      {/* Booking Layout Grid */}
      <section className="pb-24 px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
          
          {/* Main Booking Form */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-card p-6 md:p-10 rounded-3xl"
            >
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Visual Service Selection */}
                <div>
                  <h3 className="block text-xs font-semibold uppercase tracking-wider text-[#753401] mb-4">
                    1. Select Service Type *
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => {
                      const isSelected = formData.serviceType === service.value;
                      return (
                        <motion.div
                          key={service.id}
                          whileHover={{ y: -4, scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setFormData((prev) => ({ ...prev, serviceType: service.value }))}
                          className={`cursor-pointer p-5 rounded-2xl border-2 transition-all duration-300 ${
                            isSelected
                              ? 'border-primary bg-secondary-container/20 shadow-md ring-2 ring-primary/10'
                              : 'border-outline-variant/30 bg-surface-container-low hover:border-outline/50 hover:bg-surface-container'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-surface rounded-xl shadow-sm w-16 h-16 flex items-center justify-center border border-outline-variant/10 text-primary">
                              {service.icon}
                            </div>
                            <div className="flex-grow">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-on-surface">{service.name}</h4>
                                <span className="text-primary font-bold">₹{service.price}</span>
                              </div>
                              <p className="text-[11px] text-on-surface-variant mt-1.5 leading-relaxed">
                                {service.desc}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Scheduling Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-outline-variant/20">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#753401] mb-2">
                      2. Preferred Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="bookingDate"
                      value={formData.bookingDate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3.5 border border-outline-variant rounded-xl 
                      focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                      bg-surface-container-lowest text-on-surface transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#753401] mb-2">
                      3. Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleChange}
                      placeholder="e.g. Near City Park"
                      className="w-full px-4 py-3.5 border border-outline-variant rounded-xl 
                      focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                      bg-surface-container-lowest text-on-surface transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Service Location Selector */}
                <div className="pt-6 border-t border-outline-variant/20">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#753401] mb-3">
                    4. Service Location *
                  </label>

                  <button
                    type="button"
                    onClick={() => setLocationPickerOpen(true)}
                    className="w-full px-5 py-5 border-2 border-dashed border-outline-variant rounded-2xl 
                    hover:border-primary hover:bg-secondary-container/10 transition-all duration-300
                    bg-surface-container-lowest text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform">
                        map
                      </span>
                      <div>
                        {formData.latitude && formData.longitude ? (
                          <div>
                            <p className="text-on-surface font-semibold">{formData.address}</p>
                            <p className="text-xs text-on-surface-variant mt-1">
                              {formData.city && formData.state 
                                ? `${formData.city}, ${formData.state}${formData.pincode ? ' ' + formData.pincode : ''}`
                                : `Coordinates: ${formData.latitude?.toFixed(4)}, ${formData.longitude?.toFixed(4)}`
                              }
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-on-surface font-semibold">Select Location on Map</p>
                            <p className="text-xs text-on-surface-variant mt-1">Pin your exact service location for our agents</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-primary text-xl font-bold group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>

                {/* Verified Location Box */}
                {formData.latitude && formData.longitude && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-secondary-container/20 border border-outline-variant/40 rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-primary">verified</span>
                      <h3 className="font-semibold text-primary">
                        Location Confirmed
                      </h3>
                    </div>

                    <div className="space-y-2 text-sm text-on-surface-variant">
                      <p><span className="font-medium text-on-surface">Address:</span> {formData.address}</p>
                      {formData.city && <p><span className="font-medium text-on-surface">City:</span> {formData.city}</p>}
                      {formData.state && <p><span className="font-medium text-on-surface">State:</span> {formData.state}</p>}
                      {formData.pincode && <p><span className="font-medium text-on-surface">Pincode:</span> {formData.pincode}</p>}
                      <p className="text-xs opacity-75 pt-2">
                        Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLocationPickerOpen(true)}
                      className="mt-4 w-full text-sm text-primary font-semibold hover:text-[#8b4513] py-2.5 border border-outline rounded-xl hover:bg-secondary-container/40 transition-all duration-300"
                    >
                      Change Location
                    </button>
                  </motion.div>
                )}

                {/* Action Submit */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-[#853a01] text-on-primary py-4.5 rounded-xl font-semibold text-lg
                    transition-all duration-300 shadow-md hover:shadow-xl active:scale-95 disabled:opacity-50
                    flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                        Booking Your Service...
                      </>
                    ) : (
                      'Confirm & Book Service'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>

          {/* Sticky Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="glass-card p-6 md:p-8 rounded-3xl border border-outline-variant/40"
              >
                <h3 className="font-headline-md text-headline-md text-primary mb-6 pb-4 border-b border-outline-variant/40">
                  Booking Summary
                </h3>

                {selectedServiceObj ? (
                  <div className="space-y-6">
                    {/* Selected Service */}
                    <div className="flex items-start gap-4">
                      <span className="p-2 bg-surface-bright rounded-xl shadow-sm border border-outline-variant/20 w-11 h-11 flex items-center justify-center text-primary">
                        {selectedServiceObj.icon}
                      </span>
                      <div className="flex-grow">
                        <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">Selected Service</p>
                        <h4 className="font-semibold text-on-surface">
                          {selectedServiceObj.name}
                        </h4>
                      </div>
                    </div>

                    {/* Appointment Date */}
                    <div className="flex items-start gap-4">
                      <span className="material-symbols-outlined text-primary text-xl">
                        calendar_today
                      </span>
                      <div className="flex-grow">
                        <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">Date & Time</p>
                        <p className="font-medium text-sm text-on-surface">
                          {formData.bookingDate 
                            ? new Date(formData.bookingDate).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })
                            : 'Not selected yet'}
                        </p>
                      </div>
                    </div>

                    {/* Verified Address */}
                    <div className="flex items-start gap-4">
                      <span className="material-symbols-outlined text-primary text-xl">
                        pin_drop
                      </span>
                      <div className="flex-grow">
                        <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">Service Address</p>
                        <p className="text-xs font-medium text-on-surface line-clamp-3 leading-relaxed">
                          {formData.address || 'Not selected yet'}
                        </p>
                      </div>
                    </div>

                    {/* Pricing Details */}
                    <div className="pt-4 border-t border-outline-variant/40 space-y-2">
                      <div className="flex justify-between text-sm text-on-surface-variant">
                        <span>Service Charge</span>
                        <span>₹{selectedServiceObj.price}</span>
                      </div>
                      <div className="flex justify-between text-sm text-on-surface-variant">
                        <span>Taxes (GST 18%)</span>
                        <span>₹{(selectedServiceObj.price * 0.18).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg text-primary pt-2 border-t border-dashed border-outline-variant/30">
                        <span>Total Estimate</span>
                        <span>₹{(selectedServiceObj.price * 1.18).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl text-outline mb-2">
                      shopping_bag
                    </span>
                    <p className="text-xs leading-relaxed max-w-[200px] mx-auto">
                      Select a water purifier service to view estimated charges and billing.
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Safety & Trust Badges */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-surface-container-low border border-outline-variant/20 p-6 rounded-2xl space-y-4"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">shield</span>
                  <div>
                    <h5 className="text-xs font-semibold text-on-surface">FilterNest Guarantee</h5>
                    <p className="text-[10px] text-on-surface-variant">100% certified components & spares</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">workspace_premium</span>
                  <div>
                    <h5 className="text-xs font-semibold text-on-surface">Expert Professionals</h5>
                    <p className="text-[10px] text-on-surface-variant">Background checked & certified technicians</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

        </div>
      </section>

      <LocationPicker
        isOpen={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onSelectLocation={handleSelectLocation}
        initialLocation={
          formData.latitude && formData.longitude
            ? { latitude: formData.latitude, longitude: formData.longitude }
            : null
        }
      />

      <Footer />
    </div>
  );
};

export default BookService;
