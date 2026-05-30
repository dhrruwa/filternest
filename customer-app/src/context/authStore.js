import { create } from 'zustand';
import { authService } from '../services/services';
import { getRoleFromToken, getStoredRole, getStoredUser, normalizeRole } from '../utils/auth';

export const useAuthStore = create((set) => ({
  user: getStoredUser(),
  token: localStorage.getItem('token') || null,
  role: getStoredRole(),
  isLoading: false,
  error: null,
  userId: null,

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

  requestLoginOTP: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.requestLoginOTP(email, password);
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

  verifyLoginOTP: async (userId, otp) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.verifyLoginOTP(userId, otp);
      
      localStorage.setItem('token', response.data.token);
      const role = normalizeRole(response.data.role);
      const user = response.data.user;
      
      localStorage.setItem('user', JSON.stringify({ ...user, role }));
      localStorage.setItem('userType', role);
      
      set({ 
        user: { ...user, role },
        token: response.data.token,
        role,
        userId: null,
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

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.loginCustomer(email, password);

      localStorage.setItem('token', response.data.token);
      const role = normalizeRole(
        response.data.customer?.role ||
        getRoleFromToken(response.data.token) ||
        'customer'
      );
      const user = response.data.customer || { role };
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

  verifyOTP: async (email, otp) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.verifyOTP(email, otp);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'OTP verification failed';
      set({ error: errorMsg });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resendOTP: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.resendOTP(email);
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
