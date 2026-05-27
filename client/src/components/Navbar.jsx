import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMenu, FiX, FiLogOut, FiUser } from 'react-icons/fi';
import { useAuthStore } from '../context/authStore';
import { ADMIN_ROLES, ROLES } from '../utils/auth';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, role, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // CUSTOMER LINKS - Clean minimal interface (NO DASHBOARD)
  const customerLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'My Bookings', path: '/my-bookings' },
    { name: 'Contact', path: '/contact' },
  ];

  // ADMIN LINKS - Full management access
  const adminLinks = [
    { name: 'Dashboard', path: '/admin-dashboard' },
    { name: 'Manage Agents', path: '/admin-dashboard?view=agents' },
    { name: 'Manage Bookings', path: '/admin-dashboard?view=bookings' },
    { name: 'Analytics', path: '/admin-dashboard?view=analytics' },
  ];

  // AGENT LINKS - Service management access
  const agentLinks = [
    { name: 'Dashboard', path: '/agent-dashboard' },
    { name: 'Assigned Jobs', path: '/agent-dashboard?view=assigned' },
    { name: 'Notifications', path: '/agent-dashboard?view=notifications' },
  ];

  // Determine nav links based on role - CUSTOMERS NEVER SEE DASHBOARD
  const navLinks = ADMIN_ROLES.includes(role)
    ? adminLinks
    : role === ROLES.AGENT
      ? agentLinks
      : user && role === ROLES.CUSTOMER
        ? customerLinks
        : [
            { name: 'Home', path: '/' },
            { name: 'Services', path: '/services' },
            { name: 'Contact', path: '/contact' },
          ];

  const isActive = (path) => {
    const [pathname, search] = path.split('?');
    return location.pathname === pathname && (!search || location.search === `?${search}`);
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-white/15 backdrop-blur-2xl border-b border-white/20 shadow-[0_8px_32px_0_rgba(108,47,0,0.04)]"
    >
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 w-full max-w-max-width mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center h-12 overflow-hidden">
          <img 
            src="/logos/filternest_wordmark.png" 
            alt="FilterNest" 
            className="h-[148px] w-auto mt-[-43px] mb-[-57px] object-contain mix-blend-multiply"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-label-md font-label-md transition-colors ${
                isActive(link.path)
                  ? 'text-primary border-b-2 border-primary pb-1'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {link.name}
            </Link>
          ))}

        </nav>

        {/* Right Section */}
        <div className="hidden md:flex items-center gap-4">
          {user && (
            <Link
              to={
                role === ROLES.CUSTOMER
                  ? "/my-bookings#profile"
                  : role === ROLES.AGENT
                    ? "/agent-dashboard"
                    : "/admin-dashboard"
              }
              aria-label="Profile"
              title="Profile"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-outline text-primary hover:bg-surface-container-low transition-all overflow-hidden"
            >
              {user.profileImage ? (
                <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-sm uppercase">
                  {user.firstName?.[0] || 'U'}{user.lastName?.[0] || ''}
                </div>
              )}
            </Link>
          )}

          {user && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-all"
            >
              <FiLogOut /> <span>Logout</span>
            </button>
          )}

          {!user && (
            <>
              <button className="text-on-surface-variant hover:bg-surface-container-low/50 transition-all px-4 py-2 rounded-lg font-label-md text-label-md">
                <Link to="/login">Sign In</Link>
              </button>
              <Link
                to="/register"
                className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-lg hover:bg-surface-container-low transition-colors"
        >
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden pb-4 space-y-2 border-t border-surface-variant"
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="block px-4 py-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          {!user && (
            <>
              <Link
                to="/login"
                className="block px-4 py-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-all"
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="block px-4 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-all"
                onClick={() => setIsOpen(false)}
              >
                Get Started
              </Link>
            </>
          )}
          {user && (
            <Link
              to={
                role === ROLES.CUSTOMER
                  ? "/my-bookings#profile"
                  : role === ROLES.AGENT
                    ? "/agent-dashboard"
                    : "/admin-dashboard"
              }
              className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-surface-container-low rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {user.profileImage ? (
                <img src={user.profileImage} alt="" className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <FiUser />
              )}
              <span>Profile</span>
            </Link>
          )}
          {user && (
            <button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <FiLogOut /> <span>Logout</span>
            </button>
          )}
        </motion.div>
      )}
    </motion.header>
  );
};

export default Navbar;
