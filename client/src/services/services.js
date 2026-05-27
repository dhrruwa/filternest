import api from './api';

// Auth services
export const authService = {
  registerCustomer: (data) => api.post('/auth/register/customer', data),
  
  // OTP-based login (Two-step process)
  requestLoginOTP: (email, password, userType = 'customer') => 
    api.post('/auth/login/request-otp', { email, password, userType }),
  verifyLoginOTP: (userId, otp, userType = 'customer') =>
    api.post('/auth/login/verify-otp', { userId, otp, userType }),
  
  // Legacy login methods (kept for backward compatibility)
  loginCustomer: (email, password) => api.post('/auth/login/customer', { email, password }),
  loginAgent: (agentId, passcode) => api.post('/auth/login/agent', { agentId, passcode }),
  loginAdmin: (email, password) => api.post('/auth/login/admin', { email, password }),
  
  // Email verification OTP
  verifyOTP: (email, otp, role) => api.post('/auth/verify-otp', { email, otp, role }),
  resendOTP: (email, role) => api.post('/auth/resend-otp', { email, role }),
  
  // Password reset
  forgotPassword: (email, userType) => api.post('/auth/forgot-password', { email, userType }),
  resetPassword: (token, newPassword, userType) =>
    api.post('/auth/reset-password', { token, newPassword, userType }),
  applyAgent: (data) => api.post('/auth/agent/apply', data),
  uploadAgentAvatar: (formData) => api.post('/auth/agent/upload-avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Customer services
export const customerService = {
  getProfile: () => api.get('/customers/profile'),
  updateProfile: (data) => api.put('/customers/profile', data),
  updateLocation: (latitude, longitude) =>
    api.put('/customers/location', { latitude, longitude }),
  getDashboard: () => api.get('/customers/dashboard'),
  getBookings: (params) => api.get('/customers/bookings', { params }),
  getInvoices: () => api.get('/customers/invoices'),
  getInvoicePdfUrl: (id) => {
    const token = localStorage.getItem('token');
    const base = api.defaults.baseURL || '/api';
    return `${base}/customers/invoices/${id}/pdf${token ? `?token=${token}` : ''}`;
  },
  getPayments: () => api.get('/customers/payments'),
  simulateCheckout: (invoiceId, method) => api.post('/customers/payments/simulate', { invoiceId, method }),
  getNotifications: () => api.get('/customers/notifications'),
  markNotificationRead: (id) => api.put(`/customers/notifications/${id}/read`),
  deleteNotification: (id) => api.delete(`/customers/notifications/${id}`),
  getSupportTickets: () => api.get('/customers/support/tickets'),
  createSupportTicket: (data) => api.post('/customers/support/tickets', data),
  addSupportTicketMessage: (id, text) => api.post(`/customers/support/tickets/${id}/messages`, { text }),
  getReminders: () => api.get('/customers/reminders'),
  snoozeReminder: (id) => api.put(`/customers/reminders/${id}/snooze`),
  rescheduleReminder: (id, customDate) => api.put(`/customers/reminders/${id}/reschedule`, { customDate }),
};

// Booking services
export const bookingService = {
  createBooking: (data) => api.post('/bookings', data),
  getCustomerBookings: () => api.get('/bookings/customer'),
  getBookingDetails: (bookingId) => api.get(`/bookings/${bookingId}`),
  cancelBooking: (bookingId, reason) => api.put(`/bookings/${bookingId}/cancel`, { reason }),
  updateBookingStatus: (bookingId, data) => api.put(`/bookings/${bookingId}/status`, data),
  submitFeedback: (bookingId, rating, review) => api.put(`/bookings/${bookingId}/feedback`, { rating, review }),
  getPublicReviews: () => api.get('/bookings/reviews/public'),
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
  
  // Attendance
  checkIn: () => api.post('/agents/attendance/check-in'),
  checkOut: () => api.post('/agents/attendance/check-out'),
  getAttendanceHeatmap: () => api.get('/agents/attendance/heatmap'),

  // Earnings
  getEarnings: () => api.get('/agents/earnings'),
  requestWithdrawal: (amount) => api.post('/agents/earnings/withdraw', { amount }),

  // GPS logs ping
  logGPSPing: (latitude, longitude, activeBookingId) => 
    api.post('/agents/location/ping', { latitude, longitude, activeBookingId }),

  // Booking lifecycle FSM
  acceptJob: (bookingId) => api.put(`/agents/bookings/${bookingId}/accept`),
  rejectJob: (bookingId, reason) => api.put(`/agents/bookings/${bookingId}/reject`, { reason }),
  transitionJobStatus: (bookingId, status, latitude, longitude) => 
    api.put(`/agents/bookings/${bookingId}/transition`, { status, latitude, longitude }),
  submitCompletionProof: (bookingId, signature, remarks, purityData) => 
    api.post(`/agents/bookings/${bookingId}/complete-proof`, { signature, remarks, purityData })
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
};

// Notification services
export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
};

// Service services
export const serviceService = {
  getAllServices: () => api.get('/services'),
  getServiceByType: (serviceType) => api.get(`/services/${serviceType}`),
};
