/*  
*  FILE          : MarqueeSection.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Renders continuously scrolling marquee strip highlighting key app features.
*/

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

// Duplicate the items list to create a seamless infinite scroll loop
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