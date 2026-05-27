import React from 'react';
import { motion } from 'framer-motion';
import { FiBookOpen, FiMapPin, FiUserCheck, FiStar, FiCalendar } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const BookingGuide = () => {
  return (
    <div className="bg-[#faf9f6] min-h-screen text-on-surface">
      <Navbar />

      <section className="pt-16 pb-24 px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-card p-8 md:p-12 rounded-3xl border border-outline-variant/30 relative overflow-hidden shadow-[0_20px_50px_rgba(108,47,0,0.04)]"
        >
          {/* Header */}
          <div className="border-b border-[#753401]/10 pb-6 mb-8 text-center sm:text-left">
            <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              Instruction Manual
            </span>
            <h1 className="text-4xl font-bold text-primary mt-4 font-headline-xl flex items-center justify-center sm:justify-start gap-3">
              <FiCalendar className="text-primary" /> Booking Guide
            </h1>
            <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
              Learn how to schedule white-glove diagnostics, configure physical address coordinates, view specialist portfolios, and submit verified feedback.
            </p>
          </div>

          {/* Guide Steps */}
          <div className="space-y-10 text-sm leading-relaxed text-gray-700">
            {/* Step 1 */}
            <div className="flex gap-6 items-start">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                1
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 mt-2">
                  <FiBookOpen size={16} /> Select Your Purifier Service
                </h3>
                <p className="text-xs text-gray-600">
                  Log in to your Customer showroom and click 'Book Service'. Choose from our curated catalog of Signature Water Systems, including under-sink carbon modules, reverse osmosis sweep installations, or scheduled quarterly diagnostics.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 items-start">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                2
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 mt-2">
                  <FiMapPin size={16} /> Coordinate Service Location
                </h3>
                <p className="text-xs text-gray-600">
                  Provide your physical dispatch coordinates (street address, city, state, postal code). You can use our integrated interactive coordinate picker to automatically parse your geographic latitude and longitude, matching your estate with our closest expert.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 items-start">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                3
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 mt-2">
                  <FiUserCheck size={16} /> Review Specialist Portfolio
                </h3>
                <p className="text-xs text-gray-600">
                  Once administration confirms your request and assigns a certified agent, their full details (name, phone, experience) populate inside your active booking card. Click 'View Portfolio' inside the card to browse their completed jobs history, skills metrics, and verified feedback written by other customer properties.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6 items-start">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                4
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 mt-2">
                  <FiStar size={16} /> Submit Verified Feedback
                </h3>
                <p className="text-xs text-gray-600">
                  After our specialist completes your system integration or replacement core swap (booking status shifts to completed), a 'Submit Review' button triggers inline. You can select 1-5 gold stars and submit an optional written comment, dynamically updating the agent's portfolio and adding your testimonial to the landing page Reviews Board!
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-[#753401]/10 text-xs text-on-surface-variant text-center">
              <p>For immediate scheduling assistance or troubleshooting, please call our direct hotline at 1-800-FILTER-1.</p>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default BookingGuide;
