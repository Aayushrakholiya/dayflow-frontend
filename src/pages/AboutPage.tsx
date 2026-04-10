/*  
*  FILE          : AboutPage.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Page component displaying the about/problem section explaining Dayflow benefits.
*/ 

import ProblemSection from "../components/HomePage/ProblemSection";
import styles from "../components/HomePage/HomePage.module.css";

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <ProblemSection />
    </div>
  );
}