import React from 'react';
import { FiPhone, FiMail, FiMapPin } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-inverse-surface text-white py-12">
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
            <p className="text-white/80 text-sm">
              Premium water filter servicing. Excellence in field service.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-white">CONTACT</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2 text-white/80">
                <FiPhone size={16} />
                <span>7483550914</span>
              </li>
              <li className="flex items-center space-x-2 text-white/80">
                <FiMail size={16} />
                <span>support@filternest.com</span>
              </li>
              <li className="flex items-start space-x-2 text-white/80">
                <FiMapPin size={16} className="mt-1" />
                <span>Bangalore, India</span>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-white">HELP</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href="/contact" className="hover:text-primary transition">Contact Support</a></li>
              <li><a href="mailto:support@filternest.com" className="hover:text-primary transition">Email Support</a></li>
              <li><span>24/7 Assistance Available</span></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 pt-6">
          <p className="text-white/80 text-sm text-center">
            © 2024 FilterNest. Pure Wellness, Defined.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
