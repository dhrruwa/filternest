import { create } from 'zustand';
import { authService } from '../services/services';
import { getRoleFromToken, getStoredRole, getStoredUser, normalizeRole } from '../utils/auth';

export const useAuthStore = create((set) => ({
  user: getStoredUser(),
  token: localStorage.getItem('token') || null,
  role: getStoredRole(),
  isLoading: false,
  error: null,
  userId: null, // Store userId temporarily for OTP verification

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.registerCustomer(data);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Registration failed';
      set({ error: errorMsg });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // NEW: OTP-based login - Step 1: Request OTP
  requestLoginOTP: async (email, password, userType = 'customer') => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.requestLoginOTP(email, password, userType);
      set({ userId: response.data.userId });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Login request failed';
      set({ error: errorMsg });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // NEW: OTP-based login - Step 2: Verify OTP and get token
  verifyLoginOTP: async (userId, otp, userType = 'customer') => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.verifyLoginOTP(userId, otp, userType);
      
      localStorage.setItem('token', response.data.token);
      const role = normalizeRole(response.data.role);
      const user = response.data.user;
      
      localStorage.setItem('user', JSON.stringify({ ...user, role }));
      localStorage.setItem('userType', role);
      
      set({ 
        user: { ...user, role },
        token: response.data.token,
        role,
        userId: null, // Clear temporary userId
      });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'OTP verification failed';
      set({ error: errorMsg });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password, userType = 'customer') => {
    set({ isLoading: true, error: null });
    try {
      let response;
      if (userType === 'customer') {
        response = await authService.loginCustomer(email, password);
      } else if (userType === 'agent') {
        response = await authService.loginAgent(email, password);
      } else {
        response = await authService.loginAdmin(email, password);
      }

      localStorage.setItem('token', response.data.token);
      const role = normalizeRole(
        response.data.customer?.role ||
        response.data.agent?.role ||
        response.data.admin?.role ||
        getRoleFromToken(response.data.token) ||
        userType
      );
      const user = response.data.customer || response.data.agent || response.data.admin || { role };
      localStorage.setItem('user', JSON.stringify({ ...user, role }));
      localStorage.setItem('userType', role);
      
      set({ 
        user: { ...user, role },
        token: response.data.token,
        role,
      });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Login failed';
      set({ error: errorMsg });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    set({ user: null, token: null, role: null, userId: null });
  },

  verifyOTP: async (email, otp, role = 'customer') => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.verifyOTP(email, otp, role);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'OTP verification failed';
      set({ error: errorMsg });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resendOTP: async (email, role = 'customer') => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.resendOTP(email, role);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Could not resend OTP';
      set({ error: errorMsg });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  hydrateFromStorage: () => set({
    user: getStoredUser(),
    token: localStorage.getItem('token') || null,
    role: getStoredRole(),
  }),

  clearError: () => set({ error: null }),
}));
