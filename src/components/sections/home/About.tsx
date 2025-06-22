import { Link } from 'react-router-dom';

export default function About() {
  return (
    <section id="about-team" className="py-12 sm:py-20 bg-black scroll-mt-24">
      <div className="container mx-auto px-3 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-8 rounded-2xl bg-black/90 border border-baywatch-orange/30 shadow-2xl hover:shadow-baywatch-orange/30 transition-all duration-500 animate-fade-in group">
            
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,_rgb(255,107,0,0.2)_1px,_transparent_0)] bg-[size:20px_20px] rounded-2xl pointer-events-none"></div>
            
            <h2 className="text-5xl font-bold mb-6 text-center bg-gradient-to-r from-baywatch-orange to-orange-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-500">
              Our Team
            </h2>
            
            <p className="text-gray-300 text-center mb-8 text-lg leading-relaxed max-w-2xl mx-auto group-hover:text-white transition-colors duration-500">
              We are Baywatch Robotics, a passionate team from Harbor Springs High School committed to driving innovation and excellence in robotics, furthering creativity, problem solving and ingenuity.
            </p>
            
            <div className="text-center">
              <Link
                to="/become-a-sponsor"
                className="inline-flex items-center px-4 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-baywatch-orange to-orange-700 rounded-full text-white text-sm sm:text-base font-semibold hover:scale-105 transition-all duration-300 group shadow-[0_0_15px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] btn-orange-glow"
              >
                Become a Sponsor
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
        </div>
      </div>
    </section>
  );
}
