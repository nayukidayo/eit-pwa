const CACHE_NAME = 'eit-debug-v1'

async function preCache() {
  const cache = await caches.open(CACHE_NAME)
  // auto-generated PRE_CACHED
  cache.addAll(PRE_CACHED)
}

self.addEventListener('install', e => {
  self.skipWaiting()
  e.waitUntil(preCache())
})

async function deleteOldCache() {
  const names = await caches.keys()
  await Promise.all(names.map(name => name !== CACHE_NAME && caches.delete(name)))
  await clients.claim()
}

self.addEventListener('activate', e => {
  e.waitUntil(deleteOldCache())
})

async function cacheRequest(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request, { ignoreSearch: true, ignoreVary: true })
  if (cachedResponse) return cachedResponse
  const networkResponse = await fetch(request)
  cache.put(request, networkResponse.clone())
  return networkResponse
}

self.addEventListener('fetch', e => {
  e.respondWith(cacheRequest(e.request))
})
