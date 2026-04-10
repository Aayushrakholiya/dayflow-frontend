/*  
*  FILE          : NavbarSection.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Renders navbar with logo, nav links, theme toggle button, and sign-up CTA.
*/

import { Link } from 'react-router-dom';
import { navLinks } from './HomePageData';
import styles from './HomePage.module.css';
import { useDayflowTheme } from '../AuthBase/Usedayflowtheme';
import { IThemeMode } from '../AuthBase/ThemeContext';

export default function NavbarSection() {
  const { themeMode, switchThemeMode } = useDayflowTheme();

  // Cycle through Light → Dark → System on each click
  function handleThemeToggle() {
    if (themeMode === IThemeMode.Light) {
      switchThemeMode(IThemeMode.Dark);
    } else if (themeMode === IThemeMode.Dark) {
      switchThemeMode(IThemeMode.System);
    } else {
      switchThemeMode(IThemeMode.Light);
    }
  }

  // Show the correct icon depending on the current mode
  function getThemeIcon() {
    if (themeMode === IThemeMode.Dark)   
    { 
      return '🌙'; 
    }
    if (themeMode === IThemeMode.System) 
    { 
      return '⚙️'; 
    }
    return '☀️';
  }

  return (
    <nav className={styles.navbar}>

      <span className={styles.navLogo}>Dayflow.</span>

      <div className={styles.navLinks}>
        {/* Render each anchor link from HomePageData */}
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className={styles.navLink}
          >
            {link.label}
          </a>
        ))}

        {/* Theme toggle button — cycles Light / Dark / System */}
        <button
          type="button"
          className={styles.navThemeToggle}
          onClick={handleThemeToggle}
          aria-label="Toggle theme"
          title={`Current theme: ${themeMode}`}
        >
          {getThemeIcon()}
        </button>

        {/* Primary CTA — routes to the sign-up page */}
        <Link to="/signup" className={styles.navCta}>
          Get Started
        </Link>
      </div>
    </nav>
  );
}