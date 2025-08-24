import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import MobileMenu from "./MobileMenu";
// Import the logo images
import logoImage from "/Star.png";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navRef = useRef(null);
  
  // Navigation links
  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Robots", path: "/robots" },
    { name: "Team", path: "/team" },
    { name: "Sponsors", path: "/sponsors" },
    { name: "Schedule", path: "/schedule" },
    { name: "Photos", path: "/photos" },
  ];

  // Scroll to top when location changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Check if path is active
  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    return location.pathname === path;
  };

  const closeMenu = () => {
    setMenuOpen(false);
    document.body.style.overflow = "";
  };

  // Function to handle navigation click that scrolls to top
  const handleNavClick = () => {
    window.scrollTo(0, 0);
    closeMenu();
  };

  return (
    <>
      <div
        className="fixed top-0 left-0 w-full z-50 glass-morphism-nav backdrop-blur-md border-b border-sca-gold/10"
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div
            ref={navRef}
            className="flex items-center justify-between py-4"
          >
            {/* Logo with modern hover effect */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="flex items-center">
                <div className="relative w-16 h-16 transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-glow">
                  <img
                    src={logoImage}
                    alt="SCA Constellations"
                    className="relative w-full h-full drop-shadow-md"
                  />
                </div>
              </div>
            </Link>

            {/* Desktop Navigation with enhanced modern pill buttons */}
            <div className="hidden md:flex items-center space-x-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={handleNavClick}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 transform ${
                    isActive(link.path)
                      ? "bg-gradient-to-r from-sca-gold via-sca-gold-light to-sca-gold text-sca-purple-dark shadow-lg shadow-sca-gold/20 scale-105"
                      : "text-white hover:bg-white/15 hover:shadow-md hover:shadow-sca-gold/10 hover:scale-105 border border-sca-gold/20 hover:border-sca-gold/50"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <AuthButtonsDesktop />
            </div>

            {/* Mobile Menu Button with improved animation */}
            <div className="md:hidden">
              <button
                onClick={() => {
                  setMenuOpen(!menuOpen);
                  document.body.style.overflow = !menuOpen ? "hidden" : "";
                }}
                className={`p-2.5 text-white rounded-full transition-all duration-300 ${
                  menuOpen 
                    ? "bg-gradient-to-r from-sca-gold to-sca-gold-light text-sca-purple shadow-md shadow-sca-gold/30" 
                    : "hover:bg-white/15 hover:shadow-md border border-sca-gold/20 hover:border-sca-gold/50"
                }`}
                aria-label="Toggle mobile menu"
              >
                {!menuOpen ? (
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
                      d="M4 6h16M4 12h16m-7 6h7"
                    />
                  </svg>
                ) : (
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
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <MobileMenu
        isOpen={menuOpen}
        closeMenu={closeMenu}
        links={navLinks}
        currentPath={location.pathname}
      />
    </>
  );
};

export default Navbar;

// Desktop auth/dashboard button
const AuthButtonsDesktop = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (user) {
    return (
      <Link
        to="/channels"
        className="px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 transform text-white hover:bg-white/15 border border-sca-gold/20 hover:border-sca-gold/50"
      >
        Dashboard
      </Link>
    );
  }

  return (
    <Link
      to="/login"
      state={{ from: location.pathname }}
      className="px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 transform text-white hover:bg-white/15 border border-sca-gold/20 hover:border-sca-gold/50"
    >
      Login
    </Link>
  );
};
