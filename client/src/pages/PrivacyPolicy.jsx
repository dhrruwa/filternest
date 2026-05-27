import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PrivacyPolicy = () => {
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
              Privacy Policy
            </h1>
            <p className="text-xs text-on-surface-variant mt-2 font-mono">
              Last Updated: May 26, 2026
            </p>
          </div>

          {/* Privacy Content */}
          <div className="space-y-8 text-sm leading-relaxed text-gray-700">
            <p>
              At FilterNest, we are deeply committed to protecting your privacy and ensuring the security of your personal data. This Privacy Policy outlines how we collect, use, process, and protect your information when you access our water management platforms, schedule system maintenance, or interact with our certified engineering specialists.
            </p>

            <div className="space-y-3">
              <h2 className="text-lg font-bold text-primary border-b border-[#753401]/5 pb-2">
                1. Information We Collect
              </h2>
              <p>
                We collect information essential to delivering white-glove architectural purification installations and quarterly maintenance schedules:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-gray-900">Personal Details:</strong> First and last names, contact telephone numbers, and email addresses.
                </li>
                <li>
                  <strong className="text-gray-900">Service Locations:</strong> Physical addresses, city, state, postal codes, and landmarks used to route technicians.
                </li>
                <li>
                  <strong className="text-gray-900">Geographic Coordinates:</strong> Precise location mapping coordinates to assist live agent tracking and service boundary allocation.
                </li>
                <li>
                  <strong className="text-gray-900">System Preferences:</strong> Detailed reports on domestic plumbing configurations, filter lifespan tracking, and scheduling histories.
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-bold text-primary border-b border-[#753401]/5 pb-2">
                2. How We Use Your Information
              </h2>
              <p>
                Your data is processed strictly under clear guidelines to fulfill our core hydration service standards:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Allocating and coordinating nearby certified agents to complete your active bookings.</li>
                <li>Real-time automated status tracking and appointment updates via SMS and Email notification protocols.</li>
                <li>Recalculating and populating technician ratings based on verified feedback reviews.</li>
                <li>Analyzing regional water quality parameters to optimize high-density carbon replacement parts.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-bold text-primary border-b border-[#753401]/5 pb-2">
                3. Data Security and Standards
              </h2>
              <p>
                We protect your details with industry-leading measures:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>All sessions and network requests are encrypted using Transport Layer Security (TLS/HTTPS).</li>
                <li>Financial details are securely processed through authenticated gateways with zero local logging of credit cards.</li>
                <li>Access to location telemetry is strictly sandboxed and restricted only to active agents during scheduled jobs.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-bold text-primary border-b border-[#753401]/5 pb-2">
                4. Third-Party Disclosures
              </h2>
              <p>
                FilterNest does not sell, rent, or trade your personal data. Information is shared strictly with authorized technicians assigned to your active schedule, or regulatory bodies when required to enforce standard public utility and health guidelines.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-bold text-primary border-b border-[#753401]/5 pb-2">
                5. Your Rights and Preferences
              </h2>
              <p>
                Under our white-glove services model, you retain full ownership of your data parameters:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>You may edit your personal details, physical addresses, and notification preferences at any time in the Customer settings panel.</li>
                <li>You may request complete account deletion by contacting support, which automatically triggers full database sanitization of private credentials.</li>
              </ul>
            </div>

            <div className="pt-6 border-t border-[#753401]/10 text-xs text-on-surface-variant text-center">
              <p>If you have any questions regarding this Privacy Policy, please contact our Legal Office at legal@filternest.com.</p>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
