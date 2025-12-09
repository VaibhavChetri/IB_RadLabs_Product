self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Delete ALL previous caches
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
  );
  
  // Unregister this worker
  self.registration.unregister().then(() => {
    console.log("Old service worker removed");
  });
});


