const CACHE_NAME = 'amex-store-v5';
const LOCAL_ASSETS = [
  './',
  './amexstore.html',
  './perfil.html',
  './style.css',
  './assets/fonts/inter.css',
  './assets/fontawesome/css/all.min.css',
  './script.js',
  './scripts/account-page.js',
  './scripts/modules/account-suite.js',
  './manifest.json',
  './Pngs/logo.gif',
  './Pngs/amex store.avif',
  './Pngs/amex store.webp',
  './Pngs/amex store.png',
  './Pngs/valorant aim color.avif',
  './Pngs/valorant aim color.webp',
  './Pngs/valorant aim color.png',
  './Pngs/VALORANT BYPASS.avif',
  './Pngs/VALORANT BYPASS.webp',
  './Pngs/VALORANT BYPASS.png',
  './Pngs/VALORANT NFA.avif',
  './Pngs/VALORANT NFA.webp',
  './Pngs/VALORANT NFA.png',
  './Pngs/LEAGUEOFMENU.avif',
  './Pngs/LEAGUEOFMENU.webp',
  './Pngs/LEAGUEOFMENU.png',
  './Pngs/VAVAALE.avif',
  './Pngs/VAVAALE.webp',
  './Pngs/VAVAALE.png',
  './Formas de pagamento/pix.svg',
  './Formas de pagamento/visa.svg',
  './Formas de pagamento/mastercard.svg',
  './Formas de pagamento/elo.svg',
  './Formas de pagamento/hipercard.svg',
  './Formas de pagamento/american-express.svg',
  './Formas de pagamento/discover.svg',
  './assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa0ZL7SUc.woff2',
  './assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2',
  './assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1pL7SUc.woff2',
  './assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa25L7SUc.woff2',
  './assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2JL7SUc.woff2',
  './assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2pL7SUc.woff2',
  './assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2ZL7SUc.woff2',
  './assets/fontawesome/webfonts/fa-brands-400.woff2',
  './assets/fontawesome/webfonts/fa-regular-400.woff2',
  './assets/fontawesome/webfonts/fa-solid-900.woff2',
  './assets/fontawesome/webfonts/fa-v4compatibility.woff2',
  './assets/fontawesome/webfonts/fa-brands-400.ttf',
  './assets/fontawesome/webfonts/fa-regular-400.ttf',
  './assets/fontawesome/webfonts/fa-solid-900.ttf',
  './assets/fontawesome/webfonts/fa-v4compatibility.ttf'
];

const EXTERNAL_ASSETS = [];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    console.log('Cache opened');
    await cache.addAll(LOCAL_ASSETS);

    const results = await Promise.allSettled(EXTERNAL_ASSETS.map((url) => cache.add(url)));
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn('Falha ao armazenar recurso externo em cache:', EXTERNAL_ASSETS[index]);
      }
    });
  })());
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith((async () => {
    const cachedResponse = await caches.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(event.request);
      if (networkResponse && networkResponse.ok) {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, responseClone))
          .catch(() => {});
      }
      return networkResponse;
    } catch (error) {
      if (event.request.mode === 'navigate') {
        const fallback = await caches.match('./');
        if (fallback) {
          return fallback;
        }
      }
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    }
  })());
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push notification event
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nova promoção disponível!',
    icon: './Pngs/logo.gif',
    badge: './Pngs/logo.gif',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Produtos',
        icon: './Pngs/logo.gif'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: './Pngs/logo.gif'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Amex Store', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});

