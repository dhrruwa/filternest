import React from 'react';
import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-inverse-surface text-white py-16">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-12">
          {/* Company Info */}
          <div>
            <div className="h-12 overflow-hidden flex items-center mb-4">
              <img
                src="/logos/filternest_wordmark.png"
                alt="FilterNest"
                className="h-[148px] w-auto mt-[-43px] mb-[-57px] object-contain brightness-0 invert"
              />
            </div>
            <p className="text-white/80 mb-6 text-body-md font-body-md">
              Premium water management for luxury residential environments. Pure wellness, defined.
            </p>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-label-md font-label-md font-semibold mb-4 text-white">RESOURCES</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-white/80 hover:text-primary transition text-body-md">About Us</Link></li>
              <li><Link to="/privacy" className="text-white/80 hover:text-primary transition text-body-md">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-white/80 hover:text-primary transition text-body-md">Terms of Service</Link></li>
              <li><Link to="/faq" className="text-white/80 hover:text-primary transition text-body-md">FAQ</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-label-md font-label-md font-semibold mb-4 text-white">CONTACT</h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2 text-white/80">
                <FiPhone size={18} className="mt-1" />
                <div>
                  <span className="text-body-md block">7483550914</span>
                </div>
              </li>
              <li className="flex items-start space-x-2 text-white/80">
                <FiMail size={18} className="mt-1" />
                <div>
                  <span className="text-body-md block">filternest.service@gmail.com</span>
                </div>
              </li>
              <li className="flex items-start space-x-2 text-white/80">
                <FiMapPin size={18} className="mt-1" />
                <div>
                  <span className="text-body-md block"></span>
                  <span className="text-body-md block">KMA Residency, Sri Sai Layout Yelahanka, Bangalore, Karnataka - 560064</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-label-md font-label-md font-semibold mb-4 text-white">HELP</h4>
            <ul className="space-y-2">
              <li><Link to="/contact" className="text-white/80 hover:text-primary transition text-body-md">Contact Us</Link></li>
              <li><Link to="/support" className="text-white/80 hover:text-primary transition text-body-md">Support Center</Link></li>
              <li><Link to="/docs" className="text-white/80 hover:text-primary transition text-body-md">Documentation</Link></li>
              <li><Link to="/guide" className="text-white/80 hover:text-primary transition text-body-md">Booking Guide</Link></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 pt-8 flex justify-between items-center flex-wrap gap-4">
          <p className="text-white/80 text-body-md">
            © 2024 FilterNest. Pure Wellness, Defined.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
