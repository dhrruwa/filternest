// Unit tests for the security-critical pure helpers — no app or DB needed.
const { isAllowedOrigin, getAllowedOrigins } = require('../lib/allowedOrigins');
const { generateAccessToken, verifyToken, generateToken } = require('../utils/tokenUtils');

describe('allowedOrigins', () => {
  test('allows an explicitly configured origin', () => {
    expect(isAllowedOrigin('http://localhost:3000')).toBe(true);
  });

  test('rejects an unknown origin (no wildcard)', () => {
    expect(isAllowedOrigin('https://evil.example.com')).toBe(false);
    expect(isAllowedOrigin('https://filternest.vercel.app.evil.com')).toBe(false);
  });

  test('rejects empty/undefined origin', () => {
    expect(isAllowedOrigin('')).toBe(false);
    expect(isAllowedOrigin(undefined)).toBe(false);
  });

  test('normalizes a full referer URL to its origin', () => {
    expect(isAllowedOrigin('http://localhost:3000/some/path?x=1')).toBe(true);
  });

  test('the allow-list contains no wildcard entries', () => {
    expect(getAllowedOrigins().some((o) => o.includes('*'))).toBe(false);
  });
});

describe('tokenUtils', () => {
  test('access token round-trips through verifyToken', () => {
    const token = generateAccessToken('user-1', 'customer', 'sess-1');
    const decoded = verifyToken(token);
    expect(decoded).toMatchObject({ id: 'user-1', role: 'customer', sessionId: 'sess-1' });
  });

  test('verifyToken returns null for a tampered/invalid token', () => {
    expect(verifyToken('not-a-real-token')).toBeNull();
  });

  test('a token signed with the access secret verifies', () => {
    const token = generateToken('user-2', 'admin');
    expect(verifyToken(token)).toMatchObject({ id: 'user-2', role: 'admin' });
  });
});
