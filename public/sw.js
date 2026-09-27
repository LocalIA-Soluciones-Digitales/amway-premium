// Service worker del panel de gestión (solo controla /admin). No cachea
// nada: existe para que el panel se pueda instalar como app en el móvil y
// para recibir los avisos push de pedidos nuevos (ver src/lib/push.ts).

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || "Pedido nuevo", {
        body: data.body || "",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: data.tag,
        // Que suene y vibre: nunca aviso silencioso, y si llega otro con la
        // misma etiqueta vuelve a sonar.
        silent: false,
        renotify: Boolean(data.tag),
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 400],
        data: { url: data.url || "/admin" },
      }),
      // Si el panel está abierto, que refresque al momento.
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((ws) => ws.forEach((w) => w.postMessage({ tipo: "push", tag: data.tag }))),
    ])
  );
});

// Al tocar el aviso: reutiliza la ventana del panel si ya está abierta
// (llevándola al pedido) o abre una nueva.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/admin", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const panel = windows.find((w) => new URL(w.url).pathname.startsWith("/admin"));
      if (panel) return panel.navigate(url).then((w) => (w || panel).focus());
      return self.clients.openWindow(url);
    })
  );
});
