const crypto = require('node:crypto');
const express = require('express');
const { createRateLimiter } = require('./securityMiddleware');

// The entry gate uses the same stylesheet as application templates.
const theme = require('node:fs').readFileSync(require('node:path').join(__dirname, '../../frontend/theme.css'), 'utf8');
const COOKIE = 'wfi_demo_access';
const TTL = 7 * 24 * 60 * 60;
const hash = value => crypto.createHash('sha256').update(value).digest();
const sign = expires => crypto.createHmac('sha256', process.env.DEMO_ACCESS_CODE).update(expires).digest('hex');
const equal = (a, b) => crypto.timingSafeEqual(hash(a), hash(b));

function hasAccess(req) {
  if (!process.env.DEMO_ACCESS_CODE) return true;
  const cookie = (req.headers.cookie || '').split(/;\s*/).find(part => part.startsWith(COOKIE + '='));
  const token = cookie?.slice(COOKIE.length + 1) || '';
  const match = /^(\d{10})\.([a-f0-9]{64})$/.exec(token);
  return !!match && Number(match[1]) > Math.floor(Date.now() / 1000) && equal(match[2], sign(match[1]));
}

const limit = createRateLimiter('demoAccess');
const body = express.urlencoded({ extended: false, limit: '2kb' });

function unlockPage(res, invalid = false) {
  return res.status(invalid ? 401 : 200).type('html').send(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Workforce Intelligence Demo</title>
<style>body{background:#101b32;color:#f8fafc;font:16px system-ui;display:grid;place-items:center;min-height:95vh}main{width:min(23rem,85vw)}input,button{box-sizing:border-box;width:100%;padding:.75rem;margin:.6rem 0;font:inherit;border:0;border-radius:.4rem}button{background:#2563eb;color:white;cursor:pointer}p{color:#cbd5e1}</style><style>${theme}</style>
<body class="wfi-access-gate"><main class="auth-card"><h1>Workforce Intelligence</h1><p>Enter your access code to open the demo.</p>
<form action="/demo-access" method="post"><label for="code">Access code</label><input name="code" id="code" type="password" required maxlength="128" autocomplete="current-password"><button>Open demo</button></form>
${invalid ? '<p role="alert">Incorrect access code.</p>' : ''}</main></html>`);
}

function middleware(req, res, next) {
  if (!process.env.DEMO_ACCESS_CODE) return next();
  res.set('Cache-Control', 'private, no-store');
  if (req.path === '/demo-access' && req.method === 'POST') {
    return limit(req, res, () => body(req, res, () => {
      if (typeof req.body.code !== 'string' || !equal(req.body.code, process.env.DEMO_ACCESS_CODE)) {
        return unlockPage(res, true);
      }
      const expires = String(Math.floor(Date.now() / 1000) + TTL);
      res.cookie(COOKIE, expires + '.' + sign(expires), {
        httpOnly: true, sameSite: 'strict', maxAge: TTL * 1000,
        secure: req.headers['x-forwarded-proto'] === 'https' || req.secure,
      });
      res.redirect(303, '/login.html');
    }));
  }
  if (hasAccess(req)) return next();
  // Docker probes the private container loopback; Cloudflare cannot reach it directly.
  if (req.path === '/api/health' && ['::ffff:127.0.0.1', '127.0.0.1', '::1'].includes(req.socket.remoteAddress)) return next();
  if (req.path.startsWith('/api/') || req.method !== 'GET') {
    return res.status(401).json({ message: 'Open the demo with your access code first.' });
  }
  return unlockPage(res);
}

module.exports = { middleware, hasAccess };
