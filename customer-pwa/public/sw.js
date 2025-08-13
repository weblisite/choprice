// Service Worker for Choprice PWA
const CACHE_NAME = 'choprice-v1';
const STATIC_CACHE = 'choprice-static-v1';
const DYNAMIC_CACHE = 'choprice-dynamic-v1';
const API_CACHE = 'choprice-api-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/menu',
  '/api/orders'
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache static files', error);
      })
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== API_CACHE) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  
  // Handle other requests
  event.respondWith(handleOtherRequests(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for', request.url);
    
    // Fall back to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for failed API requests
    return new Response(JSON.stringify({
      success: false,
      message: 'You are offline. Please check your connection.',
      offline: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Fall back to cached index.html for offline navigation
    const cachedResponse = await caches.match('/');
    return cachedResponse || new Response('Offline', { status: 200 });
  }
}

// Handle other requests with cache-first strategy
async function handleOtherRequests(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Try network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Failed to fetch', request.url);
    
    // Return fallback response
    if (request.destination === 'image') {
      return new Response('', { status: 200 });
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Push event - handle push notifications
self.addEventListener('push', event => {
  console.log('Service Worker: Push received');
  
  let notificationData = {
    title: 'Choprice',
    body: 'You have a new notification',
    icon: '/logo192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/images/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/images/xmark.png'
      }
    ]
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Service Worker: Error parsing push data', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/orders')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync event
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'background-order-sync') {
    event.waitUntil(syncOfflineOrders());
  }
  
  if (event.tag === 'background-favorite-sync') {
    event.waitUntil(syncOfflineFavorites());
  }
});

// Sync offline orders when back online
async function syncOfflineOrders() {
  try {
    console.log('Service Worker: Syncing offline orders...');
    
    // Get offline orders from IndexedDB
    const offlineOrders = await getOfflineOrders();
    
    for (const order of offlineOrders) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': order.authToken
          },
          body: JSON.stringify(order.data)
        });
        
        if (response.ok) {
          // Remove from offline storage
          await removeOfflineOrder(order.id);
          console.log('Service Worker: Order synced successfully', order.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync order', order.id, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Sync offline favorites when back online
async function syncOfflineFavorites() {
  try {
    console.log('Service Worker: Syncing offline favorites...');
    
    // Get offline favorites from IndexedDB
    const offlineFavorites = await getOfflineFavorites();
    
    for (const favorite of offlineFavorites) {
      try {
        const response = await fetch('/api/user/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': favorite.authToken
          },
          body: JSON.stringify(favorite.data)
        });
        
        if (response.ok) {
          // Remove from offline storage
          await removeOfflineFavorite(favorite.id);
          console.log('Service Worker: Favorite synced successfully', favorite.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync favorite', favorite.id, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Favorite sync failed', error);
  }
}

// IndexedDB helper functions (simplified)
async function getOfflineOrders() {
  // In a real implementation, this would use IndexedDB
  return [];
}

async function removeOfflineOrder(orderId) {
  // In a real implementation, this would remove from IndexedDB
  console.log('Removing offline order:', orderId);
}

async function getOfflineFavorites() {
  // In a real implementation, this would use IndexedDB
  return [];
}

async function removeOfflineFavorite(favoriteId) {
  // In a real implementation, this would remove from IndexedDB
  console.log('Removing offline favorite:', favoriteId);
}

// Message event - handle messages from main thread
self.addEventListener('message', event => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then(cache => cache.addAll(event.data.payload))
    );
  }
});

// Periodic background sync (experimental)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent());
  }
});

async function syncContent() {
  try {
    // Sync menu items
    const menuResponse = await fetch('/api/menu');
    if (menuResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put('/api/menu', menuResponse.clone());
    }
    
    console.log('Service Worker: Content synced successfully');
  } catch (error) {
    console.error('Service Worker: Content sync failed', error);
  }
}