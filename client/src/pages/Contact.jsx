import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { FiPhone, FiMail, FiMapPin, FiClock, FiSend, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'technical',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.message) {
      toast.error('Please complete all message fields');
      return;
    }
    setIsSubmitting(true);
    
    // Simulate API request
    setTimeout(() => {
      toast.success('Your care inquiry has been dispatched to KMA Yelahanka suite!');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'technical',
        message: '',
      });
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-on-surface relative overflow-hidden flex flex-col justify-between">
      <Navbar />

      {/* Hero Header Section */}
      <section className="relative pt-32 pb-24 px-margin-mobile md:px-margin-desktop bg-gradient-primary text-white overflow-hidden">
        {/* Decorative backdrop shapes */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#ffdbc9] rounded-full filter blur-3xl opacity-15 pointer-events-none"></div>
        
        <div className="max-w-max-width mx-auto text-center relative z-10 space-y-4">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block bg-[#ffdbc9] text-[#753401] text-[10px] font-bold px-3 py-1 rounded-full font-label-md uppercase tracking-widest"
          >
            GET IN TOUCH
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold font-headline-xl drop-shadow-md"
          >
            Care Assistance Suite
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 max-w-xl mx-auto text-xs md:text-sm font-medium leading-relaxed font-label-md"
          >
            Need technical purifier support, AMC renewals, or customized plumbing schematics? Reach out to our Yelahanka headquarters suite.
          </motion.p>
        </div>
      </section>

      {/* Main Support Grid */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-gutter items-start">
          
          {/* Left Block: Contact Coordinates */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-8 rounded-3xl border border-outline-variant/30 bg-white/40 shadow-sm space-y-8">
              <div>
                <h2 className="text-xl font-bold text-primary font-headline-md tracking-wide">Yelahanka Care Office</h2>
                <p className="text-[10px] text-on-surface-variant font-label-md mt-1">Direct support desk coordinates for residential systems</p>
              </div>

              <div className="space-y-6">
                {/* Phone block */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#ffdbc9]/40 border border-outline-variant/30 text-primary rounded-xl">
                    <FiPhone size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase text-secondary">Phone Support</h3>
                    <a href="tel:7483550914" className="block text-sm font-bold text-primary mt-1 font-mono hover:underline">
                      7483550914
                    </a>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-0.5 font-label-md">Direct helpdesk line (Mon-Fri, 9 AM - 6 PM)</p>
                  </div>
                </div>

                {/* Email block */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#ffdbc9]/40 border border-outline-variant/30 text-primary rounded-xl">
                    <FiMail size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase text-secondary">Email Inquiries</h3>
                    <a href="mailto:filternest.service@gmail.com" className="block text-sm font-bold text-primary mt-1 hover:underline">
                      filternest.service@gmail.com
                    </a>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-0.5 font-label-md">Support SLA response in 60 mins</p>
                  </div>
                </div>

                {/* Address block */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#ffdbc9]/40 border border-outline-variant/30 text-primary rounded-xl">
                    <FiMapPin size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase text-secondary">Headquarters Suite</h3>
                    <p className="text-xs text-slate-800 font-bold mt-1.5 leading-relaxed">
                      KMA Residency, Sri Sai Layout,
                    </p>
                    <p className="text-[11px] text-on-surface-variant font-medium font-label-md">
                      Yelahanka, Bangalore, Karnataka - 560064
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours Panel */}
            <div className="glass-card p-6 rounded-3xl border border-outline-variant/20 bg-[#f3e2ac]/10 shadow-sm flex items-center gap-4">
              <FiClock className="text-[#706439]" size={24} />
              <div>
                <h4 className="text-xs font-bold text-[#706439] uppercase font-label-md">Care Business Hours</h4>
                <p className="text-[10px] text-on-surface-variant font-medium mt-0.5 font-label-md">
                  Monday to Friday: 9:00 AM - 6:00 PM • Saturday: 10:00 AM - 4:00 PM
                </p>
              </div>
            </div>
          </div>

          {/* Right Block: Message Form */}
          <div className="lg:col-span-3">
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8 md:p-10 rounded-3xl border border-outline-variant/30 bg-white/40 shadow-md space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-primary font-headline-md tracking-wide">Calibrate a Message</h2>
                <p className="text-[10px] text-on-surface-variant font-label-md mt-1">Send a white-glove request directly to our customer executives</p>
              </div>

              <div className="space-y-4 text-xs font-semibold font-label-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-secondary mb-1.5">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Dhruva K"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-[#faf9f6] border border-outline-variant/40 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all duration-350"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-secondary mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="dhruva@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-[#faf9f6] border border-outline-variant/40 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all duration-350"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-secondary mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="w-full px-4 py-3 bg-[#faf9f6] border border-outline-variant/40 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all duration-350 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-secondary mb-1.5">Inquiry Topic</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-[#faf9f6] border border-outline-variant/40 rounded-xl focus:outline-none"
                    >
                      <option value="technical">Technical Breakdown</option>
                      <option value="amc">AMC & Warranty Renewal</option>
                      <option value="custom_fit">Custom CAD Cabinetry Fit</option>
                      <option value="other">General Inquiry</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-secondary mb-1.5">Message Details</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your kitchen piping layout or purifier issue in detail..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 bg-[#faf9f6] border border-outline-variant/40 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all duration-350 resize-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-[9px] text-[#6a5e33] font-bold leading-normal font-label-md flex items-center gap-1.5">
                  <FiMessageSquare className="shrink-0 text-primary" /> Already registered? Log in to open instant chat tickets.
                </span>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-primary hover:bg-[#853a01] text-on-primary font-bold text-xs uppercase tracking-wider py-3.5 px-8 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2 font-label-md cursor-pointer"
                >
                  {isSubmitting ? 'Calibrating...' : 'Send Inquiry'} <FiSend size={12} />
                </button>
              </div>
            </motion.form>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
