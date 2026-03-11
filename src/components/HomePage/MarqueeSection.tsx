import styles from './HomePage.module.css';

const items = [
  { icon: '🔔', text: 'Smart Leave-By Alerts' },
  { icon: '📍', text: 'Live Travel Time' },
  { icon: '⚠️', text: 'Conflict Detection' },
  { icon: '🌤️', text: 'Weather Integration' },
  { icon: '📋', text: 'Daily Summary' },
  { icon: '⏱️', text: 'Never Be Late' },
  { icon: '🗂️', text: 'All In One Place' },
  { icon: '✦',  text: 'Dayflow' },
];

// Duplicate for seamless loop
const doubled = [...items, ...items];

export default function MarqueeSection() {
  return (
    <div className={styles.marquee}>
      <div className={styles.marqueeTrack}>
        {doubled.map((item, i) => (
          <span key={i} className={styles.marqueeItem}>
            <span className={styles.marqueeIcon}>{item.icon}</span>
            {item.text}
            <span className={styles.marqueeDot}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}