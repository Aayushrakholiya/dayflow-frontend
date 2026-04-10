/*  
*  FILE          : useScrollReveal.ts 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Custom hook that reveals elements when they scroll into view using IntersectionObserver.
*/

import { useEffect, useRef } from 'react';

export function useScrollReveal<T extends HTMLElement>(
  options?: IntersectionObserverInit
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Start the element as hidden before it enters the viewport
    el.setAttribute('data-reveal', 'hidden');

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Once visible, mark it as visible and stop observing
          el.setAttribute('data-reveal', 'visible');
          observer.disconnect();
        }
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}