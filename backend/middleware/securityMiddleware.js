/** Response headers, request limits and legacy query sanitization. */

// ── 1. SECURITY HEADERS (Helmet-equivalent) ───────────────────────────────────
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // XSS Protection (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
  // Content Security Policy
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://cdn.jsdelivr.net; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https:; " +
    "connect-src 'self' https://api.open-meteo.com https://nominatim.openstreetmap.org https://ip-api.com; " +
    "frame-ancestors 'none';"
  );
  // HSTS (force HTTPS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // Remove server fingerprint
  res.removeHeader('X-Powered-By');
  next();
};

// Share fixed-window limits through Redis. A local store is available for standalone development.
const { createHash } = require('node:crypto');
const { clientIp } = require('../services/requestIdentity');
const cache = require('../services/cacheService');
const localLimits = new Map();
const rateLimits = {
  chat: { windowMs: 60_000, max: 12 },
  signOutFeedback: { windowMs: 60_000, max: 30 },
  passwordRecovery: { windowMs: 900_000, max: 20 },
  passwordRecoveryAccount: { windowMs: 900_000, max: 3 },
  passwordRecoveryRedeem: { windowMs: 900_000, max: 30 },
  demoAccess: { windowMs: 900_000, max: 30 },
  login: { windowMs: 900_000, max: 10, variable: 'RATE_LIMIT_LOGIN' },
  passwordAccount: { windowMs: 900_000, max: 15, variable: 'RATE_LIMIT_LOGIN_ACCOUNT' },
  register: { windowMs: 3_600_000, max: 5, variable: 'RATE_LIMIT_REGISTER' }
};

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of localLimits) {
    if (record.expiresAt <= now) localLimits.delete(key);
  }
}, 60_000).unref();

async function countAttempts(key, windowMs) {
  const shared = await cache.incrementWindow(key, windowMs);
  if (shared) return shared;
  if (process.env.REDIS_URL && process.env.NODE_ENV === 'production')
    throw new Error('Shared rate limit store unavailable.');
  const now = Date.now();
  let record = localLimits.get(key);
  if (!record || record.expiresAt <= now) {
    record = { count: 0, expiresAt: now + windowMs };
    localLimits.set(key, record);
  }
  return [++record.count, record.expiresAt - now];
}

function createRateLimiter(type) {
  const config = rateLimits[type];
  return async (request, response, next) => {
    let identity = clientIp(request) || 'unknown';
    if (type === 'chat' && request.user) identity = request.user.user_id;
    if (type === 'passwordAccount' || type === 'passwordRecoveryAccount') {
      if (typeof request.body.email !== 'string' || request.body.email.length > 120) return next();
      identity = createHash('sha256').update(request.body.email.trim().toLowerCase()).digest('hex');
    }
    const configuredMax = Number(process.env[config.variable]);
    const limit = Number.isInteger(configuredMax) && configuredMax > 0 ? configuredMax : config.max;
    try {
      const [count, remainingMs] = await countAttempts('rate:' + type + ':' + identity, config.windowMs);
      const retryAfter = Math.max(1, Math.ceil(remainingMs / 1000));
      response.set('X-RateLimit-Limit', String(limit));
      response.set('X-RateLimit-Remaining', String(Math.max(0, limit - count)));
      response.set('X-RateLimit-Reset', String(Math.ceil(Date.now() / 1000) + retryAfter));
      if (count > limit) {
        response.set('Retry-After', String(retryAfter));
        return response.status(429).json({ message: 'Too many requests. Try again later.', retryAfter });
      }
      next();
    } catch (error) {
      console.error('Rate limit unavailable:', error.message);
      response.status(503).json({ message: 'Try again in a moment.' });
    }
  };
}

// ── 3. INPUT SANITIZATION ─────────────────────────────────────────────────────
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=/gi,           // onclick=, onerror=, etc.
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /eval\s*\(/gi,
  /expression\s*\(/gi,
];

const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  let clean = str.trim();
  // Strip XSS patterns
  XSS_PATTERNS.forEach(p => { clean = clean.replace(p, ''); });
  // Encode HTML entities
  clean = clean
    .replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return clean;
};

const sanitizeObject = (obj, depth = 0) => {
  if (depth > 8) return obj; // prevent deep recursion
  if (typeof obj === 'string') return sanitizeString(obj);
  if (typeof obj === 'number' || typeof obj === 'boolean') return obj;
  if (Array.isArray(obj)) return obj.map(v => sanitizeObject(v, depth + 1));
  if (obj && typeof obj === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      // Sanitize key as well (prevent prototype pollution)
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      clean[sanitizeString(k)] = sanitizeObject(v, depth + 1);
    }
    return clean;
  }
  return obj;
};

const sanitizeInputs = (req, res, next) => {
  if (req.body)  req.body  = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  // Don't sanitize params deeply — they're usually IDs
  next();
};

module.exports = {
  securityHeaders,
  createRateLimiter,
  loginRateLimiter: createRateLimiter('login'),
  passwordAccountRateLimiter: createRateLimiter('passwordAccount'),
  registerRateLimiter: createRateLimiter('register'),
  sanitizeInputs
};
