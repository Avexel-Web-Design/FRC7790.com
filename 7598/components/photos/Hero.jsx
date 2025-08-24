import React, { useEffect } from 'react';
import { HashLink } from "react-router-hash-link";
import useScrollReveal from '../../hooks/useScrollReveal';
import '../../assets/styles/main.css';

const Hero = () => {
  useScrollReveal();

  useEffect(() => {
    const heroElements = document.querySelectorAll('.hero-animate');
    setTimeout(() => {
      heroElements.forEach((element, index) => {
        setTimeout(() => {
          element.classList.add('animation-ready');
        }, index * 150);
      });
    }, 200);
  }, []);

  return (
    <section
      className="relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-28 sm:pt-32 md:pt-28 pb-8 sm:pb-12 hero-animate photos-hero"
      aria-label="Photos Hero"
      style={{ margin: 0, padding: 0 }}
    >
      <div className="container mx-auto text-center relative z-10">
        <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 sm:mb-8 tracking-tight leading-tight">
          <span className="block bg-gradient-to-r from-[hsl(275,60%,20%)] to-[hsl(275,60%,80%)] bg-clip-text text-transparent hero-animate" style={{ transitionDelay: '0.3s' }}>
              Our Photos
          </span>
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl mb-8 hero-animate" style={{ transitionDelay: '0.4s' }}>
          Capturing our team's memories, achievements, and robot builds throughout the seasons.
        </p>
        
        {/* Mobile-friendly year selection */}
        <div className="hero-animate" style={{ transitionDelay: '0.5s' }}>
          {/* Mobile: Dropdown-style grid */}
          <div className="block sm:hidden mb-6">
            <div className="grid grid-cols-1 gap-2 max-w-xs mx-auto">
              <HashLink smooth to="#reefscape" className="btn-modern px-4 py-2.5 transition-all duration-300 rounded-full text-white font-medium text-sm">
                Reefscape (2025)
              </HashLink>
              <HashLink smooth to="#crescendo" className="btn-modern px-4 py-2.5 transition-all duration-300 rounded-full text-white font-medium text-sm">
                Crescendo (2024)
              </HashLink>
              <HashLink smooth to="#chargedup" className="btn-modern px-4 py-2.5 transition-all duration-300 rounded-full text-white font-medium text-sm">
                Charged Up (2023)
              </HashLink>
              <HashLink smooth to="#rapidreact" className="btn-modern px-4 py-2.5 transition-all duration-300 rounded-full text-white font-medium text-sm">
                Rapid React (2022)
              </HashLink>
              <HashLink smooth to="#athome" className="btn-modern px-4 py-2.5 transition-all duration-300 rounded-full text-white font-medium text-sm">
                At Home (2021)
              </HashLink>
              <HashLink smooth to="#infiniterecharge" className="btn-modern px-4 py-2.5 transition-all duration-300 rounded-full text-white font-medium text-sm">
                Infinite Recharge (2020)
              </HashLink>
              <HashLink smooth to="#deepspace" className="btn-modern px-4 py-2.5 transition-all duration-300 rounded-full text-white font-medium text-sm">
                Deep Space (2019)
              </HashLink>
            </div>
          </div>
          
          {/* Tablet: 2x3 grid */}
          <div className="hidden sm:block lg:hidden mb-6">
            <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
              <HashLink smooth to="#reefscape" className="btn-modern px-4 py-3 transition-all duration-300 rounded-full text-white font-semibold text-sm">
                Reefscape (2025)
              </HashLink>
              <HashLink smooth to="#crescendo" className="btn-modern px-4 py-3 transition-all duration-300 rounded-full text-white font-semibold text-sm">
                Crescendo (2024)
              </HashLink>
              <HashLink smooth to="#chargedup" className="btn-modern px-4 py-3 transition-all duration-300 rounded-full text-white font-semibold text-sm">
                Charged Up (2023)
              </HashLink>
              <HashLink smooth to="#rapidreact" className="btn-modern px-4 py-3 transition-all duration-300 rounded-full text-white font-semibold text-sm">
                Rapid React (2022)
              </HashLink>
              <HashLink smooth to="#athome" className="btn-modern px-4 py-3 transition-all duration-300 rounded-full text-white font-semibold text-sm">
                At Home (2021)
              </HashLink>
              <HashLink smooth to="#infiniterecharge" className="btn-modern px-4 py-3 transition-all duration-300 rounded-full text-white font-semibold text-sm">
                Infinite Recharge (2020)
              </HashLink>
              <HashLink smooth to="#deepspace" className="btn-modern px-4 py-3 transition-all duration-300 rounded-full text-white font-semibold text-sm col-span-2">
                Destination: Deep Space (2019)
              </HashLink>
            </div>
          </div>
          
          {/* Desktop: Original horizontal layout */}
          <div className="hidden lg:flex justify-center gap-4 flex-wrap">
            <HashLink smooth to="#reefscape" className="btn-modern px-5 py-3 transition-all duration-300 rounded-full text-white font-semibold">
              Reefscape (2025)
            </HashLink>
            <HashLink smooth to="#crescendo" className="btn-modern px-5 py-3 transition-all duration-300 rounded-full text-white font-semibold">
              Crescendo (2024)
            </HashLink>
            <HashLink smooth to="#chargedup" className="btn-modern px-5 py-3 transition-all duration-300 rounded-full text-white font-semibold">
              Charged Up (2023)
            </HashLink>
            <HashLink smooth to="#rapidreact" className="btn-modern px-5 py-3 transition-all duration-300 rounded-full text-white font-semibold">
              Rapid React (2022)
            </HashLink>
            <HashLink smooth to="#athome" className="btn-modern px-5 py-3 transition-all duration-300 rounded-full text-white font-semibold">
              Infinite Recharge: At Home (2021)
            </HashLink>
            <HashLink smooth to="#infiniterecharge" className="btn-modern px-5 py-3 transition-all duration-300 rounded-full text-white font-semibold">
              Infinite Recharge (2020)
            </HashLink>
            <HashLink smooth to="#deepspace" className="btn-modern px-5 py-3 transition-all duration-300 rounded-full text-white font-semibold">
              Destination: Deep Space (2019)
            </HashLink>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
