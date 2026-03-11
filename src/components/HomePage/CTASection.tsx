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

        {/* CTA button and it will routes to the sign-up page */}
        <Link to="/signup" className={styles.ctaButton}>
          Create Your Free Account
        </Link>
      </div>
    </section>
  );
}