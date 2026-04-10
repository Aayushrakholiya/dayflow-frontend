/*  
*  FILE          : fcmNotificationService.ts 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    This file defines the FCMNotificationService class, which handles Firebase Cloud Messaging initialization and notification management for the Dayflow application.
*/ 

import { messaging, setupMessageListener } from "../config/firebase";
import { getToken } from "firebase/messaging";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const VAPID_PUBLIC_KEY = "BDYTOScjwWGdavbu6aeGkFKUnWTj45I1CeN7ScQKXKZn3cK4lAqiVaLCULDU_GdWkPQ9tuuKPrtGoLrj2waWahI";

class FCMNotificationService {
  private initialized = false;

  /**
   * Initialize FCM and request notification permission
   */
  async initialize(userId: string | number): Promise<boolean> {
    try {
      console.log("🔔 Initializing Firebase Cloud Messaging for user:", userId);

      // Register service worker
      await this.registerServiceWorker();

      // Get FCM token (this handles permission request internally)
      const token = await this.getFCMToken();
      if (!token) {
        console.error("❌ Failed to get FCM token");
        return false;
      }

      console.log("✅ FCM token obtained:", token);

      // Send token to backend
      await this.sendTokenToBackend(userId, token);

      // Listen for incoming messages
      this.setupMessageHandler();

      this.initialized = true;
      console.log("✅ FCM initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ FCM initialization failed:", error);
      toast.error("Failed to initialize notifications");
      return false;
    }
  }

  /**
   * Register service worker for background messages
   */
  private async registerServiceWorker(): Promise<void> {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service Workers not supported");
    }

    try {
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
        scope: "/",
      });
      console.log("✅ Service Worker registered:", registration);
    } catch (error) {
      console.error("❌ Service Worker registration failed:", error);
      throw error;
    }
  }

  /**
   * Get FCM token for this device
   */
  private async getFCMToken(): Promise<string | null> {
    try {
      // Request permission first
      const permission = await Notification.requestPermission();
      console.log(permission);

      if (permission !== "granted") {
        console.log("⚠️ Notification permission denied");
        return null;
      }

      // Get token after permission is granted
      const token = await getToken(messaging, {
        vapidKey: VAPID_PUBLIC_KEY,
      });
      return token;
    } catch (error) {
      console.error("❌ Error getting FCM token:", error);
      return null;
    }
  }

  /**
   * Send FCM token to backend
   */
  private async sendTokenToBackend(userId: string | number, token: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}/device-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ deviceToken: token }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save device token: ${response.statusText}`);
      }

      console.log("✅ Device token saved to backend");
    } catch (error) {
      console.error("❌ Error sending token to backend:", error);
      // Don't throw - token will be saved later
    }
  }

  /**
   * Setup handler for incoming messages
   */
  private setupMessageHandler(): void {
    setupMessageListener((payload) => {
      console.log("📬 Message received:", payload);

      const title = payload.notification?.title || "DayFlow Notification";
      const body = payload.notification?.body || "You have a new notification";

      // Show browser notification for foreground messages
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
          body: body,
          icon: payload.notification?.icon || "/favicon.ico",
          badge: "/favicon.ico",
          tag: `dayflow-event-${payload.data?.eventId || 'default'}-${Math.floor(Date.now() / 1000)}`,
          requireInteraction: true,
          data: payload.data || {},
        });
      }

      // Show toast notification
      toast.info(`${title}: ${body}`, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    });
  }

  /**
   * Check if FCM is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

export const fcmNotificationService = new FCMNotificationService();
