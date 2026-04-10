/*  
*  FILE          : Offline.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Full-screen overlay that appears when the user loses internet connection.
*/ 

import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material';
import styles from './Error.module.css';

export default function Offline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const theme = useTheme();
  const themeMode = theme.palette.mode;

  // Listen for browser online/offline events
  useEffect(() => {
    function handleOffline() { 
        setIsOffline(true); 
    }
    function handleOnline()  {
        setIsOffline(false);
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Render nothing when the user is online
  if (!isOffline) {
    return null;
  }

  return (
    <div
      className={styles.offlineOverlay}
      data-theme={themeMode}
      role="alert"
      aria-live="assertive"
    >
      <span className={styles.offlineIcon}>📡</span>

      <h2 className={styles.heading}>You're offline</h2>

      <p className={styles.description}>
        It looks like you've lost your internet connection.
        Check your network and we'll reconnect automatically.
      </p>

      {/* Try manually reloading once they think they're back */}
      <button
        type="button"
        className={styles.primaryButton}
        onClick={() => window.location.reload()}
      >
        Try Again
      </button>
    </div>
  );
}