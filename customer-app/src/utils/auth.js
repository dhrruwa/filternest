// Customer-only auth utilities
export const ROLE = 'customer';

export const normalizeRole = (role) => {
  if (!role) return null;
  return role;
};

export const getRoleFromToken = (token) => {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(window.atob(normalizedPayload));
    return decoded.role;
  } catch (error) {
    return null;
  }
};

export const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    localStorage.removeItem('user');
    return null;
  }
};

export const getStoredRole = () => {
  const token = localStorage.getItem('token');
  const user = getStoredUser();
  return localStorage.getItem('userType') || user?.role || getRoleFromToken(token);
};

export const isCustomer = (role) => role === ROLE;

export const getRoleLandingPath = (role) => {
  // In customer app, always go to home
  return '/';
};
