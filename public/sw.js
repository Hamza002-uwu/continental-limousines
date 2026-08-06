// Service Worker Continental Limousines
const CACHE_NAME = 'cl-dispatch-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

// Gestion des notifications push
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'Continental Limousines';
  const options = {
    body:    data.body || '',
    icon:    '/icon-192.png',
    badge:   '/icon-192.png',
    vibrate: data.vibrate || [200, 100, 200],
    data:    { url: data.url || '/' },
    actions: data.actions || [],
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Clic sur la notification → ouvre l'app
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus();
      } else {
        clients.openWindow(e.notification.data?.url || '/');
      }
    })
  );
});

// Fetch cache pour mode offline basique
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
