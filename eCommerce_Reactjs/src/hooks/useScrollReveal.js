import { useEffect } from 'react';

/**
 * useScrollReveal — adds .visible class to elements with .scroll-reveal
 * when they enter the viewport. Call in parent page component.
 */
function useScrollReveal(threshold = 0.12) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [threshold]);
}

export default useScrollReveal;
