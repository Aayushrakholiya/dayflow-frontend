/*  
*  FILE          : HomePageUI.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Root layout component that assembles all homepage sections in sequence and applies theme.
*/

import { useTheme } from '@mui/material';
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

  // Get the current theme mode (light or dark) to apply to the page
  const theme = useTheme();
  const themeMode = theme.palette.mode;

  return (
    <div className={styles.page} data-theme={themeMode}>
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