export default function Hero() {
  return (
    <section className="min-h-screen relative overflow-hidden pt-12 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-baywatch-dark to-black"></div>

      <div className="container mx-auto px-3 sm:px-6 flex flex-col items-center justify-center relative z-10 -mt-12">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-2 sm:gap-4 text-4xl sm:text-6xl md:text-8xl font-bold animate__animated animate__fadeInUp"
                 style={{ animationDuration: '3s' }}>
              <span className="text-white">FRC</span>
              <span className="text-baywatch-orange glow-orange">7790</span>
            </div>
            <div className="text-3xl sm:text-5xl flex items-center justify-center gap-4 md:text-7xl font-bold mt-2 sm:mt-4 animate__animated animate__fadeInUp"
                 style={{ animationDelay: '1s', animationDuration: '3s' }}>
              <span className="text-white">Baywatch</span>
              <span className="text-baywatch-orange glow-orange">Robotics</span>
            </div>
          </h1>
          <a 
            href="/event/?event=2025mitvc#playoffs" 
            className="btn-orange-glow inline-block px-4 py-2 sm:px-8 sm:py-4 text-base sm:text-xl font-semibold rounded-full hover:scale-105 transition-all duration-300 animate__animated animate__fadeInUp xs-text-smaller xs-px-smaller xs-py-smaller"
            style={{ animationDelay: '2s' }}
          >
            <div>
              <i className="fas fa-trophy text-baywatch-orange"></i>
              <span className="text-white font-semibold ml-2">2025 Traverse City Event Champions</span>
            </div>
          </a>
        </div>
      </div>
      
      {/* Decorative element */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent"></div>
    </section>
  );
}
