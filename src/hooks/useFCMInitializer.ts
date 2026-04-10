/*  
*  FILE          : useFCMInitializer.ts 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    This file defines the useFCMInitializer hook, which handles the initialization of Firebase Cloud Messaging for the Dayflow application.
*/ 

import { useEffect } from "react";
import { fcmNotificationService } from "../services/fcmNotificationService";

/**
 * Initialize Firebase Cloud Messaging when component mounts
 * Call this hook after user login
 */
export const useFCMInitializer = (userId: string | number | null) => {
  useEffect(() => {
    if (!userId) return;

    const initializeFCM = async () => {
      await fcmNotificationService.initialize(userId);
    };

    // Initialize after a small delay to ensure DOM is ready
    const timer = setTimeout(initializeFCM, 500);
    return () => clearTimeout(timer);
  }, [userId]);
};
