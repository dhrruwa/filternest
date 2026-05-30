import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiAlertCircle } from 'react-icons/fi';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isLoading = false,
  onReasonChange = null,
  showReasonInput = false,
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (showReasonInput && !reason.trim()) {
      return;
    }
    onConfirm(showReasonInput ? reason : null);
  };

  const typeStyles = {
    warning: {
      icon: 'bg-red-100 text-red-600',
      button: 'bg-red-600 hover:bg-red-700',
      border: 'border-red-200',
    },
    success: {
      icon: 'bg-green-100 text-green-600',
      button: 'bg-green-600 hover:bg-green-700',
      border: 'border-green-200',
    },
    info: {
      icon: 'bg-blue-100 text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
      border: 'border-blue-200',
    },
  };

  const style = typeStyles[type] || typeStyles.warning;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`${style.border} border-b-2 p-6 flex items-start justify-between`}>
            <div className="flex items-start gap-4 flex-1">
              <div className={`${style.icon} p-3 rounded-lg flex-shrink-0 mt-0.5`}>
                <FiAlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <p className="text-gray-600 text-sm mt-1">{message}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="hover:bg-gray-100 p-1 rounded-lg transition flex-shrink-0 ml-2"
            >
              <FiX size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {showReasonInput && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for cancellation
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    onReasonChange?.(e.target.value);
                  }}
                  placeholder="Tell us why you're cancelling (optional)"
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9a4d09] resize-none"
                />
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-6 flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || (showReasonInput && !reason.trim())}
              className={`flex-1 px-4 py-3 ${style.button} text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfirmationModal;
