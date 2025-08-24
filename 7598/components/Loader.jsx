import React, { useEffect, useState } from "react";
// Import logo directly
import logoImage from "/Logo-nobg-sm.png";

const Loader = () => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Simulate loading progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setVisible(false), 300); // Delay hiding loader
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 100);

      return () => clearInterval(interval);
    }, 500); // Initial delay

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] bg-dark transition-opacity duration-500 ${
        progress === 100 ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Creative geometric background */}
      <div className="absolute inset-0">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-secondary-500/5 to-primary-500/10"></div>

        {/* Animated elements */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 border border-white/5 rounded-full animate-spin-slow"></div>
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 border border-white/5 rounded-full animate-spin-slow-reverse"></div>

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="relative w-48 text-center">
          {/* Logo with glow effect */}
          <div className="mb-8 relative">
            <div className="absolute inset-0">
              <div className="absolute inset-0 rounded-full bg-gradient-radial from-primary-500/20 to-transparent blur-2xl animate-pulse-slow"></div>
            </div>
            <img
              src={logoImage}
              alt="Avexel Logo"
              className="relative w-24 h-24 mx-auto animate-float"
            />
          </div>

          {/* Progress bar with creative elements */}
          <div className="relative h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 bottom-0 w-full h-full bg-grid-pattern opacity-30"></div>
            <div
              className="relative h-full bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 bg-size-200 animate-flowing-gradient transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Progress text */}
          <div className="mt-4">
            <span className="text-sm font-medium bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              {Math.round(progress)}%
            </span>
          </div>

          {/* Loading text */}
          <div className="mt-2 text-sm font-medium text-white/70">
            <span className="inline-block animate-pulse">
              Loading Experience
            </span>
            <span
              className="inline-block animate-pulse"
              style={{ animationDelay: "0.2s" }}
            >
              .
            </span>
            <span
              className="inline-block animate-pulse"
              style={{ animationDelay: "0.4s" }}
            >
              .
            </span>
            <span
              className="inline-block animate-pulse"
              style={{ animationDelay: "0.6s" }}
            >
              .
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
