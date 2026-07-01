/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// Cache-first service worker. The app shell is fully self-contained
// (no remote fetches at runtime except license validation), so once the
// shell is cached every page works offline. License validation is
// best-effort — the cached tier survives offline use up to the 7-day
// grace defined in license-state.ts.

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `ledger-cache-${version}`;
const PRECACHE = [...build, ...files];

sw.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(PRECACHE);
    })(),
  );
  void sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await sw.clients.claim();
    })(),
  );
});

sw.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never cache license-worker calls — they must reach the network.
  if (url.pathname.startsWith('/v1/')) return;
  // Same-origin only.
  if (url.origin !== sw.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        // Only cache successful basic responses.
        if (fresh.ok && fresh.type === 'basic') {
          cache.put(req, fresh.clone()).catch(() => {});
        }
        return fresh;
      } catch {
        // SPA fallback: if the network is gone and we have an index, serve it.
        const fallback = await cache.match('/');
        if (fallback) return fallback;
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })(),
  );
});
