import { Link } from 'react-router-dom';
import { navLinks } from './HomePageData';
import styles from './HomePage.module.css';

export default function NavbarSection() {
  return (
    <nav className={styles.navbar}>
      
      <span className={styles.navLogo}>Dayflow.</span>

      <div className={styles.navLinks}>
        {/* Render each anchor link from HomePageData */}
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className={styles.navLink}
          >
            {link.label}
          </a>
        ))}

        {/* Primary CTA — routes to the sign-up page */}
        <Link to="/signup" className={styles.navCta}>
          Get Started
        </Link>
      </div>
    </nav>
  );
}