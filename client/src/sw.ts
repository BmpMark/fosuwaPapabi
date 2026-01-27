// // Enhanced Service Worker for Fosua Papabi Hotel PWA
// // Handles offline functionality, intelligent caching, and background sync

// /// <reference lib="webworker" />

// declare const self: ServiceWorkerGlobalScope;

// // Cache names
// const CACHE_NAME_STATIC = 'fosua-papabi-static-v1';
// const CACHE_NAME_DYNAMIC = 'fosua-papabi-dynamic-v1';
// const CACHE_NAME_API = 'fosua-papabi-api-v1';
// const CACHE_NAME_IMAGES = 'fosua-papabi-images-v1';

// // Resources to cache immediately
// const STATIC_ASSETS = [
//   '/',
//   '/offline',
//   '/manifest.json',
//   '/icon-192x192.png',
//   '/icon-512x512.png',
// ];

// // API endpoints that should be cached for offline access
// const API_ENDPOINTS = [
//   '/api/rooms',
//   '/api/menu',
//   '/api/reservations',
// ];

// // Install event - cache static assets
// self.addEventListener('install', (event) => {
//   console.log('Service Worker installing for Fosua Papabi Hotel PWA.');
//   event.waitUntil(
//     Promise.all([
//       // Cache static assets
//       caches.open(CACHE_NAME_STATIC).then((cache) => {
//         console.log('Caching static assets');
//         return cache.addAll(STATIC_ASSETS);
//       }),
//       // Skip waiting to activate immediately
//       self.skipWaiting(),
//     ])
//   );
// });

// // Activate event - clean up old caches
// self.addEventListener('activate', (event) => {
//   console.log('Service Worker activating for Fosua Papabi Hotel PWA.');
//   event.waitUntil(
//     Promise.all([
//       // Clean up old caches
//       caches.keys().then((cacheNames) => {
//         return Promise.all(
//           cacheNames.map((cacheName) => {
//             if (cacheName !== CACHE_NAME_STATIC &&
//                 cacheName !== CACHE_NAME_DYNAMIC &&
//                 cacheName !== CACHE_NAME_API &&
//                 cacheName !== CACHE_NAME_IMAGES) {
//               console.log('Deleting old cache:', cacheName);
//               return caches.delete(cacheName);
//             }
//           })
//         );
//       }),
//       // Take control of all clients immediately
//       self.clients.claim(),
//     ])
//   );
// });

// // Fetch event - intelligent caching strategies
// self.addEventListener('fetch', (event) => {
//   const { request } = event;
//   const url = new URL(request.url);

//   // Skip non-GET requests
//   if (request.method !== 'GET') return;

//   // Handle different types of requests with appropriate caching strategies
//   if (url.pathname.startsWith('/api/')) {
//     // API requests - Network first with cache fallback
//     event.respondWith(handleApiRequest(request));
//   } else if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
//     // Images - Cache first with network fallback
//     event.respondWith(handleImageRequest(request));
//   } else if (STATIC_ASSETS.includes(url.pathname) || url.pathname.startsWith('/dashboard/')) {
//     // Static assets and dashboard pages - Cache first
//     event.respondWith(handleStaticRequest(request));
//   } else {
//     // Other requests - Network first with offline page fallback
//     event.respondWith(handleNetworkFirst(request));
//   }
// });

// // API request handler - Network first strategy
// async function handleApiRequest(request: Request): Promise<Response> {
//   try {
//     // Try network first
//     const networkResponse = await fetch(request);
//     if (networkResponse.ok) {
//       // Cache successful responses
//       const cache = await caches.open(CACHE_NAME_API);
//       cache.put(request, networkResponse.clone());
//       return networkResponse;
//     }
//   } catch (error) {
//     console.log('Network failed for API request, trying cache');
//   }

//   // Fallback to cache
//   const cachedResponse = await caches.match(request);
//   if (cachedResponse) {
//     return cachedResponse;
//   }

//   // Return offline data structure
//   return new Response(JSON.stringify({ error: 'Offline', message: 'Data not available offline' }), {
//     status: 503,
//     headers: { 'Content-Type': 'application/json' },
//   });
// }

// // Image request handler - Cache first strategy
// async function handleImageRequest(request: Request): Promise<Response> {
//   // Try cache first
//   const cachedResponse = await caches.match(request);
//   if (cachedResponse) {
//     return cachedResponse;
//   }

//   try {
//     // Try network
//     const networkResponse = await fetch(request);
//     if (networkResponse.ok) {
//       // Cache the response
//       const cache = await caches.open(CACHE_NAME_IMAGES);
//       cache.put(request, networkResponse.clone());
//       return networkResponse;
//     }
//   } catch (error) {
//     console.log('Network failed for image request');
//   }

//   // Return a placeholder or offline indicator
//   return new Response('', { status: 404 });
// }

// // Static request handler - Cache first strategy
// async function handleStaticRequest(request: Request): Promise<Response> {
//   const cachedResponse = await caches.match(request);
//   if (cachedResponse) {
//     return cachedResponse;
//   }

//   try {
//     const networkResponse = await fetch(request);
//     if (networkResponse.ok) {
//       const cache = await caches.open(CACHE_NAME_STATIC);
//       cache.put(request, networkResponse.clone());
//     }
//     return networkResponse;
//   } catch (error) {
//     // For dashboard pages, redirect to offline page
//     if (request.url.includes('/dashboard/')) {
//       const offlineUrl = new URL('/offline', self.location.origin);
//       return Response.redirect(offlineUrl.toString(), 302);
//     }
//     return fetch(request);
//   }
// }

// // Network first with offline fallback
// async function handleNetworkFirst(request: Request): Promise<Response> {
//   try {
//     const networkResponse = await fetch(request);
//     if (networkResponse.ok) {
//       // Cache dynamic content
//       const cache = await caches.open(CACHE_NAME_DYNAMIC);
//       cache.put(request, networkResponse.clone());
//       return networkResponse;
//     }
//   } catch (error) {
//     console.log('Network failed, trying cache');
//   }

//   // Try cache
//   const cachedResponse = await caches.match(request);
//   if (cachedResponse) {
//     return cachedResponse;
//   }

//   // Return offline page for navigation requests
//   if (request.mode === 'navigate') {
//     const offlineResponse = await caches.match('/offline');
//     return offlineResponse || new Response('Offline', { status: 503 });
//   }

//   return new Response('Offline', { status: 503 });
// }

// // Background sync for room service orders
// self.addEventListener('sync', (event) => {
//   if (event.tag === 'background-sync') {
//     event.waitUntil(syncPendingData());
//   }
// });

// // Sync pending data when back online
// async function syncPendingData() {
//   try {
//     // Get pending orders from IndexedDB or cache
//     const pendingOrders = await getPendingOrders();

//     for (const order of pendingOrders) {
//       try {
//         const response = await fetch('/api/orders', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify(order),
//         });

//         if (response.ok) {
//           // Remove from pending orders
//           await removePendingOrder(order.id);
//           // Notify the app
//           notifyClients('order-synced', { orderId: order.id });
//         }
//       } catch (error) {
//         console.error('Failed to sync order:', order.id, error);
//       }
//     }
//   } catch (error) {
//     console.error('Background sync failed:', error);
//   }
// }

// // Push notifications
// self.addEventListener('push', (event) => {
//   if (!event.data) return;

//   const data = event.data.json();

//   const options = {
//     body: data.body,
//     icon: '/icon-192x192.png',
//     badge: '/icon-192x192.png',
//     vibrate: [100, 50, 100],
//     data: {
//       url: data.url || '/',
//       type: data.type,
//     },
//     actions: data.actions || [],
//   };

//   event.waitUntil(
//     self.registration.showNotification(data.title, options)
//   );
// });

// // Handle notification clicks
// self.addEventListener('notificationclick', (event) => {
//   event.notification.close();

//   const urlToOpen = event.notification.data?.url || '/';

//   event.waitUntil(
//     self.clients.matchAll({ type: 'window' }).then((windowClients) => {
//       // Check if there is already a window/tab open with the target URL
//       for (const client of windowClients) {
//         if (client.url === urlToOpen && 'focus' in client) {
//           return (client as any).focus();
//         }
//       }
//       // If not, open a new window/tab with the target URL
//       if (self.clients.openWindow) {
//         return self.clients.openWindow(urlToOpen);
//       }
//     })
//   );
// });

// // Message handler for communication with main thread
// self.addEventListener('message', (event) => {
//   const { type, data } = event.data || {};

//   switch (type) {
//     case 'SKIP_WAITING':
//       self.skipWaiting();
//       break;

//     case 'GET_VERSION':
//       event.ports[0].postMessage({ version: '1.0.0' });
//       break;

//     case 'STORE_OFFLINE_DATA':
//       storeOfflineData(data.key, data.value);
//       break;

//     case 'SYNC_DATA':
//       if ('sync' in self.registration) {
//         self.registration.sync.register('background-sync');
//       }
//       break;

//     case 'CACHE_RESERVATION':
//       cacheReservationData(data.reservation);
//       break;

//     case 'CACHE_MENU':
//       cacheMenuData(data.menu);
//       break;

//     default:
//       console.log('Unknown message type:', type);
//   }
// });

// // Store data for offline use
// async function storeOfflineData(key: string, data: any) {
//   try {
//     const cache = await caches.open(CACHE_NAME_API);
//     const response = new Response(JSON.stringify(data), {
//       headers: { 'Content-Type': 'application/json' }
//     });
//     await cache.put(new Request(`/offline/${key}`), response);
//   } catch (error) {
//     console.error('Failed to store offline data:', error);
//   }
// }

// // Cache reservation data for offline access
// async function cacheReservationData(reservation: any) {
//   const cache = await caches.open(CACHE_NAME_API);
//   const response = new Response(JSON.stringify(reservation), {
//     headers: { 'Content-Type': 'application/json' }
//   });
//   await cache.put(new Request(`/api/reservations/${reservation.id}`), response);
// }

// // Cache menu data for offline access
// async function cacheMenuData(menu: any[]) {
//   const cache = await caches.open(CACHE_NAME_API);
//   const response = new Response(JSON.stringify(menu), {
//     headers: { 'Content-Type': 'application/json' }
//   });
//   await cache.put(new Request('/api/menu'), response);
// }

// // IndexedDB helpers for pending orders (simplified)
// async function getPendingOrders() {
//   // In a real implementation, you'd use IndexedDB
//   // For now, return empty array
//   return [];
// }

// async function removePendingOrder(orderId: string) {
//   // Remove from IndexedDB
//   console.log('Removing pending order:', orderId);
// }

// // Notify all clients
// async function notifyClients(type: string, data: any) {
//   const clients = await self.clients.matchAll();
//   clients.forEach(client => {
//     client.postMessage({ type, data });
//   });
// }













// /// <reference lib="webworker" />

// declare const self: ServiceWorkerGlobalScope;

// /* =======================
//    CACHE CONFIG
// ======================= */
// const CACHE_NAME_STATIC = 'fosua-papabi-static-v1';
// const CACHE_NAME_DYNAMIC = 'fosua-papabi-dynamic-v1';
// const CACHE_NAME_API = 'fosua-papabi-api-v1';
// const CACHE_NAME_IMAGES = 'fosua-papabi-images-v1';

// const STATIC_ASSETS = [
//   '/',
//   '/offline',
//   '/manifest.json',
//   '/icon-192x192.png',
//   '/icon-512x512.png',
// ];

// /* =======================
//    INSTALL
// ======================= */
// self.addEventListener('install', (event: ExtendableEvent) => {
//   console.log('[SW] Installing...');
//   event.waitUntil(
//     Promise.all([
//       caches.open(CACHE_NAME_STATIC).then(cache => cache.addAll(STATIC_ASSETS)),
//       self.skipWaiting(),
//     ])
//   );
// });

// /* =======================
//    ACTIVATE
// ======================= */
// self.addEventListener('activate', (event: ExtendableEvent) => {
//   console.log('[SW] Activating...');
//   event.waitUntil(
//     Promise.all([
//       caches.keys().then(cacheNames =>
//         Promise.all(
//           cacheNames.map(name => {
//             if (
//               name !== CACHE_NAME_STATIC &&
//               name !== CACHE_NAME_DYNAMIC &&
//               name !== CACHE_NAME_API &&
//               name !== CACHE_NAME_IMAGES
//             ) {
//               return caches.delete(name);
//             }
//           })
//         )
//       ),
//       self.clients.claim(),
//     ])
//   );
// });

// /* =======================
//    FETCH
// ======================= */
// self.addEventListener('fetch', (event: FetchEvent) => {
//   const request = event.request;
//   const url = new URL(request.url);

//   if (request.method !== 'GET') return;

//   if (url.pathname.startsWith('/api/')) {
//     event.respondWith(handleApiRequest(request));
//   } else if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
//     event.respondWith(handleImageRequest(request));
//   } else if (STATIC_ASSETS.includes(url.pathname)) {
//     event.respondWith(handleStaticRequest(request));
//   } else {
//     event.respondWith(handleNetworkFirst(request));
//   }
// });

// /* =======================
//    FETCH HANDLERS
// ======================= */
// async function handleApiRequest(request: Request): Promise<Response> {
//   try {
//     const network = await fetch(request);
//     if (network.ok) {
//       const cache = await caches.open(CACHE_NAME_API);
//       cache.put(request, network.clone());
//       return network;
//     }
//   } catch {}

//   const cached = await caches.match(request);
//   return (
//     cached ??
//     new Response(JSON.stringify({ error: 'Offline' }), {
//       status: 503,
//       headers: { 'Content-Type': 'application/json' },
//     })
//   );
// }

// async function handleImageRequest(request: Request): Promise<Response> {
//   const cached = await caches.match(request);
//   if (cached) return cached;

//   try {
//     const network = await fetch(request);
//     if (network.ok) {
//       const cache = await caches.open(CACHE_NAME_IMAGES);
//       cache.put(request, network.clone());
//       return network;
//     }
//   } catch {}

//   return new Response('', { status: 404 });
// }

// async function handleStaticRequest(request: Request): Promise<Response> {
//   const cached = await caches.match(request);
//   if (cached) return cached;

//   const network = await fetch(request);
//   const cache = await caches.open(CACHE_NAME_STATIC);
//   cache.put(request, network.clone());
//   return network;
// }

// async function handleNetworkFirst(request: Request): Promise<Response> {
//   try {
//     const network = await fetch(request);
//     if (network.ok) {
//       const cache = await caches.open(CACHE_NAME_DYNAMIC);
//       cache.put(request, network.clone());
//       return network;
//     }
//   } catch {}

//   const cached = await caches.match(request);
//   if (cached) return cached;

//   if (request.mode === 'navigate') {
//     return (await caches.match('/offline')) ?? new Response('Offline', { status: 503 });
//   }

//   return new Response('Offline', { status: 503 });
// }

// /* =======================
//    BACKGROUND SYNC
// ======================= */
// self.addEventListener('sync', (event: SyncEvent) => {
//   if (event.tag === 'background-sync') {
//     event.waitUntil(syncPendingData());
//   }
// });

// async function syncPendingData() {
//   console.log('[SW] Syncing pending data...');
// }

// /* =======================
//    PUSH NOTIFICATIONS
// ======================= */
// self.addEventListener('push', (event: PushEvent) => {
//   if (!event.data) return;

//   const data = event.data.json();
//   event.waitUntil(
//     self.registration.showNotification(data.title, {
//       body: data.body,
//       icon: '/icon-192x192.png',
//       badge: '/icon-192x192.png',
//       data: { url: data.url || '/' },
//     })
//   );
// });

// /* =======================
//    NOTIFICATION CLICK
// ======================= */
// self.addEventListener('notificationclick', (event: NotificationEvent) => {
//   event.notification.close();
//   const url = event.notification.data?.url || '/';

//   event.waitUntil(
//     self.clients.matchAll({ type: 'window' }).then(clients => {
//       for (const client of clients) {
//         if (client.url === url && 'focus' in client) {
//           return (client as WindowClient).focus();
//         }
//       }
//       return self.clients.openWindow(url);
//     })
//   );
// });

// /* =======================
//    MESSAGE HANDLER
// ======================= */
// self.addEventListener('message', (event: MessageEvent) => {
//   if (event.data?.type === 'SKIP_WAITING') {
//     self.skipWaiting();
//   }
// });
