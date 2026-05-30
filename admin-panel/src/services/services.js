import api from './api';

// Admin Auth services
export const authService = {
  // Admin login (email + password)
  loginAdmin: (email, password) => api.post('/auth/login/admin', { email, password }),
  
  // OTP-based login
  requestLoginOTP: (email, password) => 
    api.post('/auth/login/request-otp', { email, password, userType: 'admin' }),
  verifyLoginOTP: (userId, otp) =>
    api.post('/auth/login/verify-otp', { userId, otp, userType: 'admin' }),

  // Password reset
  forgotPassword: (email) => api.post('/auth/forgot-password', { email, userType: 'admin' }),
  resetPassword: (token, newPassword) =>
    api.post('/auth/reset-password', { token, newPassword, userType: 'admin' }),
};

// Admin services
export const adminService = {
  getDashboardStats: () => api.get('/admin/stats'),
  getAllCustomers: (page, limit, search) =>
    api.get('/admin/customers', { params: { page, limit, search } }),
  getAllAgents: (page, limit, status) =>
    api.get('/admin/agents', { params: { page, limit, status } }),
  createAgent: (data) => api.post('/admin/agents', data),
  approveAgent: (agentId, passcode) => api.put(`/admin/agents/${agentId}/approve`, { passcode }),
  rejectAgent: (agentId, rejectedReason) => api.put(`/admin/agents/${agentId}/reject`, { rejectedReason }),
  suspendAgent: (agentId) => api.put(`/admin/agents/${agentId}/suspend`),
  deleteAgent: (agentId) => api.delete(`/admin/agents/${agentId}`),
  getAllBookings: (page, limit, status, startDate, endDate) =>
    api.get('/admin/bookings', { params: { page, limit, status, startDate, endDate } }),
  assignAgent: (bookingId, agentId) =>
    api.post('/admin/bookings/assign-agent', { bookingId, agentId }),
  unassignAgent: (bookingId) =>
    api.post('/admin/bookings/unassign-agent', { bookingId }),
  getUpcomingReminders: () => api.get('/admin/reminders/upcoming'),
  sendEmailVerification: (email) => api.post('/admin/send-email-verification', { email }),
  checkEmailVerification: (email) => api.get(`/admin/check-email-verification?email=${encodeURIComponent(email)}`),
  uploadAvatar: (formData) => api.post('/admin/upload-avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  sendAadhaarOTP: (aadharNumber, phone) => api.post('/admin/send-aadhaar-otp', { aadharNumber, phone }),
  verifyAadhaarOTP: (aadharNumber, otp) => api.post('/admin/verify-aadhaar-otp', { aadharNumber, otp }),
  // Enterprise Control Center
  getAllPayments: (page, limit, status) => api.get('/admin/payments', { params: { page, limit, status } }),
  processRefund: (paymentId) => api.post(`/admin/payments/${paymentId}/refund`),
  getAllComplaints: (page, limit, status, priority) => api.get('/admin/complaints', { params: { page, limit, status, priority } }),
  replyToComplaint: (ticketId, text) => api.post(`/admin/complaints/${ticketId}/reply`, { text }),
  updateComplaintStatus: (ticketId, status) => api.put(`/admin/complaints/${ticketId}/status`, { status }),
  suspendCustomer: (customerId) => api.put(`/admin/customers/${customerId}/suspend`),
  broadcastNotification: (data) => api.post('/admin/notifications/broadcast', data),
};

// Booking services (admin read-only + assignment)
export const bookingService = {
  getBookingDetails: (bookingId) => api.get(`/bookings/${bookingId}`),
  getPublicReviews: () => api.get('/bookings/reviews/public'),
};

// Notifications
export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
};
