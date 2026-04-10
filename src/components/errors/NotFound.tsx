/*  
*  FILE          : NotFound.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    404 error page displayed when user navigates to a non-existent URL.
*/ 

import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material';
import styles from './Error.module.css';

export default function NotFound() {
  const navigate = useNavigate();
  const theme = useTheme();
  const themeMode = theme.palette.mode;

  return (
    <div className={styles.page} data-theme={themeMode}>

      {/* Decorative background blob */}
      <div className={styles.blob} style={{ top:'-10%', right:'-10%' }} />

      <div className={styles.content}>

        <span className={styles.icon}>🗺️</span>

        <h1 className={styles.code}>404</h1>

        <h2 className={styles.heading}>Page not found</h2>

        <p className={styles.description}>
          Looks like this page took a wrong turn. The URL you entered
          doesn't exist or may have been moved.
        </p>

        <div className={styles.actions}>
          {/* Take the user back to the homepage */}
          <Link to="/" className={styles.primaryButton}>
            Go to Homepage
          </Link>

          {/* Go back to whatever page they came from */}
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