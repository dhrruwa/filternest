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
      const response = await authService.loginAdmin(email, password);

      localStorage.setItem('token', response.data.token);
      const role = normalizeRole(
        response.data.admin?.role ||
        getRoleFromToken(response.data.token) ||
        'admin'
      );
      const user = response.data.admin || { role };
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

  hydrateFromStorage: () => set({
    user: getStoredUser(),
    token: localStorage.getItem('token') || null,
    role: getStoredRole(),
  }),

  clearError: () => set({ error: null }),
}));
