import React, { useEffect } from "react";
import { HashLink } from "react-router-hash-link";
import useScrollReveal from "../../hooks/useScrollReveal";

const Hero = () => {
  useScrollReveal();

  // Add additional animation for hero elements
  useEffect(() => {
    const heroElements = document.querySelectorAll('.hero-animate');
    
    // Add a slight delay before starting animations
    setTimeout(() => {
      heroElements.forEach((element, index) => {
        // Staggered animation
        setTimeout(() => {
          element.classList.add('animation-ready');
        }, index * 150);
      });
    }, 200);
  }, []);

  return (
    <section
      className="relative min-h-[100vh] w-full flex items-center justify-center overflow-hidden pt-28 sm:pt-32 md:pt-28 pb-8 sm:pb-12 hero-animate"
      aria-label="Hero section"
      style={{ 
        margin: 0,
        padding: 0,
        border: 'none',
        outline: 'none',
        width: '100vw',
        maxWidth: '100%'
      }}
    >
      {/* Centered content with team focus */}
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 sm:mb-8 tracking-tight leading-tight">
          <span className="block bg-gradient-to-r from-[hsl(49,70%,20%)] to-[hsl(49,70%,70%)] bg-clip-text text-transparent hero-animate" style={{ transitionDelay: '0.3s' }}>
              Our Team
            </span>
          </h1>

          <p className="text-base xs:text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 sm:mb-10 max-w-3xl mx-auto hero-animate" style={{ transitionDelay: '0.4s' }}>
          Meet the people behind the success of our robotics team. From captains to subteams, every member plays a vital role in achieving our goals.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
