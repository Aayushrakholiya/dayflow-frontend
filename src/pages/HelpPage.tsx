/*  
*  FILE          : HelpPage.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Page component displaying the help and support section.
*/ 

import HelpSection from "../components/HomePage/HelpSection";
import styles from "../components/HomePage/HomePage.module.css";

export default function HelpPage() {
  return (
    <div className={styles.page}>
      <HelpSection />
    </div>
  );
}