// Single source of truth for which browser origins may call this API.
// Used by BOTH the CORS layer and the CSRF check so they never drift apart.
//
// Production: ONLY the explicit domains listed in env vars are allowed.
//   - ALLOWED_ORIGINS : comma-separated list of full origins
//                       e.g. "https://filternest.vercel.app,https://filternest-admin.vercel.app"
//   - FRONTEND_URL    : single origin, included for backwards-compat
// No wildcards, no pattern matching.
//
// Development: localhost dev-server origins are added automatically for convenience.

const parseList = (value) =>
  (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const DEV_ORIGINS = [
  'http://localhost:3000', // customer-app
  'http://localhost:4000', // agent-app
  'http://localhost:5173', // vite dev fallback
  'http://localhost:6000', // admin-panel
  'http://localhost:6001', // admin-panel (macOS fallback)
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:6000',
  'http://127.0.0.1:6001',
];

const getAllowedOrigins = () => {
  const explicit = [
    ...parseList(process.env.ALLOWED_ORIGINS),
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  if (process.env.NODE_ENV === 'development') {
    return [...new Set([...DEV_ORIGINS, ...explicit])];
  }
  return [...new Set(explicit)];
};

// Normalize an Origin/Referer value to its origin (protocol+host) and check
// it against the explicit allow-list. Exact match only.
const isAllowedOrigin = (origin) => {
  if (!origin) return false;
  let normalized = origin;
  try {
    normalized = new URL(origin).origin;
  } catch (e) {
    // Not a parseable URL -> fall back to raw string comparison.
  }
  return getAllowedOrigins().includes(normalized);
};

module.exports = { getAllowedOrigins, isAllowedOrigin };
