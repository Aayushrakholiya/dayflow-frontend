/*  
*  FILE          : Unauthorized.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    401 error page displayed when user session expires or lacks access permission.
*/ 

import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material';
import styles from './Error.module.css';

export default function Unauthorized() {
  const navigate = useNavigate();
  const theme = useTheme();
  const themeMode = theme.palette.mode;

  // Clear any stale token and redirect to login
  function handleLoginRedirect() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/login');
  }

  return (
    <div className={styles.page} data-theme={themeMode}>

      {/* Decorative background blob */}
      <div className={styles.blob} style={{ bottom: '-10%', left: '-10%' }} />

      <div className={styles.content}>

        <span className={styles.icon}>🔒</span>

        <h1 className={styles.code}>401</h1>

        <h2 className={styles.heading}>Session expired</h2>

        <p className={styles.description}>
          Your session has expired or you are not authorised to view this page.
          Please log in again to continue.
        </p>

        <div className={styles.actions}>
          {/* Clear token and send to login */}
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleLoginRedirect}
          >
            Log In Again
          </button>

          {/* Go back to the homepage without logging in */}
          <Link to="/" className={styles.secondaryButton}>
            Go to Homepage
          </Link>
        </div>

      </div>

      <Link to="/" className={styles.brand}>Dayflow.</Link>

    </div>
  );
}