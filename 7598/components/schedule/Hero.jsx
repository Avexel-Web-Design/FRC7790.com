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
      className="relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-28 sm:pt-32 md:pt-28 pb-8 sm:pb-12 hero-animate robots-hero"
      aria-label="Robots Hero"
      style={{ margin: 0, padding: 0 }}
    >
      <div className="container mx-auto text-center relative z-10">
        <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-5 sm:mb-6 tracking-tight leading-tight">
          <span className="block bg-gradient-to-r from-[hsl(49,70%,20%)] to-[hsl(49,70%,70%)] bg-clip-text text-transparent hero-animate" style={{ transitionDelay: '0.3s' }}>
              Our Schedule
          </span>
        </h1>
        <p className="text-base xs:text-lg sm:text-xl md:text-2xl text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto hero-animate" style={{ transitionDelay: '0.4s' }}>
          Stay tuned for our upcoming events and competitions. Join us and be part of the excitement!
        </p>
      </div>
    </section>
  );
};

export default Hero;
