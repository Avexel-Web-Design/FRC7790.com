import React, { useEffect } from "react";
import { HashLink } from "react-router-hash-link";
import useScrollReveal from "../../hooks/useScrollReveal";
// Import logo directly
import logoImage from "../../assets/images/Logo-nobg-sm.png";

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
          {/* Team Logo with enhanced animation */}
          <div className="mb-6 flex justify-center hero-animate" style={{ transitionDelay: '0.1s' }}>
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-r from-[#471a67]/40 to-[#d3b840]/40 rounded-full blur-xl opacity-70 animate-pulse-slow"></div>
              <img 
                src={logoImage} 
                alt="SCA Constellations Logo" 
                className="h-24 md:h-32 w-auto relative drop-shadow-glow-lg"
              />
            </div>
          </div>

          <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 sm:mb-8 tracking-tight leading-tight">
          <span className="block bg-gradient-to-r from-[#471a67] to-[#d3b840] bg-clip-text text-transparent hero-animate" style={{ transitionDelay: '0.3s' }}>
              FRC Team 7598
            </span>
            <span className="block bg-gradient-to-r from-[#471a67] to-[#d3b840] bg-clip-text text-transparent hero-animate" style={{ transitionDelay: '0.3s' }}>
              SCA Constellations
            </span>
          </h1>

          <p className="text-base xs:text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 sm:mb-10 max-w-3xl mx-auto hero-animate" style={{ transitionDelay: '0.4s' }}>
            An all-girls high school robotics team from St. Catherine of Siena Academy in Wixom, Michigan.
            Building tomorrow's innovators through robotics, teamwork, and 
            hands-on engineering.
          </p>

          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 hero-animate hover-pointer" 
            style={{ transitionDelay: '0.5s' }}
          >
            <HashLink
              smooth
              to="https://frc7790.com/event.html?event=2025mitvc"
              className="btn-modern w-full sm:w-auto px-6 xs:px-8 sm:px-10 py-3 sm:py-4 text-white font-bold transition-all duration-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="text-lg sm:text-xl md:text-2xl text-[#d3b840]">
                2025 Traverse City Event Champions
              </span>
            </HashLink>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
