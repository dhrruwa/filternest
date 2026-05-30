// Admin-only auth utilities
export const ROLES = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

export const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN];

export const normalizeRole = (role) => {
  if (!role) return null;
  if (role === 'manager') return ROLES.ADMIN;
  return role;
};

export const getRoleFromToken = (token) => {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(window.atob(normalizedPayload));
    return normalizeRole(decoded.role);
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
  return normalizeRole(localStorage.getItem('userType') || user?.role || getRoleFromToken(token));
};

export const isAdmin = (role) => ADMIN_ROLES.includes(normalizeRole(role));
