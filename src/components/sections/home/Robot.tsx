import { Link } from 'react-router-dom';

export default function Robot() {
  return (
    <section id="robots" className="py-12 sm:py-20 bg-black scroll-mt-24">
      <div className="container mx-auto px-3 sm:px-6">
        <h2 className="text-4xl font-bold mb-4 text-center">Our Robot</h2>
        <p className="text-gray-400 text-center mb-12">
          This is our robot for the 2025 FRC season, REEFSCAPE.
        </p>
        <h3 className="text-center">
          <span className="text-[min(8vw,6rem)] font-bold font-anurati text-baywatch-orange glow-orange tracking-[.25em] animate__animated animate__fadeInUp"
                style={{ animationDelay: '0.2s' }}>
            RIPTIDE
          </span>
        </h3>
        <div className="flex flex-col items-center justify-center">
          <div className="robot-image-container mx-auto mb-8">
            <img
              src="/assets/images/RIPTIDE/short-better.png"
              alt="RIPTIDE - Our 2025 FRC Robot"
              className="w-full h-full object-contain max-w-2xl"
              width="800"
              height="600"
              loading="lazy"
            />
          </div>
          <Link
            to="/robots"
            className="inline-flex items-center px-4 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-baywatch-orange to-orange-700 rounded-full text-white text-sm sm:text-base font-semibold hover:scale-105 transition-all duration-300 group shadow-[0_0_15px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] btn-orange-glow"
          >
            View All Robots
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 sm:h-5 sm:w-5 ml-2 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
