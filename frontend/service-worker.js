/**
 * service-worker.js — PWA Service Worker (4th Semester)
 * ═══════════════════════════════════════════════════════
 * Implements:
 *   1. Cache-first strategy for static assets (HTML/CSS/JS)
 *   2. Network access for authenticated requests
 *   3. Offline fallback page when network is unavailable
 *   4. Background sync for queued clock-in/clock-out when offline
 *
 * Register from each HTML page:
 *   if ('serviceWorker' in navigator) {
 *     navigator.serviceWorker.register('/service-worker.js');
 *   }
 */

const CACHE_NAME    = 'wip-static';
const OFFLINE_PAGE  = '/frontend/offline.html';

// ── Static assets to pre-cache on install ────────────────────────────
const STATIC_ASSETS = [
  '/frontend/login.html',
  '/frontend/index.html',
  '/frontend/tasks.html',
  '/frontend/attendance.html',
  '/frontend/payroll.html',
  '/frontend/leaves.html',
  '/frontend/analytics.html',
  '/frontend/leaderboard.html',
  '/frontend/profile.html',
  '/frontend/reports.html',
  '/frontend/offline.html',
  '/frontend/css/style.css',
  '/frontend/js/notifications-client.js',
];

// ══════════════════════════════════════════════════════════════════════
// INSTALL — pre-cache static assets
// ══════════════════════════════════════════════════════════════════════
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v7.0…');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        // Log failures but don't block install (some pages may not exist yet)
        console.warn('[SW] Pre-cache partial failure:', err.message);
      });
    }).then(() => self.skipWaiting())
  );
});

// ══════════════════════════════════════════════════════════════════════
// ACTIVATE — clean up old caches
// ══════════════════════════════════════════════════════════════════════
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v7.0…');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k.startsWith('wip-') && k !== 'wip-v7-sync-queue')
          .map(k => { console.log('[SW] Deleting old cache:', k); return caches.delete(k); })
      )
    ).then(() => self.clients.claim())
  );
});

// ══════════════════════════════════════════════════════════════════════
// FETCH — intercept all requests
// ══════════════════════════════════════════════════════════════════════
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and browser extension URLs
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // CacheStorage is shared across users of this browser profile.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/uploads/') || request.headers.has('Authorization')) return;

  // ── Static assets: Cache-first → Network fallback ───────────────
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for HTML page navigations
        if (request.headers.get('Accept')?.includes('text/html')) {
          return caches.match(OFFLINE_PAGE);
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// ══════════════════════════════════════════════════════════════════════
// BACKGROUND SYNC — queue clock-in/out when offline
// ══════════════════════════════════════════════════════════════════════
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncQueuedAttendance());
  }
});

async function syncQueuedAttendance() {
  const cache = await caches.open('wip-v7-sync-queue');
  const keys  = await cache.keys();

  for (const request of keys) {
    const cachedResponse = await cache.match(request);
    const body = await cachedResponse.json();

    try {
      const token = body._token;
      delete body._token;

      const response = await fetch(request.url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify(body)
      });

      if (response.ok) {
        await cache.delete(request);
        console.log('[SW] Synced queued attendance:', request.url);

        // Notify open clients that sync succeeded
        const clients = await self.clients.matchAll();
        clients.forEach(client =>
          client.postMessage({ type: 'SYNC_COMPLETE', url: request.url })
        );
      }
    } catch (err) {
      console.warn('[SW] Sync failed, will retry:', err.message);
    }
  }
}

// ══════════════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS (Web Push API)
// ══════════════════════════════════════════════════════════════════════
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'WIP Notification', body: event.data.text() };
  }

  const options = {
    body:    data.body || data.message || 'You have a new notification',
    icon:    '/frontend/icons/icon-192.png',
    badge:   '/frontend/icons/icon-96.png',
    vibrate: [100, 50, 100],
    data:    { url: data.url || '/frontend/index.html' },
    actions: [
      { action: 'open',    title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Workforce Intelligence', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/frontend/index.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const existing = clients.find(c => c.url.includes(url) && 'focus' in c);
      return existing ? existing.focus() : self.clients.openWindow(url);
    })
  );
});
