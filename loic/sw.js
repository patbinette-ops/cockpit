// Service worker du Cockpit Loïc (Karen v0.1.1). Portée : loic/ seulement.
// Aucun cache : le seul but est de recevoir et d'afficher les notifications.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Charge utile attendue (JSON) : { titre, texte, tag, url }. Tout est optionnel.
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; }
  catch (_) { d = { texte: e.data ? e.data.text() : '' }; }
  const titre = d.titre || 'Karen';
  e.waitUntil(self.registration.showNotification(titre, {
    body: d.texte || 'Test de notification',
    icon: 'icon-192.png',
    badge: 'badge-96.png',
    tag: d.tag || 'karen',
    renotify: true,
    data: { url: d.url || './' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const cible = new URL(e.notification.data && e.notification.data.url || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) if (c.url.startsWith(self.registration.scope) && 'focus' in c) return c.focus();
    return self.clients.openWindow(cible);
  }));
});
