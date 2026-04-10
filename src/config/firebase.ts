/*  
*  FILE          : firebase.ts
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    This file defines the Firebase configuration and initialization for the Dayflow application.
*/ 

import { initializeApp } from "firebase/app";
import { getMessaging, onMessage, getToken } from "firebase/messaging";
import type { MessagePayload } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDBarmfkY-KgeLm0lXdpeC4JSzqOezCGWs",
  authDomain: "dayflow-e109c.firebaseapp.com",
  projectId: "dayflow-e109c",
  storageBucket: "dayflow-e109c.firebasestorage.app",
  messagingSenderId: "940635464360",
  appId: "1:940635464360:web:39cf0d8b5ee343072c989d",
  measurementId: "G-TR1ZLY665X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Register service worker for background messages
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" })
    .then((registration) => {
      console.log("✅ Service Worker registered:", registration);
    })
    .catch((error) => {
      console.log("ℹ️ Service Worker registration failed:", error);
    });
}

// Initialize Firebase Cloud Messaging
export const messaging = getMessaging(app);

const VAPID_PUBLIC_KEY = "BDYTOScjwWGdavbu6aeGkFKUnWTj45I1CeN7ScQKXKZn3cK4lAqiVaLCULDU_GdWkPQ9tuuKPrtGoLrj2waWahI";

// Handle incoming messages while app is in foreground
export const setupMessageListener = (callback: (message: MessagePayload) => void) => {
  onMessage(messaging, (payload) => {
    console.log("📬 Foreground message received:", payload);
    callback(payload);
  });
};

// Generate FCM token with permission request
export const generateToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    console.log(permission);
    
    if (permission === "granted") {
      try {
        const token = await getToken(messaging, {
          vapidKey: VAPID_PUBLIC_KEY,
        });
        console.log("✅ FCM token:", token);
        return token;
      } catch (tokenError) {
        console.log("ℹ️ FCM token generation skipped (service worker setup in progress):", tokenError);
        return null;
      }
    }
  } catch (error) {
    console.log("ℹ️ Notification permission request skipped:", error);
  }
};

export default app;
