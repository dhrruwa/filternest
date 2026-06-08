// Structured application logger (pino).
// - JSON output in production (queryable by any log tool)
// - pretty, colorized output in development
// - redacts common sensitive fields so secrets never hit the logs
const pino = require('pino');

const isProd = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  redact: {
    paths: [
      'password',
      'newPassword',
      'currentPassword',
      'confirmPassword',
      'token',
      'refreshToken',
      'otp',
      'passcode',
      'authkey',
      '*.password',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    censor: '[REDACTED]',
  },
  // Quiet during tests.
  enabled: process.env.NODE_ENV !== 'test',
  transport: isProd ? undefined : { target: 'pino-pretty', options: { translateTime: 'SYS:standard', ignore: 'pid,hostname' } },
});

module.exports = logger;
