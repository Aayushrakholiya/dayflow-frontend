/*  
*  FILE          : CTASection.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Renders call-to-action section on homepage with heading and sign-up button.
*/
import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';

export default function CTASection() {
  return (
    <section className={styles.cta}>
      <div className={styles.ctaInner}>
        <h2 className={styles.ctaHeading}>
          Ready to simplify<br />your day?
        </h2>
        <p className={styles.ctaSubtext}>
          Join Dayflow and stop switching apps. Your schedule, travel time,
          and weather — all in one place.
        </p>

        {/* Button that routes the user to the sign-up page */}
        <Link to="/signup" className={styles.ctaButton}>
          Create Your Free Account
        </Link>
      </div>
    </section>
  );
}