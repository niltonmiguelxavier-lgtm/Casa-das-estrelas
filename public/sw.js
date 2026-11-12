/**
 * Service worker mínimo — apenas para notificações push (Web Push).
 * Não faz cache offline agressivo: o site é dinâmico e os dados de votação não
 * podem ser servidos de cache.
 *
 * Requer VAPID configurado no servidor (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).
 * Sem essas variáveis o browser nunca subscreve e nenhuma notificação é enviada.
 */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Casa das Estrelas", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Casa das Estrelas";
  const options = {
    body: data.body || "",
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: data.tag || "cde-notificacao",
    data: { url: data.url || "/painel/notificacoes" },
    renotify: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/painel/notificacoes";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
