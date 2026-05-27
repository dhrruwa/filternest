import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const TermsOfService = () => {
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
              Legal Documents
            </span>
            <h1 className="text-4xl font-bold text-primary mt-4 font-headline-xl">
              Terms of Service
            </h1>
            <p className="text-xs text-on-surface-variant mt-2 font-mono">
              Last Updated: May 26, 2026
            </p>
          </div>

          {/* Terms Content */}
          <div className="space-y-8 text-sm leading-relaxed text-gray-700">
            <p>
              Welcome to FilterNest. By accessing our home reverse osmosis installation dashboards, scheduling system audits, or booking verified specialist technicians, you signify your compliance and agreement with the following Terms of Service. Please read them thoroughly before proceeding with booking diagnostic consultations.
            </p>

            <div className="space-y-3">
              <h2 className="text-lg font-bold text-primary border-b border-[#753401]/5 pb-2">
                1. Service Engagement
              </h2>
              <p>
                FilterNest delivers water filtration engineering, diagnostics, replacement cores, and scheduled quarterly audits. While booking a service:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>You agree to provide complete physical service address coordinates (street, city, state, postal code) to ensure valid technician dispatching.</li>
                <li>You agree to grant our certified specialists safe physical access to residential plumbing layouts and countertop sanctuaries at the scheduled appointment time.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-bold text-primary border-b border-[#753401]/5 pb-2">
                2. Scheduling and Cancellation Rules
              </h2>
              <p>
                To maintain our white-glove logistics pipeline:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Bookings remain in a `pending` state until assigned to a nearby certified filter technician by the administration.</li>
                <li>Customers can cancel a booking directly from their active schedule dashboard at zero penalty only while the booking remains `pending` (i.e. before agent assignment).</li>
                <li>Cancellation or reschedule requests for confirmed or assigned bookings should be flagged through our direct support telephone channels.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-bold text-primary border-b border-[#753401]/5 pb-2">
                3. Customer Feedback and Ratings Policy
              </h2>
              <p>
                Customers are enabled to submit ratings (1-5 stars) and written reviews for all completed bookings. Under our trust metrics guidelines:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Feedback must be authentic and based solely on the specific completed plumbing or RO service.</li>
                <li>Submitted reviews are shared publicly on the assigned agent portfolio and the home page Reviews Board.</li>
                <li>FilterNest reserves the right to moderate or sanitize reviews containing illegal expressions, advertising content, or unrelated personal detail leakages.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-bold text-primary border-b border-[#753401]/5 pb-2">
                4. Payments and Pricing
              </h2>
              <p>
                Base prices for installations and replacements are visible on the dashboard and booking screens. You agree to pay the complete compiled invoice (incorporating parts cost, flat service fees, and standard taxes) through authenticated secure digital checkout. All finalized service charges are non-refundable upon completion.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-bold text-primary border-b border-[#753401]/5 pb-2">
                5. Limitation of Liability
              </h2>
              <p>
                FilterNest specializes in high-end countertop and architectural purifiers. While we employ extreme engineering precision, we are not liable for incidental damage to pre-existing municipal pipelines, domestic water main leaks due to obsolete internal plumbing, or minor pressure fluctuations from municipal lines.
              </p>
            </div>

            <div className="pt-6 border-t border-[#753401]/10 text-xs text-on-surface-variant text-center">
              <p>If you have questions regarding these terms, please contact our Compliance Office at filternest.service@gmail.com.</p>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default TermsOfService;
