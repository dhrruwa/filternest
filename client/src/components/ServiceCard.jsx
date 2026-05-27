import React from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiClock, FiMapPin, FiUser } from 'react-icons/fi';

const ServiceCard = ({ service, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -10 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="glass rounded-lg p-6 cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white group-hover:shadow-lg transition">
          <FiCheckCircle size={24} />
        </div>
      </div>
      
      <p className="text-gray-600 mb-4 line-clamp-2">{service.description}</p>
      
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <FiClock size={16} />
          <span>{service.estimatedDuration} mins</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-lg font-bold text-primary">${service.basePrice}</span>
        </div>
      </div>
      
      <button className="mt-4 w-full bg-gradient-primary text-white py-2 rounded-lg hover:shadow-lg transition-all">
        Book Now
      </button>
    </motion.div>
  );
};

export default ServiceCard;
