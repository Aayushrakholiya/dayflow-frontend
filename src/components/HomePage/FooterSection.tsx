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