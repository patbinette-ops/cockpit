// Service worker de la coquille Cockpit.
// Garde seulement la coquille (page, icônes) pour un démarrage instantané.
// Le contenu de Cockpit (Google) n'est jamais mis en cache : il vient toujours en direct.
const CACHE = 'cockpit-coquille-v3';
const COQUILLE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './favicon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Réseau d'abord pour la coquille (une mise à jour est vue tout de suite), cache en repli hors ligne.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const copie = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copie)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});

// Cockpit v5.2.0 : notifications envoyées par Apps Script (Web Push chiffré). Charge utile JSON : { titre, texte, tag, url }.
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { texte: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.titre || 'Cockpit', {
    body: d.texte || '',
    icon: 'icon-192.png',
    badge: 'badge-96.png',
    tag: d.tag || 'cockpit',
    renotify: true,
    data: { url: d.url || './' }
  }));
});

// Clic : ramène Cockpit au premier plan (ou l'ouvre).
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const cible = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) if (c.url.startsWith(self.registration.scope) && 'focus' in c) return c.focus();
    return self.clients.openWindow(cible);
  }));
});
