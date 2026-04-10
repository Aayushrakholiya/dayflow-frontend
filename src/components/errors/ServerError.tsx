/*  
*  FILE          : ServerError.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    500 error page displayed when backend encounters an unexpected error.
*/ 

import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material';
import styles from './Error.module.css';

export default function ServerError() {
  const navigate = useNavigate();
  const theme = useTheme();
  const themeMode = theme.palette.mode;

  return (
    <div className={styles.page} data-theme={themeMode}>

      {/* Decorative background blob */}
      <div className={styles.blob} style={{ top: '5%', left: '-15%' }} />

      <div className={styles.content}>

        <span className={styles.icon}>⚙️</span>

        <h1 className={styles.code}>500</h1>

        <h2 className={styles.heading}>Something went wrong</h2>

        <p className={styles.description}>
          Our servers ran into an unexpected problem. This is on us, not you.
          Please try again in a moment — we're working on it.
        </p>

        <div className={styles.actions}>
          {/* Reload the current page */}
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>

          {/* Go back to the previous page */}
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>

      </div>

      <Link to="/" className={styles.brand}>Dayflow.</Link>

    </div>
  );
}