// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="relative py-8 text-white z-10"
      style={{ 
        background: 'transparent',
        backdropFilter: 'none',
        position: 'relative'
      }}
    >
      {/* Very minimal footer content */}
      <div className="container mx-auto px-4 relative z-10">
  <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-6">
          {/* Copyright text */}
          <div className="flex items-center gap-4 mb-4 md:mb-0 text-xs">
            <span className="text-gray-500">&copy; {currentYear} SCA Constellations - FRC Team 7598</span>
          </div>
          
          {/* Links */}
          <div className="flex flex-wrap justify-center gap-4 items-center">
            <a
              href="/privacy"
              className="text-gray-400 hover:text-[#d3b840] transition-colors text-xs md:text-sm"
            >
              Privacy Policy
            </a>
            {/* Social links using Font Awesome icons */}
            <a 
              href="https://www.instagram.com/scaconstellations/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-[#d3b840] transition-colors"
              aria-label="Instagram"
            >
              <i className="fab fa-instagram fa-lg"></i>
            </a>
            
            <a 
              href="https://www.facebook.com/scaconstellations7598"
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-[#d3b840] transition-colors"
              aria-label="Facebook"
            >
              <i className="fab fa-facebook fa-lg"></i>
            </a>
            
            <a 
              href="https://github.com/SCAconstellations"
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-[#d3b840] transition-colors"
              aria-label="GitHub"
            >
              <i className="fab fa-github fa-lg"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
