import { useEffect } from 'react';

export const useScrollReveal = () => {
  useEffect(() => {
    const reveal = () => {
      const reveals = document.querySelectorAll('.reveal');

      reveals.forEach((element) => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 50;

        if (elementTop < windowHeight - elementVisible) {
          element.classList.add('active');
        }
      });
    };

    // Initial check
    reveal();

    // Add scroll listener
    window.addEventListener('scroll', reveal);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', reveal);
    };
  }, []);
};
