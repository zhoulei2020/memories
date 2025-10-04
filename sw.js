// sw.js - 简易静态资源缓存 (原样开放可自由修改)
const CACHE_NAME = 'memories-cache-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './lunar.js',
  './backgrounds.js',
  './storage.js',
  './music.js',
  './calendar.js'
];

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', evt => {
  const req = evt.request;
  // 只处理 GET
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  // 优先缓存命中的核心/图片，其它走网络优先再回退
  if(url.pathname.includes('/assets/music/')){
    // 音频采用缓存优先，若离线仍可播放
    evt.respondWith(cacheFirst(req));
    return;
  }
  if(url.pathname.startsWith('/assets/') || CORE_ASSETS.some(a=>url.pathname.endsWith(a.replace('./','/')))){
    evt.respondWith(cacheFirst(req));
  } else {
    evt.respondWith(networkThenCache(req));
  }
});

async function cacheFirst(req){
  const cache = await caches.open(CACHE_NAME);
  const hit = await cache.match(req);
  if(hit) return hit;
  try {
    const res = await fetch(req);
    if(res.ok) cache.put(req, res.clone());
    return res;
  } catch(err){
    return hit || new Response('离线状态，且资源未缓存',{status:503});
  }
}

async function networkThenCache(req){
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await fetch(req);
    if(res.ok && (req.url.startsWith(self.location.origin))) cache.put(req,res.clone());
    return res;
  } catch(err){
    const hit = await cache.match(req);
    if(hit) return hit;
    return new Response('离线不可用',{status:503});
  }
}
