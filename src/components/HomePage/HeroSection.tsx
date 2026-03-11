import { Link } from 'react-router-dom';
import { previewEvents } from './HomePageData';
import styles from './HomePage.module.css';

export default function HeroSection() {
  return (
    <section className={styles.hero}>

      {/* Left column — main headline and action buttons */}
      <div className={styles.heroContent}>
        <div className={styles.heroBadge}>✦ Your life, simplified</div>

        <h1 className={styles.heroHeading}>
          Make your<br />
          <span className={styles.heroAccent}>day easy.</span>
        </h1>

        <p className={styles.heroSubtext}>
          One app for your calendar, travel time, weather, and schedule — so
          you stop juggling and start living.
        </p>

        {/* Key stats row — shows the value of the app at a glance */}
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatNum}>5+</span>
            <span className={styles.heroStatLabel}>Apps replaced</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStat}>
            <span className={styles.heroStatNum}>0</span>
            <span className={styles.heroStatLabel}>Late arrivals</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStat}>
            <span className={styles.heroStatNum}>1</span>
            <span className={styles.heroStatLabel}>App for all</span>
          </div>
        </div>

        <div className={styles.heroActions}>
          {/* Primary CTA — takes the user to sign up */}
          <Link to="/signup" className={styles.heroPrimary}>
            Start To Make Your Day Easy
          </Link>

          {/* Secondary CTA — smooth-scrolls down to the features section */}
          <a href="#features" className={styles.heroSecondary}>
            See Features →
          </a>
        </div>
      </div>

      {/* Right column — decorative app preview card with floating badges */}
      <div className={styles.heroVisual}>

        {/* Floating feature badges that animate around the card */}
        <div className={`${styles.floatBadge} ${styles.floatBadge1}`}>
          🔔 Leave by 8:45 AM
        </div>
        <div className={`${styles.floatBadge} ${styles.floatBadge2}`}>
          🌤️ 4°C · Bring a coat
        </div>
        <div className={`${styles.floatBadge} ${styles.floatBadge3}`}>
          ⚠️ Conflict detected
        </div>
        <div className={`${styles.floatBadge} ${styles.floatBadge4}`}>
          📍 12 min drive
        </div>

        <div className={styles.heroCard}>

          <div className={styles.cardHeader}>
            <span className={styles.cardDot} />
            <span className={styles.cardDot} />
            <span className={styles.cardDot} />
          </div>

          <div className={styles.cardDate}>Today — Thursday</div>

          {/* Render each sample event from HomePageData */}
          {previewEvents.map((event, index) => (
            <div key={index} className={styles.cardEvent}>
              <div className={styles.eventTime}>{event.time}</div>
              <div className={styles.eventDetails}>
                <div className={styles.eventTitle}>{event.title}</div>
                <div className={styles.eventMeta}>{event.meta}</div>
              </div>
            </div>
          ))}

          {/* Summary bar shown at the bottom of the preview card */}
          <div className={styles.cardSummary}>
            3 events · 2 reminders · 1 conflict detected
          </div>
        </div>

        <div className={styles.heroBlob} />
      </div>

    </section>
  );
}