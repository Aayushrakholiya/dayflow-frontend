import { useScrollReveal } from './useScrollReveal';
import styles from './HomePage.module.css';

const reasons = [
  {
    icon: '🗂️',
    title: 'Everything in One Place',
    body: 'Stop switching between your calendar, maps, and weather apps. Dayflow brings it all together so you can plan your day without the hassle.',
  },
  {
    icon: '⏱️',
    title: 'Always On Time',
    body: 'Dayflow calculates real-time travel time and tells you exactly when to leave — so you arrive on time, every time, without the guesswork.',
  },
  {
    icon: '⚠️',
    title: 'Stay Ahead of Conflicts',
    body: 'Overlapping meetings or a packed schedule? Dayflow spots the problems before they happen and keeps your day running smoothly.',
  },
  {
    icon: '🌤️',
    title: 'Weather-Aware Planning',
    body: 'Know what to expect before you step out. Dayflow shows you live weather right alongside your events so you are always prepared.',
  },
];

export default function ProblemSection() {

  const headerRef = useScrollReveal<HTMLDivElement>();
  const gridRef   = useScrollReveal<HTMLDivElement>({ threshold: 0.05 });


  return (
    // id="about" makes this the scroll target for the navbar "About" link
    <section className={styles.problem} id="about">
      <div className={styles.problemInner}>

        {/* Section heading and intro copy */}
        <div ref={headerRef} className={styles.problemHeader}>
          <p className={styles.problemLabel}>Why Dayflow?</p>
          <h2 className={styles.problemHeading}>One app to run your day.</h2>
          <p className={styles.problemSubtext}>
            Managing your time should not require juggling five different apps.
            Dayflow gives you everything you need in a single, smart calendar.
          </p>
        </div>

        {/* Four reason cards laid out in a responsive grid */}
        <div ref={gridRef} className={styles.reasonsGrid}>
          {reasons.map((reason, index) => (
            <div
              key={index}
              className={styles.reasonCard}
              style={{ '--card-index': index } as React.CSSProperties}
            >
              <span className={styles.reasonIcon}>{reason.icon}</span>
              <h3 className={styles.reasonTitle}>{reason.title}</h3>
              <p className={styles.reasonBody}>{reason.body}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}