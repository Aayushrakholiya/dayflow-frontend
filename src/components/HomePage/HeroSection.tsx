/*  
*  FILE          : HeroSection.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Renders hero section with headline, stats, action buttons, and decorative app preview.
*/

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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="currentColor" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: "inline", marginRight: "4px", verticalAlign: "middle"}}><path d="M14.5 9C14.5 10.3807 13.3807 11.5 12 11.5C10.6193 11.5 9.5 10.3807 9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9Z" /><path d="M18.2222 17C19.6167 18.9885 20.2838 20.0475 19.8865 20.8999C19.8466 20.9854 19.7999 21.0679 19.7469 21.1467C19.1724 22 17.6875 22 14.7178 22H9.28223C6.31251 22 4.82765 22 4.25311 21.1467C4.20005 21.0679 4.15339 20.9854 4.11355 20.8999C3.71619 20.0475 4.38326 18.9885 5.77778 17" /><path d="M13.2574 17.4936C12.9201 17.8184 12.4693 18 12.0002 18C11.531 18 11.0802 17.8184 10.7429 17.4936C7.6543 14.5008 3.51519 11.1575 5.53371 6.30373C6.6251 3.67932 9.24494 2 12.0002 2C14.7554 2 17.3752 3.67933 18.4666 6.30373C20.4826 11.1514 16.3536 14.5111 13.2574 17.4936Z" /></svg> 12 min drive
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