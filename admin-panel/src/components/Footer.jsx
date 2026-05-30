import React from 'react';
import { FiPhone, FiMail, FiMapPin } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-white py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="h-10 overflow-hidden flex items-center mb-4">
              <img
                src="/logos/filternest_wordmark.png"
                alt="FilterNest"
                className="h-[120px] w-auto object-contain brightness-0 invert"
              />
            </div>
            <p className="text-slate-400 text-sm">
              Enterprise administration platform for FilterNest operations.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-white">CONTACT</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2 text-slate-400">
                <FiPhone size={16} />
                <span>7483550914</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-400">
                <FiMail size={16} />
                <span>admin@filternest.com</span>
              </li>
              <li className="flex items-start space-x-2 text-slate-400">
                <FiMapPin size={16} className="mt-1" />
                <span>Bangalore, India</span>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-white">ADMIN</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><span>System Status: <span className="text-green-400">Operational</span></span></li>
              <li><span>Support: 24/7 Available</span></li>
              <li><a href="mailto:admin@filternest.com" className="hover:text-blue-400 transition">Report Issue</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 pt-6">
          <p className="text-slate-500 text-sm text-center">
            © 2024 FilterNest Admin. Pure Wellness, Defined.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
