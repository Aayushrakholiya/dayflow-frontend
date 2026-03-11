// this displays the full feature set in a three-column card grid.

import { features } from './HomePageData';
import styles from './HomePage.module.css';
import { useScrollReveal } from './useScrollReveal';

export default function FeaturesSection() {

  const headerRef = useScrollReveal<HTMLDivElement>();
  const gridRef = useScrollReveal<HTMLDivElement>({ threshold: 0.05 });

  return (

    <section className={styles.features} id="features">

      {/* Section heading and intro */}
      <div ref={headerRef} className={styles.featuresHeader}>
        <p className={styles.featuresLabel}>Everything you need</p>
        <h2 className={styles.featuresHeading}>One app. All the answers.</h2>
        <p className={styles.featuresSubtext}>
          Dayflow brings together everything you check before heading out —
          so you never have to switch apps again.
        </p>
      </div>

      {/* Feature cards and the data is coming from HomePageData */}
      <div ref={gridRef} className={styles.featuresGrid}>
        {features.map((feature, index) => (
          <div
            key={index}
            className={styles.featureCard}
            style={{ '--card-index': index } as React.CSSProperties}
          >
            <span className={styles.featureIcon}>{feature.icon}</span>
            <h3 className={styles.featureTitle}>{feature.title}</h3>
            <p className={styles.featureDesc}>{feature.description}</p>
          </div>
        ))}
      </div>

    </section>
  );
}