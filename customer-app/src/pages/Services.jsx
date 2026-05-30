import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheck,
  FiClock,
  FiHeart,
  FiSettings,
  FiActivity,
  FiAward,
  FiShield,
  FiZap,
  FiCpu,
  FiArrowRight,
  FiChevronDown
} from 'react-icons/fi';

const Services = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);

  const services = [
    {
      title: 'General Purifier Service',
      price: '₹200',
      duration: '45 mins',
      tag: 'Essential Care',
      icon: FiSettings,
      description: 'Comprehensive smart maintenance and sanitization of your water purifier system. Includes housing cleaning, sediment flushing, and strict leak testing.',
      features: ['Full housing sanitization', 'Sediment cartridge flush', 'Multi-point pressure check', 'TDS water quality audit']
    },
    {
      title: 'Pre-Filter Replacement',
      price: '₹250',
      duration: '30 mins',
      tag: 'Recommended (3 Months)',
      icon: FiZap,
      description: 'Replace the external sediment filter to arrest high-micron silt, clay, and sand. Prevents fouling and doubles the life of internal carbon membranes.',
      features: ['Premium 5-micron pre-filter cartridge', 'Heavy-duty bowl cleaning', 'O-ring sealing audit', 'Inlet valve pressure setup']
    },
    {
      title: 'RO Membrane Calibration',
      price: '₹700',
      duration: '60 mins',
      tag: 'High Precision (1 Year)',
      icon: FiCpu,
      description: 'Replace the advanced Reverse Osmosis (RO) membrane with high-rejection elements to eliminate heavy metals, fluoride, pesticides, and pathogens.',
      features: ['Genuine FilterNest OEM RO Membrane', 'Post-carbon polishing flush', 'Calibrated mineral TDS setup', '180-day direct warranty']
    },
    {
      title: 'Luxury System Installation',
      price: '₹500',
      duration: '120 mins',
      tag: 'White-Glove Setup',
      icon: FiAward,
      description: 'Professional, concealed counter plumbing and white-glove setup of your premium water purifier system. Includes structural wall mounting and flow tuning.',
      features: ['Advanced plumbing concealment', 'Pressure reducing valve tuning', 'Purity diagnostics demo', 'Dedicated user guide session']
    },
    {
      title: 'Emergency Repair & Breakdown',
      price: '₹500',
      duration: '60 mins',
      tag: 'Express Priority',
      icon: FiActivity,
      description: 'Rapid troubleshooting and repair of leakage, low water flow, system warning buzzers, electrical pump errors, and power faults.',
      features: ['Fault diagnostics and wiring audit', 'High-pressure booster pump repair', 'Automatic cut-off valve setup', 'Instant diagnostic review']
    }
  ];

  const faqs = [
    {
      q: 'How frequently should I schedule a Pre-Filter replacement?',
      a: 'We strongly recommend replacing your external pre-filter cartridge every 3 months. Silt and high-micron dust block this cartridge quickly, and keeping it fresh prevents strain on the booster pump and internal membranes.'
    },
    {
      q: 'What is a TDS Water Quality Audit?',
      a: 'TDS (Total Dissolved Solids) measures the concentration of inorganic salts and organic matter dissolved in water. During every service, our certified technician conducts a multi-point audit to ensure your output TDS is calibrated between 80-150 PPM, which is optimal for both health and taste.'
    },
    {
      q: 'Are parts and spares covered under warranty?',
      a: 'Absolutely. All genuine FilterNest OEM spare parts (booster pumps, carbon blocks, mineral cartridges, and membranes) replaced by our technicians come with an ironclad 90-day to 180-day replacement warranty.'
    },
    {
      q: 'How does white-glove concealed installation work?',
      a: 'Our technicians assess your kitchen layout to run pure-flow pipes beneath the cabinet sinks, keeping the counters completely clutter-free. We drill minimal wall mounts and set up an integrated water inlet joint securely.'
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-on-surface relative overflow-hidden flex flex-col justify-between">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-margin-mobile md:px-margin-desktop bg-gradient-primary text-white overflow-hidden">
        {/* Soft floating background waves */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 1440 400" preserveAspectRatio="none" fill="none">
            <path d="M0,160 C300,300 600,100 900,260 C1200,420 1300,100 1440,200 L1440,400 L0,400 Z" fill="rgba(255,255,255,0.4)" />
          </svg>
        </div>
        
        <div className="max-w-max-width mx-auto text-center relative z-10 space-y-4">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block bg-[#ffdbc9] text-[#753401] text-[10px] font-bold px-3 py-1 rounded-full font-label-md uppercase tracking-widest"
          >
            CARE CATALOGUE
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold font-headline-xl drop-shadow-md"
          >
            FilterNest Premium Care
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 max-w-xl mx-auto text-xs md:text-sm font-medium leading-relaxed font-label-md"
          >
            Concealed counter installations, high-rejection RO membrane replacements, and certified TDS calibrations tailored for luxury residences.
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto w-full space-y-24">
        
        {/* Services Showcase Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter"
        >
          {services.map((service, idx) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={idx}
                variants={cardVariants}
                className="glass-card rounded-3xl p-8 hover:shadow-xl transition-all duration-500 bg-white/40 flex flex-col justify-between h-[420px]"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="p-3.5 bg-[#ffdbc9]/40 border border-outline-variant/35 text-primary rounded-2xl">
                      <Icon size={20} />
                    </div>
                    <span className="bg-[#f3e2ac] text-[#706439] border border-[#d6c692] text-[9px] font-bold px-2.5 py-0.5 rounded-full font-label-md uppercase tracking-wider">
                      {service.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-shadow-subtle">{service.title}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                    {service.description}
                  </p>

                  <ul className="space-y-2 pt-2">
                    {service.features.slice(0, 3).map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2 text-[10px] text-secondary font-semibold font-label-md">
                        <FiCheck className="text-primary shrink-0" size={12} />
                        <span className="truncate">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 border-t border-outline-variant/20 flex items-center justify-between gap-4">
                  <div>
                    <span className="block text-[8px] uppercase tracking-widest text-[#6a5e33] font-bold font-label-md">PRICE</span>
                    <span className="text-xl font-bold text-primary font-headline-md">{service.price}</span>
                  </div>

                  <button
                    onClick={() => navigate('/book-service', { state: { serviceTitle: service.title, servicePrice: service.price } })}
                    className="bg-primary hover:bg-[#853a01] text-on-primary font-bold text-[10px] uppercase tracking-wider py-3 px-5 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 font-label-md cursor-pointer hover:scale-102"
                  >
                    Settle Care <FiArrowRight size={10} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Brand Promise Section */}
        <div className="glass-card p-8 md:p-12 rounded-[32px] border border-outline-variant/30 bg-gradient-to-tr from-white via-white to-[#ffdbc9]/15 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-[10px] bg-[#ffdbc9]/40 border border-primary/20 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-widest font-label-md">THE PURITY PROTOCOL</span>
              <h2 className="font-headline-md text-2xl md:text-3xl text-primary font-bold">Why select FilterNest Care?</h2>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed font-label-md">
                We calibrate your residential water purification to smart, clinical perfection. Our reverse osmosis filter services leverage certified technical parameters, genuine spares, and continuous monitoring.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-3">
                  <FiShield className="text-primary shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-xs font-bold text-shadow-subtle">90-Day Parts Warranty</h4>
                    <p className="text-[10px] text-on-surface-variant font-medium font-label-md mt-0.5">Replacement of any spares within 90 days for free.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <FiActivity className="text-primary shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-xs font-bold text-shadow-subtle">Free TDS Audit</h4>
                    <p className="text-[10px] text-on-surface-variant font-medium font-label-md mt-0.5">Complimentary chemical and mineral PPM test after service.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Stats Segment */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { count: '10k+', label: 'Pure Homes Served' },
                { count: '180 PPM', label: 'Concealed Silt Cleaned' },
                { count: '100%', label: 'Genuine Spares Guaranteed' },
                { count: '90 Mins', label: 'Emergency Tech SLA' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-[#faf9f6]/90 border border-outline-variant/30 p-6 rounded-2xl text-center">
                  <span className="block text-2xl font-bold text-primary font-headline-md">{stat.count}</span>
                  <span className="block text-[8px] font-bold text-[#6a5e33] uppercase mt-1 font-label-md tracking-wider">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Purity FAQs Segment */}
        <div className="space-y-6">
          <div className="text-center space-y-2 max-w-md mx-auto">
            <span className="text-[9px] text-[#6a5e33] font-bold uppercase tracking-widest font-label-md">CARE KNOWLEDGEBASE</span>
            <h2 className="font-headline-md text-2xl text-primary font-bold">Frequently Asked Purity Questions</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-outline-variant/20 rounded-2xl bg-white overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left text-xs font-bold font-label-md text-slate-800 hover:text-primary transition-all focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <FiChevronDown className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={16} />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 pt-0 border-t border-outline-variant/10 text-xs text-on-surface-variant font-medium leading-relaxed font-label-md bg-[#faf9f6]/30">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

      </section>

      <Footer />
    </div>
  );
};

export default Services;
