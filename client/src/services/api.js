import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send secure cookies with all cross-origin requests
});

// Inject Bearer Authorization token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Include standard request header to identify as safe SPA query
  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  return config;
});

// Flag to track token rotation status
let isRefreshing = false;
// Queue to hold requests that failed due to expired token during rotation
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor for auto-handling session refresh rotation
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if unauthorized is due to expired access token
    const isTokenExpired = 
      error.response?.status === 401 && 
      (error.response?.data?.code === 'TOKEN_EXPIRED' || 
       error.response?.data?.error === 'Access token expired.');

    if (isTokenExpired && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Silently request fresh access token using secure refresh cookie
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        const { token } = response.data;

        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers.Authorization = `Bearer ${token}`;

        processQueue(null, token);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Refresh failed (e.g. revoked or expired refresh token). Log out and redirect.
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');

        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?session_expired=true';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle generic unauthorized cases
    const isAuthRoute = originalRequest.url.includes('/auth/login') || 
                        originalRequest.url.includes('/auth/register') ||
                        originalRequest.url.includes('/auth/refresh');

    if (error.response?.status === 401 && !isAuthRoute && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
