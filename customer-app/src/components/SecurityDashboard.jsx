import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMonitor, FiSmartphone, FiTablet, FiShield, FiAlertTriangle, FiTrash2, FiMapPin, FiClock } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const SecurityDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/auth/sessions');
      setSessions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch active sessions:', error);
      toast.error('Failed to load active sessions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (sessionId) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      toast.success('Device session revoked successfully');
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
    } catch (error) {
      console.error('Failed to revoke session:', error);
      toast.error(error.response?.data?.error || 'Failed to revoke device session');
    }
  };

  const handleRevokeAll = async () => {
    if (!window.confirm('Are you sure you want to sign out from all other devices? This will invalidate all other active sessions.')) {
      return;
    }

    setIsRevokingAll(true);
    try {
      await api.post('/auth/logout-all');
      toast.success('Logged out from all other devices');
      // Fetch fresh sessions (will only return current session)
      await fetchSessions();
    } catch (error) {
      console.error('Failed to logout from all devices:', error);
      toast.error('Failed to sign out from all other devices');
    } finally {
      setIsRevokingAll(false);
    }
  };

  const getDeviceIcon = (deviceType) => {
    if (deviceType === 'mobile') return <FiSmartphone size={20} className="text-secondary" />;
    if (deviceType === 'tablet') return <FiTablet size={20} className="text-secondary" />;
    return <FiMonitor size={20} className="text-secondary" />;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-xs text-on-surface-variant font-medium">Scanning active credentials...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-2xl">
            <FiShield size={24} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">Account Security & Sessions</h2>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              Review and manage your active login sessions across all browsers and devices.
            </p>
          </div>
        </div>

        {sessions.length > 1 && (
          <button
            onClick={handleRevokeAll}
            disabled={isRevokingAll}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-error/10 hover:bg-error text-error hover:text-white rounded-xl border border-error/20 text-xs font-bold transition-all duration-300 shadow-sm active:scale-95 disabled:opacity-50"
          >
            <FiTrash2 size={14} />
            {isRevokingAll ? 'Signing Out...' : 'Sign Out All Other Devices'}
          </button>
        )}
      </div>

      {/* Security warning banner if multiple sessions exist */}
      {sessions.length > 1 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 leading-relaxed font-medium">
          <FiAlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-bold">Multiple Active Devices Detected:</span> You are currently signed in on multiple devices. If you notice any suspicious device, browser, or location details, revoke the session immediately and secure your account by changing your password.
          </div>
        </div>
      )}

      {/* Session Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {sessions.map((session, idx) => (
            <motion.div
              key={session._id}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className={`p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                session.isCurrentDevice 
                  ? 'bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-md border-secondary/40 shadow-[0_10px_25px_rgba(217,119,6,0.06)]' 
                  : 'bg-white/40 border-outline-variant/30 hover:border-primary/30 shadow-sm'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl border ${session.isCurrentDevice ? 'bg-secondary/15 border-secondary/20' : 'bg-[#efeeeb] border-outline-variant/20'} flex items-center justify-center`}>
                      {getDeviceIcon(session.deviceType)}
                    </div>
                    <div>
                      <h4 className="font-bold text-primary text-sm flex items-center gap-1.5">
                        {session.deviceName}
                        {session.isCurrentDevice && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest bg-secondary text-white uppercase animate-pulse shadow-sm">
                            This Device
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] font-semibold text-on-surface-variant mt-0.5">
                        {session.browser} ({session.os})
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] font-semibold text-on-surface-variant bg-black/5 p-3 rounded-2xl border border-white/20">
                  <div className="flex items-center gap-1.5">
                    <FiMapPin size={12} className="text-primary" />
                    <span className="truncate">{session.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="font-mono text-primary/80">{session.ipAddress}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/30 flex items-center justify-between text-[10px] font-semibold text-on-surface-variant">
                <div className="flex items-center gap-1">
                  <FiClock size={12} />
                  <span>
                    Active {session.isCurrentDevice ? 'now' : `last active ${new Date(session.lastActive).toLocaleDateString()}`}
                  </span>
                </div>

                {!session.isCurrentDevice && (
                  <button
                    onClick={() => handleRevoke(session._id)}
                    className="text-error hover:underline uppercase tracking-wider font-bold transition-all"
                  >
                    Revoke Session
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SecurityDashboard;
