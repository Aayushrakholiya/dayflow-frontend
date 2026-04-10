/*  
*  FILE          : FooterSection.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Renders footer with app logo, tagline, and CoffeeCoders credits.
*/

import styles from './HomePage.module.css';

export default function FooterSection() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <span className={styles.footerLogo}>Dayflow.</span>
        <p className={styles.footerTagline}>Make your day easy.</p>
        <p className={styles.footerCredits}>
          Built with ☕ by CoffeeCoders
        </p>
      </div>
    </footer>
  );
}