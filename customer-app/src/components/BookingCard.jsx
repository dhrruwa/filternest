import React from 'react';
import { motion } from 'framer-motion';

const BookingCard = ({ booking }) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-lg p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-600">Booking ID</p>
          <p className="font-semibold text-gray-900">{booking.bookingId}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[booking.status]}`}>
          {booking.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-600">Service Type</p>
          <p className="font-semibold">{booking.serviceType.replace(/_/g, ' ')}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Date & Time</p>
          <p className="font-semibold">{new Date(booking.bookingDate).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-600">Service Address</p>
        <p className="text-sm font-medium text-gray-900">
          {booking.serviceLocation?.address?.street}, {booking.serviceLocation?.address?.city}
        </p>
      </div>

      {booking.assignedAgent && (
        <div className="bg-blue-50 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-600">Assigned Agent</p>
          <p className="font-semibold">{booking.assignedAgent?.firstName} {booking.assignedAgent?.lastName}</p>
          <p className="text-sm text-gray-600">{booking.assignedAgent?.phone}</p>
        </div>
      )}

      <div className="flex space-x-3">
        <button className="flex-1 px-4 py-2 bg-gradient-primary text-white rounded-lg hover:shadow-lg transition">
          View Details
        </button>
        {booking.status === 'pending' && (
          <button className="flex-1 px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition">
            Cancel
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default BookingCard;
