import api from './api';

// Agent Auth services
export const authService = {
  // Agent login (agentId + passcode)
  loginAgent: (agentId, passcode) => api.post('/auth/login/agent', { agentId, passcode }),
  
  // OTP-based login
  requestLoginOTP: (email, password) => 
    api.post('/auth/login/request-otp', { email, password, userType: 'agent' }),
  verifyLoginOTP: (userId, otp) =>
    api.post('/auth/login/verify-otp', { userId, otp, userType: 'agent' }),

  // Password reset
  forgotPassword: (email) => api.post('/auth/forgot-password', { email, userType: 'agent' }),
  resetPassword: (token, newPassword) =>
    api.post('/auth/reset-password', { token, newPassword, userType: 'agent' }),
  applyAgent: (data) => api.post('/auth/agent/apply', data),
  uploadAgentAvatar: (formData) => api.post('/auth/agent/upload-avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Agent services
export const agentService = {
  getProfile: () => api.get('/agents/profile'),
  updateProfile: (data) => api.put('/agents/profile', data),
  updateStatus: (status) => api.put('/agents/status', { status }),
  updateLocation: (latitude, longitude) => api.put('/agents/location', { latitude, longitude }),
  getAssignedBookings: () => api.get('/agents/bookings/assigned'),
  getCompletedServices: () => api.get('/agents/bookings/completed'),
  getAgentPortfolio: (agentId) => api.get(`/agents/${agentId}/portfolio`),
};

// Booking services (agent can update status)
export const bookingService = {
  getBookingDetails: (bookingId) => api.get(`/bookings/${bookingId}`),
  updateBookingStatus: (bookingId, data) => api.put(`/bookings/${bookingId}/status`, data),
};

// Notifications
export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
};
