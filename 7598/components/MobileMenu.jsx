import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import logoImage from "/Logo-nobg-sm.png";

const MobileMenu = ({ isOpen, closeMenu, links, currentPath }) => {
  const { user, clearSession } = useAuth();
  const location = useLocation();
  // Check if path is active
  const isActive = (path) => {
    if (path === "/" && currentPath === "/") return true;
    return currentPath === path;
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={closeMenu}
      ></div>

      {/* Menu content - updated to match Navbar glass-morphism style */}
      <div
        className={`absolute top-0 right-0 h-full w-full max-w-sm glass-morphism-nav backdrop-blur-md border-l border-sca-gold/10 shadow-xl transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header with close button */}
        <div className="flex justify-between items-center p-6 border-b border-sca-gold/30">
          <div className="flex items-center">
            <div className="w-10 h-10 mr-3">
              <img src={logoImage} alt="SCA Constellations" className="w-full h-full" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">SCA Constellations</h2>
              <p className="text-xs text-sca-gold">FRC Team 7598</p>
            </div>
          </div>
          <button
            onClick={closeMenu}
            className="p-2.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 hover:shadow-md transition-all duration-200 border border-transparent hover:border-sca-gold/30"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Menu items with enhanced styling */}
        <div className="pt-8 pb-12 px-6">
          <nav className="flex flex-col space-y-2.5">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`py-3.5 px-5 rounded-full transition-all duration-300 transform ${
                  isActive(link.path)
                    ? "bg-gradient-to-r from-sca-gold via-sca-gold-light to-sca-gold text-sca-purple-dark font-medium shadow-md shadow-sca-gold/20 scale-[1.02]"
                    : "text-white hover:bg-white/10 border border-sca-gold/20 hover:border-sca-gold/50 hover:shadow-md hover:shadow-sca-gold/10 hover:translate-x-1"
                }`}
                onClick={closeMenu}
              >
                <span className="block">{link.name}</span>
              </Link>
            ))}
            {user ? (
              <Link
                to="/channels"
                className="py-3.5 px-5 rounded-full transition-all duration-300 transform text-white hover:bg-white/10 border border-sca-gold/20 hover:border-sca-gold/50 hover:shadow-md hover:shadow-sca-gold/10"
                onClick={closeMenu}
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                state={{ from: location.pathname }}
                className="py-3.5 px-5 rounded-full transition-all duration-300 transform text-white hover:bg-white/10 border border-sca-gold/20 hover:border-sca-gold/50 hover:shadow-md hover:shadow-sca-gold/10"
                onClick={closeMenu}
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
