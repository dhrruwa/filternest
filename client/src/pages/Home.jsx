import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiCheck, FiStar, FiShield, FiHeart } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { serviceService, bookingService } from '../services/services';

// 100% Transparent Inline Vector SVGs in Signature Warm Brown (#6c2f00)
const InstallationIcon = () => (
  <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12h10a4 4 0 0 0 4-4V3" />
    <path d="M12 3h8v3h-8z" />
    <path d="M16 12v4" />
    <circle cx="16" cy="19" r="3" />
    <path d="M2 18h8" />
  </svg>
);

const MaintenanceIcon = () => (
  <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="M12 6c-2 2-3 4-3 6a3 3 0 0 0 6 0c0-2-1-4-3-6z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M3 15h18" />
    <path d="M9 3v18" />
    <path d="M15 3v18" />
  </svg>
);
// Static configuration data shifted globally outside the component to prevent TDZ (Temporal Dead Zone) ReferenceErrors
const features = [
  {
    icon: <InstallationIcon />,
    title: 'Architectural Installation',
    description: 'Expert integration of advanced filtration technology into your existing domestic plumbing with structural and physical precision.',
  },
  {
    icon: <MaintenanceIcon />,
    title: 'Quarterly Maintenance',
    description: 'Comprehensive diagnostics, pressure sweeps, and deep cleaning to maintain the pristine wellness of your water supply.',
  },
  {
    icon: <FilterIcon />,
    title: 'Bespoke Replacements',
    description: 'Precisely scheduled genuine filter replacements utilizing high-density carbon blocks and reverse osmosis membranes.',
  },
];

const testimonials = [
  {
    quote: "FilterNest turned our household water supply into a true spa-level wellness experience. The countertop purifier matches our custom wood cabinetry perfectly, and the taste is incomparably pure.",
    author: "Alistair C.",
    location: "Beverly Hills Estate",
    rating: 5,
  },
  {
    quote: "The white-glove technicians integrated our entire reverse osmosis system in a single afternoon. Totally seamless service, clear communication, and incredible water purity index readings.",
    author: "Genevieve R.",
    location: "Central Park Penthouse",
    rating: 5,
  },
  {
    quote: "As a premium residential builder, we specify FilterNest systems in all our high-end projects. Their aesthetics, performance metrics, and customer dashboard represents the absolute gold standard.",
    author: "Marcus T.",
    location: "Luxury Property Developer",
    rating: 5,
  },
];

const Home = () => {
  const [services, setServices] = useState([]);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [publicReviews, setPublicReviews] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await serviceService.getAllServices();
        setServices(response.data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };
    const fetchPublicReviews = async () => {
      try {
        const response = await bookingService.getPublicReviews();
        setPublicReviews(response.data || []);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };
    fetchServices();
    fetchPublicReviews();
  }, []);

  const displayReviews = publicReviews.length > 0 
    ? publicReviews.map(r => ({
        quote: r.feedback?.review || "Excellent service and perfect water filter quality!",
        author: r.customer ? `${r.customer.firstName} ${r.customer.lastName ? r.customer.lastName.charAt(0) + '.' : ''}` : 'Valued Customer',
        location: r.serviceType ? r.serviceType.replace(/_/g, ' ') : 'Sanctuary Purification',
        rating: r.feedback?.rating || 5
      }))
    : testimonials;

  useEffect(() => {
    if (displayReviews.length === 0) return;
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % displayReviews.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [displayReviews.length]);

  return (
    <div className="bg-background min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative -mt-[72px] min-h-[650px] sm:min-h-[750px] lg:min-h-[850px] flex items-center overflow-hidden px-margin-mobile md:px-margin-desktop pt-[136px] sm:pt-[152px] lg:pt-[168px] pb-16 sm:pb-20 lg:pb-24">
        {/* Background Image and Ambient Blending */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero_kitchen_scene.png" 
            alt="FilterNest Sanctuary Countertop" 
            className="w-full h-full object-cover object-[center_right] lg:object-center"
          />
          {/* Linear gradient to ensure text readability on the left without obscuring the kitchen details */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#faf9f6] via-[#faf9f6]/90 sm:via-[#faf9f6]/60 lg:via-transparent to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-max-width mx-auto w-full">
          <div className="max-w-xl sm:max-w-2xl">
            <motion.span 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-3 py-1 rounded bg-[#f3e2ac]/80 text-[#706439] font-label-sm text-label-sm mb-6 tracking-wider uppercase font-semibold"
            >
              REDEFINING WELLNESS
            </motion.span>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-headline-xl text-headline-xl text-[#6c2f00] font-bold leading-[1.15] mb-6"
            >
              Pure Water.<br />
              Pure Living.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-body-md sm:text-body-lg font-body-md text-on-surface-variant mb-10 max-w-lg leading-relaxed"
            >
              Experience the pinnacle of hydration with our architectural purification solutions. Precision engineering meets minimalist design for your sanctuary.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-row gap-4"
            >
              <Link 
                to="/book-service"
                className="bg-primary text-on-primary px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg font-label-md text-label-md shadow-md flex items-center justify-center gap-2 hover:opacity-95 hover:translate-y-[-2px] active:scale-95 transition-all"
              >
                Explore Systems
                <FiArrowRight />
              </Link>
              <Link 
                to="/services"
                className="bg-[#f3e2ac] text-[#6c2f00] px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all font-semibold"
              >
                View Services
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Meticulous Care Section */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto">
        <div className="text-center mb-16">
          <span className="text-label-sm font-label-sm text-secondary uppercase tracking-widest block mb-3">OUR STANDARDS</span>
          <h2 className="text-headline-lg text-headline-lg font-bold text-primary mb-4">Meticulous Care</h2>
          <p className="text-on-surface-variant max-w-xl mx-auto text-body-md font-body-md">
            Delivering absolute precision water engineering backed by our high-end service standards and elite specialist technicians.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="glass-card p-8 rounded-2xl group hover:translate-y-[-8px] transition-all duration-500 flex flex-col justify-between border border-outline-variant/20"
            >
              <div>
                <div className="w-14 h-14 bg-secondary-container/40 rounded-xl flex items-center justify-center mb-8 border border-secondary-container group-hover:scale-105 group-hover:bg-secondary-container transition-all">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-headline-md text-primary mb-4">{feature.title}</h3>
                <p className="text-on-surface-variant mb-8 text-body-md font-body-md leading-relaxed">{feature.description}</p>
              </div>
              <Link 
                to="/services" 
                className="text-primary font-label-md text-label-md flex items-center gap-2 group-hover:gap-3 transition-all mt-auto self-start"
              >
                Learn More <FiArrowRight size={16} />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Services Showcase Preview */}
      <section className="py-24 bg-surface-container-low px-margin-mobile md:px-margin-desktop border-y border-outline-variant/10">
        <div className="max-w-max-width mx-auto">
          <div className="text-center mb-16">
            <span className="text-label-sm font-label-sm text-secondary uppercase tracking-widest block mb-3">CURATED RANGE</span>
            <h2 className="text-headline-lg text-headline-lg font-bold text-primary mb-4">Signature Systems</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto text-body-md font-body-md">
              Discover our premier line-up of home reverse osmosis and high-density purification water systems.
            </p>
          </div>
          
          <div id="services" className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {services.map((service, idx) => (
              <motion.div
                key={service._id || idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="glass-card rounded-2xl p-8 flex flex-col justify-between group border border-outline-variant/20 hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="font-bold text-headline-md text-primary leading-snug">{service.name}</h3>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] uppercase font-bold tracking-wider rounded-full">
                      PREMIUM
                    </span>
                  </div>
                  <p className="text-on-surface-variant mb-6 text-body-md font-body-md line-clamp-3 leading-relaxed">{service.description}</p>
                  
                  {/* Detailed Spec List */}
                  <div className="border-y border-outline-variant/20 py-4 my-6 space-y-2.5">
                    <div className="flex justify-between text-label-sm text-on-surface-variant">
                      <span>Best Suited For</span>
                      <span className="font-semibold text-primary">{idx === 0 ? 'Luxury Penthouses' : idx === 1 ? 'Suburban Estates' : 'Modern Kitchens'}</span>
                    </div>
                    <div className="flex justify-between text-label-sm text-on-surface-variant">
                      <span>Flow Rate</span>
                      <span className="font-semibold text-primary">2.5 Liters/min</span>
                    </div>
                    <div className="flex justify-between text-label-sm text-on-surface-variant">
                      <span>Lifespan</span>
                      <span className="font-semibold text-primary">12-Month RO Core</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline gap-1.5 mb-6">
                    <span className="text-[12px] font-label-md text-on-surface-variant">Base Rate</span>
                    <span className="text-3xl font-bold text-primary">₹{service.basePrice}</span>
                  </div>
                  <Link
                    to="/book-service"
                    className="block text-center w-full px-6 py-3.5 bg-primary text-on-primary rounded-xl font-label-md text-label-md hover:opacity-90 active:scale-98 transition-all shadow-md"
                  >
                    Schedule Service
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Verified Endorsements Carousel */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto text-center">
        <div className="mb-10 flex justify-center gap-1.5 text-[#6c2f00]">
          {[...Array(5)].map((_, i) => (
            <FiStar 
              key={i} 
              size={18} 
              fill={i < (displayReviews[activeTestimonial]?.rating || 5) ? "currentColor" : "none"} 
            />
          ))}
        </div>
        
        <div className="min-h-[220px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {displayReviews.length > 0 && displayReviews[activeTestimonial] && (
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="px-4"
              >
                <p className="text-2xl lg:text-3xl font-medium text-primary leading-normal italic font-headline-lg mb-8">
                  "{displayReviews[activeTestimonial].quote}"
                </p>
                <div>
                  <p className="font-bold text-label-md text-primary tracking-wide">
                    {displayReviews[activeTestimonial].author}
                  </p>
                  <p className="text-label-sm text-on-surface-variant mt-1.5 uppercase tracking-wider">
                    {displayReviews[activeTestimonial].location}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Carousel Indicators */}
        <div className="flex justify-center gap-3 mt-12">
          {displayReviews.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTestimonial(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                activeTestimonial === idx ? 'w-8 bg-primary' : 'w-2.5 bg-outline-variant'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            ></button>
          ))}
        </div>
      </section>

      {/* Dynamic Reviews Board Section */}
      <section className="py-24 bg-surface-container-low px-margin-mobile md:px-margin-desktop border-t border-outline-variant/10">
        <div className="max-w-max-width mx-auto">
          <div className="text-center mb-16">
            <span className="text-label-sm font-label-sm text-secondary uppercase tracking-widest block mb-3">TRUSTED NATIONWIDE</span>
            <h2 className="text-headline-lg text-headline-lg font-bold text-primary mb-4">Sanctuary Reviews Board</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto text-body-md font-body-md">
              Real, verified feedback from customer properties experiencing spa-level water purification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {publicReviews.length > 0 ? (
              publicReviews.map((review, idx) => {
                const customerName = review.customer 
                  ? `${review.customer.firstName} ${review.customer.lastName ? review.customer.lastName.charAt(0) + '.' : ''}`
                  : 'Valued Customer';
                return (
                  <motion.div
                    key={review._id || idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass-card rounded-2xl p-8 flex flex-col justify-between group border border-outline-variant/20 hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-0.5 text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              size={16}
                              fill={i < (review.feedback?.rating || 5) ? "currentColor" : "none"}
                              className="text-amber-500"
                            />
                          ))}
                        </div>
                        <span className="px-2.5 py-0.5 bg-primary/5 text-primary text-[9px] uppercase font-bold tracking-wider rounded-full">
                          {review.serviceType?.replace(/_/g, ' ') || 'Purification'}
                        </span>
                      </div>
                      
                      <p className="text-on-surface-variant mb-8 text-sm italic font-medium leading-relaxed">
                        "{review.feedback?.review || 'Excellent service and perfect water filter quality!'}"
                      </p>
                    </div>

                    <div className="flex justify-between items-end border-t border-outline-variant/10 pt-4 mt-auto">
                      <div>
                        <p className="font-bold text-xs text-primary">{customerName}</p>
                        <p className="text-[10px] text-on-surface-variant/70 mt-0.5">Verified Sanctuary Owner</p>
                      </div>
                      <p className="text-[9px] text-on-surface-variant/50">
                        {review.feedback?.submittedAt ? new Date(review.feedback.submittedAt).toLocaleDateString(undefined, { dateStyle: 'short' }) : 'Recently'}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              // Beautiful Fallback cards using static testimonials if no reviews exist in DB yet
              testimonials.map((test, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-card rounded-2xl p-8 flex flex-col justify-between group border border-outline-variant/20 hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300"
                >
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex gap-0.5 text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            size={16}
                            fill={i < test.rating ? "currentColor" : "none"}
                            className="text-amber-500"
                          />
                        ))}
                      </div>
                      <span className="px-2.5 py-0.5 bg-primary/5 text-primary text-[9px] uppercase font-bold tracking-wider rounded-full">
                        Sanctuary Core
                      </span>
                    </div>
                    
                    <p className="text-on-surface-variant mb-8 text-sm italic font-medium leading-relaxed">
                      "{test.quote}"
                    </p>
                  </div>

                  <div className="flex justify-between items-end border-t border-outline-variant/10 pt-4 mt-auto">
                    <div>
                      <p className="font-bold text-xs text-primary">{test.author}</p>
                      <p className="text-[10px] text-on-surface-variant/70 mt-0.5">{test.location}</p>
                    </div>
                    <p className="text-[9px] text-on-surface-variant/50">Verified Owner</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Majestic CTA Section */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative bg-gradient-primary rounded-3xl p-12 md:p-20 text-center overflow-hidden shadow-2xl"
        >
          {/* Background overlay glow rings */}
          <div className="absolute -left-1/4 -bottom-1/2 w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl"></div>
          <div className="absolute -right-1/4 -top-1/2 w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <span className="text-[12px] font-bold text-amber-100 uppercase tracking-[0.3em] mb-4">EXPERIENCE PURE LIVING</span>
            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">Ready for a Flow State of Mind?</h2>
            <p className="text-white/80 text-body-lg font-body-lg mb-10 leading-relaxed max-w-xl">
              Join over 5,000 discerning estate owners who have upgraded their hydration and wellness standards with FilterNest.
            </p>
            <Link
              to="/book-service"
              className="inline-block px-10 py-5 bg-white text-primary rounded-xl font-label-md text-label-md hover:scale-105 active:scale-98 transition-all shadow-xl font-bold"
            >
              Book a Diagnostic Consultation
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
