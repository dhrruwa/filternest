import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPhone, FiMail, FiMessageSquare, FiSend, FiClock } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

const SupportCenter = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    ticketType: 'technical',
    message: ''
  });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    setIsSending(true);
    setTimeout(() => {
      toast.success('Support ticket logged successfully! Our team will contact you shortly.');
      setFormData({ name: '', email: '', ticketType: 'technical', message: '' });
      setIsSending(false);
    }, 1200);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-[#faf9f6] min-h-screen text-on-surface">
      <Navbar />

      <section className="pt-16 pb-24 px-margin-mobile md:px-margin-desktop max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-10"
        >
          {/* Banner */}
          <div className="glass-card p-8 rounded-3xl border border-outline-variant/30 text-center shadow-[0_20px_50px_rgba(108,47,0,0.04)] relative overflow-hidden">
            <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              FilterNest Care
            </span>
            <h1 className="text-4xl font-bold text-primary mt-4 font-headline-xl">
              Support Center
            </h1>
            <p className="text-on-surface-variant max-w-lg mx-auto text-sm mt-3 leading-relaxed">
              Have an issue with your domestic water main pressure or filter installation? Lodge a dynamic support ticket or reach out directly through our dedicated concierge lines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter items-start">
            {/* Left Column: Instant Support Channels */}
            <div className="space-y-6 md:col-span-1">
              <div className="glass-card p-6 rounded-2xl border border-outline-variant/20 space-y-6 bg-white/40">
                <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">
                  Direct Care Channels
                </h3>

                <div className="space-y-4 text-xs">
                  {/* Phone */}
                  <div className="flex gap-4 items-start p-4 rounded-xl bg-white border border-gray-100">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <FiPhone size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Direct Telephone</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">1-800-FILTER-1</p>
                      <p className="text-[9px] text-primary font-semibold mt-1">Toll-Free Corporate Hotline</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex gap-4 items-start p-4 rounded-xl bg-white border border-gray-100">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <FiMail size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Support Emails</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">support@waterfilter.com</p>
                      <p className="text-[11px] text-gray-500">info@waterfilter.com</p>
                      <p className="text-[9px] text-gray-400 mt-1">Response inside 2 hours</p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex gap-4 items-start p-4 rounded-xl bg-white border border-gray-100">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <FiClock size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Service Hours</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Mon - Fri: 9 AM - 6 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Ticket Submission Form */}
            <div className="md:col-span-2">
              <div className="glass-card p-6 md:p-8 rounded-2xl border border-outline-variant/20 bg-white/60">
                <h2 className="text-lg font-bold text-primary mb-2 flex items-center gap-2 border-b border-[#753401]/5 pb-3">
                  <FiMessageSquare className="text-primary" /> Lodge a Concierge Ticket
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Your Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 bg-white border border-[#753401]/10 rounded-xl text-sm focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 bg-white border border-[#753401]/10 rounded-xl text-sm focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Ticket Category</label>
                    <select
                      name="ticketType"
                      value={formData.ticketType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-[#753401]/10 rounded-xl text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="technical">Technical Issue (Plumbing, Leak, RO Filter)</option>
                      <option value="billing">Billing & Payment Query</option>
                      <option value="booking">Appointment / Reschedule Request</option>
                      <option value="feedback">General Complaint / Feedback</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Description of Issue</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Please specify your domestic purifier symptoms or booking complications..."
                      className="w-full px-4 py-3 bg-white border border-[#753401]/10 rounded-xl text-sm focus:outline-none focus:border-primary resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full py-3.5 bg-gradient-primary text-white font-bold rounded-xl text-sm hover:opacity-95 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-md"
                  >
                    <FiSend />
                    {isSending ? 'Loding Ticket...' : 'Submit Support Ticket'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default SupportCenter;
