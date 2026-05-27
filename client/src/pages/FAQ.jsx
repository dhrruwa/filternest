import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiPlus, FiMinus, FiSearch, FiHelpCircle } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const faqs = [
  {
    category: "System & Technology",
    question: "What makes FilterNest purification systems unique?",
    answer: "FilterNest integrates high-end architectural design with advanced multi-stage reverse osmosis (RO) and high-density carbon block technology. Our units are engineered to match luxury kitchen cabinetry while delivering absolute water purity index readings, stripping municipal inputs of heavy metals, microplastics, and trace chemical residues."
  },
  {
    category: "Logistics & Dispatch",
    question: "How is an engineering specialist assigned to my booking?",
    answer: "Once you schedule an installation or quarterly maintenance request through the Customer Dashboard, our automated dispatching system matches your location coordinates against our network of active, nearby certified specialists. You will receive an immediate notification (with live phone coordinates) as soon as an expert is assigned."
  },
  {
    category: "Maintenance & Cores",
    question: "How often do filter cores need replacement?",
    answer: "For our signature sanctuary systems, the high-density carbon pre-filters and mineralizers are scheduled for replacement every 6 months, while the reverse osmosis membrane core is designed for a 12-month lifecycle. FilterNest automates scheduling to ensure you receive timely maintenance reminders ahead of expiration."
  },
  {
    category: "Feedback & Reviews",
    question: "How do ratings and reviews work for bookings?",
    answer: "Upon successful completion of any service booking (status shifts to completed), a 'Submit Review' button will unlock inline in your My Bookings dashboard list. You can assign a 1-5 star rating and leave detailed written feedback. This updates the agent's public portfolio score and populates the Reviews Board on the Home page."
  },
  {
    category: "Legal & Booking",
    question: "Can I cancel or reschedule an active appointment?",
    answer: "Yes. Active bookings can be cancelled directly through the Customer Dashboard at any time while the booking status remains 'pending'. If a certified specialist has already been assigned or confirmed, please coordinate rescheduling via our direct customer care telephone line (1-800-FILTER-1)."
  },
  {
    category: "Installation & Fit",
    question: "Does FilterNest require structural modifications to my kitchen?",
    answer: "No structural modifications are needed. Our white-glove technicians specialize in clean under-sink or countertop integrations that neatly tap into existing municipal supply lines. The minimalist design fits seamlessly beneath signature wood cabinetry or alongside high-end kitchen appliances."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#faf9f6] min-h-screen text-on-surface">
      <Navbar />

      <section className="pt-16 pb-24 px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-10"
        >
          {/* Header */}
          <div className="glass-card p-8 rounded-3xl border border-outline-variant/30 text-center shadow-[0_20px_50px_rgba(108,47,0,0.04)] relative overflow-hidden">
            <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              Help Center
            </span>
            <h1 className="text-4xl font-bold text-primary mt-4 font-headline-xl">
              Frequently Asked Questions
            </h1>
            <p className="text-on-surface-variant max-w-lg mx-auto text-sm mt-3 leading-relaxed">
              Find instant answers regarding architectural installations, quarterly RO maintenance schedules, and verification protocols.
            </p>

            {/* Interactive Search Bar */}
            <div className="max-w-md mx-auto mt-8 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <FiSearch size={18} />
              </span>
              <input
                type="text"
                placeholder="Search queries, categories, systems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-[#753401]/15 rounded-2xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all duration-300 shadow-sm"
              />
            </div>
          </div>

          {/* Accordion List */}
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="glass-card rounded-2xl border border-outline-variant/20 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Trigger */}
                    <button
                      onClick={() => toggleFAQ(idx)}
                      className="w-full flex items-center justify-between p-6 text-left focus:outline-none select-none"
                    >
                      <div className="space-y-1">
                        <span className="text-[9px] bg-secondary-container/50 text-[#706439] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          {faq.category}
                        </span>
                        <h3 className="text-sm font-bold text-primary pt-1 leading-snug">
                          {faq.question}
                        </h3>
                      </div>
                      <span className={`p-2 rounded-full bg-[#faf9f6] border border-gray-100 text-primary transition-transform duration-300 ${isOpen ? 'rotate-180 bg-primary/5' : ''}`}>
                        <FiChevronDown size={16} />
                      </span>
                    </button>

                    {/* Content Panel */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <div className="px-6 pb-6 pt-2 border-t border-[#753401]/5 text-xs leading-relaxed text-gray-600 bg-white/40">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            ) : (
              <div className="glass-card p-12 text-center rounded-2xl border border-outline-variant/20">
                <FiHelpCircle size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-bold text-gray-600">No Match Found</p>
                <p className="text-xs text-gray-400 mt-1">We couldn't find any FAQs matching your exact query. Please search using alternative keywords.</p>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
