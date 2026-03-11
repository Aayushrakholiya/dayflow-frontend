// this is the suupport section with three contact/info cards: email, response time, and feature requests.

import styles from './HomePage.module.css';
import { useScrollReveal } from './useScrollReveal';

export default function HelpSection() {

  const headerRef = useScrollReveal<HTMLDivElement>();
  const cardsRef = useScrollReveal<HTMLDivElement>({ threshold: 0.05 });

  return (
    <section className={styles.help} id="help">
      <div className={styles.helpInner}>

        {/* Section heading and intro copy */}
        <div ref={headerRef} className={styles.helpHeader}>
          <p className={styles.helpLabel}>Support</p>
          <h2 className={styles.helpHeading}>We're here to help.</h2>
          <p className={styles.helpSubtext}>
            Have any question, found a bug, or just want to say hello?
            Our team is always here, feel free to contact.
          </p>
        </div>

        <div ref={cardsRef} className={styles.helpCards}>

          {/* Card 1 — direct email link for general support */}
          <div className={styles.helpCard} style={{ '--card-index': 0 } as React.CSSProperties}>
            <div className={styles.helpCardIcon}>✉️</div>
            <h3 className={styles.helpCardTitle}>Email Support</h3>
            <p className={styles.helpCardDesc}>
              Send us an email and we'll get back to you as soon as possible.
            </p>
            <a href="mailto:help.dayflow@gmail.com" className={styles.helpCardAction}>
              help.dayflow@gmail.com
            </a>
          </div>

          {/* Card 2 — sets expectation on how quickly we respond */}
          <div className={styles.helpCard} style={{ '--card-index': 1 } as React.CSSProperties}>
            <div className={styles.helpCardIcon}>⚡</div>
            <h3 className={styles.helpCardTitle}>Quick Response</h3>
            <p className={styles.helpCardDesc}>
              We typically respond within 24 to 48 hours.
              Your satisfaction is our top priority.
            </p>
            <span className={styles.helpCardBadge}>24 to 48 hrs</span>
          </div>

          {/* Card 3 — pre-fills the email subject line for feature requests */}
          <div className={styles.helpCard} style={{ '--card-index': 2 } as React.CSSProperties}>
            <div className={styles.helpCardIcon}>💡</div>
            <h3 className={styles.helpCardTitle}>Feature Requests</h3>
            <p className={styles.helpCardDesc}>
              Have an idea that would make Dayflow even better?
              We'd love to hear your suggestions.
            </p>
            <a
              href="mailto:help.dayflow@gmail.com?subject=Feature Request"
              className={styles.helpCardAction}
            >
              Share your idea →
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}