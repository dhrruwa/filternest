import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiClock, FiUser, FiPhone, FiMapPin, FiTrendingUp, FiX, FiCreditCard, FiStar } from 'react-icons/fi';
import ConfirmationModal from './ConfirmationModal';
import { bookingService, agentService } from '../services/services';
import toast from 'react-hot-toast';

const BookingTracker = ({ booking, onBookingUpdated }) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Feedback submission states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Agent Portfolio states
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [portfolioData, setPortfolioData] = useState(null);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);

  const handleOpenPortfolio = async () => {
    if (!booking.assignedAgent?._id) return;
    setShowPortfolioModal(true);
    setIsLoadingPortfolio(true);
    try {
      const response = await agentService.getAgentPortfolio(booking.assignedAgent._id);
      setPortfolioData(response.data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast.error('Failed to load agent portfolio');
      setShowPortfolioModal(false);
    } finally {
      setIsLoadingPortfolio(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast.error('Please select a rating between 1 and 5 stars');
      return;
    }
    setIsSubmittingReview(true);
    try {
      await bookingService.submitFeedback(booking._id, rating, reviewText);
      toast.success('Thank you for your feedback!');
      setShowReviewModal(false);
      if (onBookingUpdated) {
        onBookingUpdated();
      } else {
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleCancelBooking = async () => {
    setIsCancelling(true);
    try {
      await bookingService.cancelBooking(booking._id);
      toast.success('Booking cancelled successfully');
      setShowCancelModal(false);
      
      // Call parent callback to refresh data if provided
      if (onBookingUpdated) {
        onBookingUpdated();
      } else {
        // Fallback: reload page after 1 second
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to cancel booking'
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const statusColors = {
    pending: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100' },
    agent_assigned: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100' },
    on_the_way: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100' },
    in_progress: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100' },
    completed: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100' },
    cancelled: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100' },
  };

  const timeline = [
    {
      step: 'Booking Placed',
      completed: true,
      icon: <FiCheck className="w-5 h-5" />,
    },
    {
      step: 'Agent Assigned',
      completed: ['agent_assigned', 'on_the_way', 'in_progress', 'completed'].includes(booking?.status),
      icon: <FiUser className="w-5 h-5" />,
    },
    {
      step: 'Agent On The Way',
      completed: ['on_the_way', 'in_progress', 'completed'].includes(booking?.status),
      icon: <FiTrendingUp className="w-5 h-5" />,
    },
    {
      step: 'Service In Progress',
      completed: ['in_progress', 'completed'].includes(booking?.status),
      icon: <FiClock className="w-5 h-5" />,
    },
    {
      step: 'Service Completed',
      completed: booking?.status === 'completed',
      icon: <FiCheck className="w-5 h-5" />,
    },
  ];

  const colors = statusColors[booking?.status] || statusColors.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border-2 p-8 ${colors.bg} ${colors.border}`}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Booking ID</p>
            <p className="text-2xl font-bold text-gray-900">{booking?._id?.slice(-8).toUpperCase()}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${colors.badge} ${colors.text}`}>
            {booking?.status?.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Service Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-gray-300">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Service Type</p>
          <p className="text-lg font-semibold text-gray-900">
            {booking?.serviceType?.replace(/_/g, ' ')}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Booking Date</p>
          <p className="text-lg font-semibold text-gray-900">
            {booking?.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        <div className="md:col-span-2">
          <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
            <FiMapPin className="w-4 h-4" /> Service Location
          </p>
          <p className="text-gray-900">
            {booking?.serviceLocation?.address?.street}, {booking?.serviceLocation?.address?.city}
          </p>
        </div>
      </div>

      {/* Agent Details - Shows when assigned */}
      {booking?.assignedAgent && (
        <div className="mb-8 pb-8 border-b border-gray-300 bg-white rounded-lg p-6">
          <p className="text-sm font-bold text-gray-600 mb-4 flex items-center gap-2">
            <FiUser className="w-4 h-4 text-primary" /> ASSIGNED AGENT
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Agent Name</p>
              <p className="text-xl font-bold text-gray-900">
                {booking.assignedAgent?.firstName} {booking.assignedAgent?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Experience</p>
              <p className="text-lg font-semibold text-gray-900">
                {booking.assignedAgent?.experience || 'Professional'}
              </p>
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <FiPhone className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-gray-600">Contact Agent</p>
                <p className="text-lg font-bold text-primary">{booking.assignedAgent?.phone}</p>
              </div>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href={`tel:${booking.assignedAgent?.phone}`}
                className="w-full px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 text-center"
              >
                <FiPhone className="w-4 h-4" /> Call Agent
              </a>
              <button
                type="button"
                onClick={handleOpenPortfolio}
                className="w-full px-4 py-3 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/5 transition flex items-center justify-center gap-2"
              >
                <FiUser className="w-4 h-4" /> View Portfolio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="mb-8">
        <p className="text-sm font-bold text-gray-600 mb-6 flex items-center gap-2">
          <FiTrendingUp className="w-4 h-4 text-primary" /> SERVICE PROGRESS
        </p>
        <div className="space-y-4">
          {timeline.map((item, index) => (
            <div key={index} className="flex items-center gap-4">
              {/* Timeline Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  item.completed
                    ? 'bg-green-500 text-white'
                    : index === timeline.findIndex((t) => !t.completed)
                      ? 'bg-primary text-white animate-pulse'
                      : 'bg-gray-300 text-gray-600'
                }`}
              >
                {item.completed ? <FiCheck className="w-5 h-5" /> : item.icon}
              </motion.div>

              {/* Timeline Text */}
              <div className="flex-1">
                <p
                  className={`font-semibold ${
                    item.completed ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {item.step}
                </p>
              </div>

              {/* Status Indicator */}
              {item.completed && <span className="text-green-600 text-sm font-semibold">✓ Done</span>}
              {index === timeline.findIndex((t) => !t.completed) && (
                <span className="text-primary text-sm font-semibold animate-pulse">Currently</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Submitted Feedback Card - display if feedback exists */}
      {booking?.status === 'completed' && booking?.feedback?.rating && (
        <div className="mb-8 p-5 bg-white border border-[#753401]/10 rounded-2xl space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
              <FiStar className="text-primary fill-primary" /> Your Rating & Review
            </h4>
            <div className="flex gap-0.5 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  size={14}
                  fill={i < booking.feedback.rating ? "currentColor" : "none"}
                  className="text-amber-500"
                />
              ))}
            </div>
          </div>
          {booking.feedback.review ? (
            <p className="text-xs text-gray-700 font-medium italic bg-[#faf9f6] p-3 rounded-xl border border-gray-100">
              "{booking.feedback.review}"
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic">No written comment provided.</p>
          )}
          <div className="flex justify-between items-center text-[10px] text-gray-400 pt-2 border-t border-[#753401]/5">
            <span>Verified Customer Feedback</span>
            <span>{booking.feedback.submittedAt ? new Date(booking.feedback.submittedAt).toLocaleDateString() : 'Just now'}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => setShowDetailsModal(true)}
          className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition"
        >
          View Full Details
        </button>
        {booking?.status === 'pending' && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="flex-1 px-4 py-3 border-2 border-red-500 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition"
          >
            Cancel Booking
          </button>
        )}
        {booking?.status === 'completed' && !booking?.feedback?.rating && (
          <button
            type="button"
            onClick={() => {
              setRating(5);
              setHoverRating(0);
              setReviewText('');
              setShowReviewModal(true);
            }}
            className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg font-semibold hover:opacity-95 shadow-md transition flex items-center justify-center gap-2"
          >
            <FiStar className="w-4 h-4 fill-white" /> Submit Review
          </button>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelBooking}
        title="Cancel Booking?"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText="Yes, Cancel Booking"
        cancelText="Keep Booking"
        type="warning"
        isLoading={isCancelling}
      />

      {/* Booking Details Modal */}
      <AnimatePresence>
        {showDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailsModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative z-10 w-full max-w-lg bg-[#faf9f6]/95 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#753401]/10">
                <div>
                  <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                    {booking?.status?.replace(/_/g, ' ')}
                  </span>
                  <h3 className="text-xl font-bold text-primary mt-2">
                    {booking?.serviceType?.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    ID: {booking?._id?.toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-primary transition-colors p-2 hover:bg-gray-100 rounded-full"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Section: Appointment Details */}
                <div className="bg-white border border-[#753401]/10 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                    <FiClock className="text-primary" /> Appointment Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-gray-500 font-medium">Scheduled Date</p>
                      <p className="text-gray-900 font-bold mt-0.5">
                        {booking?.bookingDate ? new Date(booking.bookingDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Scheduled Time</p>
                      <p className="text-gray-900 font-bold mt-0.5">
                        {booking?.bookingDate ? new Date(booking.bookingDate).toLocaleTimeString(undefined, { timeStyle: 'short' }) : 'N/A'}
                      </p>
                    </div>
                    {booking?.priority && (
                      <div>
                        <p className="text-gray-500 font-medium">Priority Level</p>
                        <p className={`font-bold mt-0.5 capitalize ${
                          booking.priority === 'high' ? 'text-red-600' :
                          booking.priority === 'medium' ? 'text-amber-600' :
                          'text-green-600'
                        }`}>
                          {booking.priority}
                        </p>
                      </div>
                    )}
                    {booking?.estimatedDuration && (
                      <div>
                        <p className="text-gray-500 font-medium">Estimated Duration</p>
                        <p className="text-gray-900 font-bold mt-0.5">
                          {booking.estimatedDuration} Minutes
                        </p>
                      </div>
                    )}
                  </div>
                  {booking?.description && (
                    <div className="pt-2.5 border-t border-[#753401]/5 text-xs">
                      <p className="text-gray-500 font-medium">Special Instructions</p>
                      <p className="text-gray-800 font-medium mt-1 leading-relaxed italic bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        "{booking.description}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Section: Agent Assigned */}
                {booking?.assignedAgent ? (
                  <div className="bg-white border border-[#753401]/10 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                      <FiUser className="text-primary" /> Assigned Service Agent
                    </h4>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#faf9f6] p-4 rounded-xl border border-gray-100 gap-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {booking.assignedAgent?.firstName} {booking.assignedAgent?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          {booking.assignedAgent?.experience || 'Certified Technician'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleOpenPortfolio}
                          className="flex items-center gap-1.5 border border-primary text-primary px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/5 transition-all shadow-sm cursor-pointer"
                        >
                          <FiUser size={12} /> Portfolio
                        </button>
                        <a
                          href={`tel:${booking.assignedAgent?.phone}`}
                          className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-all shadow-sm text-center"
                        >
                          <FiPhone size={12} /> Call
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-[#753401]/25 rounded-2xl p-5 text-center">
                    <FiUser className="mx-auto text-gray-300 mb-2" size={24} />
                    <p className="text-xs font-bold text-gray-600">Assigning Best Agent</p>
                    <p className="text-[11px] text-gray-400 mt-1 max-w-[280px] mx-auto leading-relaxed">
                      We are pairing your request with our nearest certified filter expert. You will receive an alert once assigned.
                    </p>
                  </div>
                )}

                {/* Section: Service Address */}
                <div className="bg-white border border-[#753401]/10 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                    <FiMapPin className="text-primary" /> Service Location
                  </h4>
                  <div className="text-xs text-gray-900 space-y-2">
                    <div>
                      <p className="text-gray-500 font-medium">Address</p>
                      <p className="font-semibold text-gray-900 mt-0.5 leading-relaxed">
                        {booking?.serviceLocation?.address?.street || 'N/A'}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-gray-500 font-medium">City</p>
                        <p className="font-semibold text-gray-900 mt-0.5">{booking?.serviceLocation?.address?.city || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">State</p>
                        <p className="font-semibold text-gray-900 mt-0.5">{booking?.serviceLocation?.address?.state || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">Pincode</p>
                        <p className="font-semibold text-gray-900 mt-0.5">{booking?.serviceLocation?.address?.pincode || 'N/A'}</p>
                      </div>
                    </div>
                    {booking?.serviceLocation?.address?.landmark && (
                      <div className="pt-2 border-t border-[#753401]/5 flex items-center gap-1.5 text-gray-700">
                        <FiMapPin size={12} className="text-primary" />
                        <span className="font-medium">Landmark:</span> {booking.serviceLocation.address.landmark}
                      </div>
                    )}
                  </div>
                </div>

                {/* Section: Pricing & Cost */}
                <div className="bg-white border border-[#753401]/10 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                    <FiCreditCard className="text-primary" /> Pricing & Payment
                  </h4>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Service Charge</span>
                      <span className="font-semibold">₹{booking?.cost?.serviceFee || 200}</span>
                    </div>
                    {booking?.cost?.partsCost > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Parts & Spares</span>
                        <span className="font-semibold">₹{booking.cost.partsCost}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600">
                      <span>Taxes & GST (18%)</span>
                      <span className="font-semibold">
                        ₹{booking?.cost?.tax || ((booking?.cost?.serviceFee || 200) * 0.18).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-primary pt-2.5 border-t border-dashed border-[#753401]/10">
                      <span>Total Amount Paid</span>
                      <span>
                        ₹{booking?.cost?.totalCost || ((booking?.cost?.serviceFee || 200) * 1.18).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#753401]/5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium">Status:</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        booking?.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' :
                        booking?.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {booking?.paymentStatus || 'pending'}
                      </span>
                    </div>
                    {booking?.paymentMethod && (
                      <p className="text-gray-500">
                        <span className="font-medium">Method:</span> <span className="font-bold text-gray-800 uppercase">{booking.paymentMethod}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-8">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:opacity-95 transition-all shadow-md active:scale-[0.98]"
                >
                  Back to Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Submit Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReviewModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative z-10 w-full max-w-md bg-[#faf9f6]/95 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 shadow-2xl"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#753401]/10">
                <div>
                  <h3 className="text-xl font-bold text-primary">Submit Rating & Review</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Help us improve by rating your service experience.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-primary transition-colors p-2 hover:bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-6">
                {/* Stars selector */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-secondary uppercase tracking-wider">Select Rating</span>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-amber-500 hover:scale-110 active:scale-95 transition-all focus:outline-none"
                      >
                        <FiStar
                          size={36}
                          fill={(hoverRating || rating) >= star ? "currentColor" : "none"}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-700 mt-1">
                    {rating === 5 ? 'Excellent Service!' :
                     rating === 4 ? 'Very Good Service' :
                     rating === 3 ? 'Good Service' :
                     rating === 2 ? 'Needs Improvement' :
                     'Poor Service'}
                  </span>
                </div>

                {/* Text Review */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider">
                    Write a Review (Optional)
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                    placeholder="Tell us about the filter quality, technician behavior, and your overall experience..."
                    className="w-full px-4 py-3 bg-white border border-[#753401]/10 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all duration-300 resize-none"
                  />
                </div>

                {/* Submit actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 py-3 px-4 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="flex-1 py-3 px-4 bg-gradient-primary text-white font-bold rounded-xl text-sm hover:opacity-95 disabled:opacity-50 transition-all shadow-md active:scale-95"
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Agent Portfolio Modal */}
      <AnimatePresence>
        {showPortfolioModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPortfolioModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative z-10 w-full max-w-lg bg-[#faf9f6]/95 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#753401]/10">
                <div>
                  <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                    Agent Portfolio
                  </span>
                  <h3 className="text-xl font-bold text-primary mt-2">
                    {booking.assignedAgent?.firstName} {booking.assignedAgent?.lastName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPortfolioModal(false)}
                  className="text-gray-400 hover:text-primary transition-colors p-2 hover:bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <FiX size={20} />
                </button>
              </div>

              {isLoadingPortfolio ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                    Loading Portfolio...
                  </p>
                </div>
              ) : portfolioData ? (
                <div className="space-y-6">
                  {/* Rating stats */}
                  <div className="bg-white border border-[#753401]/10 rounded-2xl p-5 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Rating</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <FiStar size={16} fill="#f59e0b" className="text-amber-500" />
                        <span className="text-lg font-bold text-gray-900">
                          {portfolioData.agent?.rating > 0 ? portfolioData.agent.rating : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total Reviews</p>
                      <span className="block text-lg font-bold text-gray-900 mt-1">
                        {portfolioData.agent?.totalRatings || 0}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Completed Jobs</p>
                      <span className="block text-lg font-bold text-gray-900 mt-1">
                        {portfolioData.agent?.completedJobs || 0}
                      </span>
                    </div>
                  </div>

                  {/* Skills / Bio */}
                  <div className="bg-white border border-[#753401]/10 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">Expertise & Skills</h4>
                    {portfolioData.agent?.skills?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {portfolioData.agent.skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-[#faf9f6] border border-gray-100 rounded-lg text-xs font-medium text-gray-700"
                          >
                            {s.skill} ({s.yearsOfExperience} yrs)
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">Certified Reverse Osmosis & Plumbing Specialist.</p>
                    )}
                  </div>

                  {/* Past Reviews Log */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-secondary uppercase tracking-wider px-1">Customer Reviews</h4>
                    {portfolioData.reviews?.length > 0 ? (
                      <div className="space-y-4">
                        {portfolioData.reviews.map((rev, idx) => (
                          <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2.5 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-gray-800">{rev.customerName}</span>
                              <div className="flex gap-0.5 text-amber-500">
                                {[...Array(5)].map((_, i) => (
                                  <FiStar
                                    key={i}
                                    size={12}
                                    fill={i < rev.feedback?.rating ? "currentColor" : "none"}
                                    className="text-amber-500"
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="inline-block text-[9px] bg-primary/5 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              {rev.serviceType?.replace(/_/g, ' ')}
                            </span>
                            {rev.feedback?.review && (
                              <p className="text-xs text-gray-600 italic font-medium leading-relaxed bg-[#faf9f6] p-3 rounded-xl">
                                "{rev.feedback.review}"
                              </p>
                            )}
                            <p className="text-[9px] text-gray-400 text-right">
                              Verified Service Booking • {rev.feedback?.submittedAt ? new Date(rev.feedback.submittedAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic text-center py-6">
                        No reviews submitted yet for this agent portfolio.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic text-center py-6">
                  Agent details are currently unavailable.
                </p>
              )}

              {/* Close Button */}
              <div className="mt-8 pt-4 border-t border-[#753401]/10">
                <button
                  type="button"
                  onClick={() => setShowPortfolioModal(false)}
                  className="w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:opacity-95 transition-all shadow-md active:scale-[0.98]"
                >
                  Close Portfolio
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BookingTracker;
