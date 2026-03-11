import NavbarSection from './NavbarSection';
import HeroSection from './HeroSection';
import ProblemSection from './ProblemSection';
import FeaturesSection from './FeaturesSection';
import CTASection from './CTASection';
import HelpSection from './HelpSection';
import FooterSection from './FooterSection';
import styles from './HomePage.module.css';
import MarqueeSection from './MarqueeSection';

export default function HomePageUI() {
  return (
    <div className={styles.page}>
      <NavbarSection />
      <HeroSection />
      <MarqueeSection />
      <ProblemSection />
      <FeaturesSection />
      <HelpSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}