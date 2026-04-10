/**
 * Firebase Service Worker
 * Handles push notifications when app is closed/background
 */

importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js",
);

const firebaseConfig = {
  apiKey: "AIzaSyDBarmfkY-KgeLm0lXdpeC4JSzqOezCGWs",
  authDomain: "dayflow-e109c.firebaseapp.com",
  projectId: "dayflow-e109c",
  storageBucket: "dayflow-e109c.firebasestorage.app",
  messagingSenderId: "940635464360",
  appId: "1:940635464360:web:39cf0d8b5ee343072c989d",
  measurementId: "G-TR1ZLY665X",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("[Service Worker] Background message received:", payload);

  const notificationTitle =
    payload.notification?.title || "DayFlow Notification";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new notification",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: `dayflow-event-${payload.data?.eventId || "default"}-${Math.floor(Date.now() / 1000)}`,
    requireInteraction: true,
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === "/" && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow("/main");
        }
      }),
  );
});
