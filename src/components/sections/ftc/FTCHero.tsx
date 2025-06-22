export default function FTCHero() {
  return (
    <section className="min-h-screen relative overflow-hidden pt-12 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-baywatch-dark to-black opacity-90"></div>

      <div className="container mx-auto px-3 sm:px-6 flex flex-col items-center justify-center relative z-10 -mt-12">
        <div className="text-center mb-8">
          <img 
            src="/assets/images/ftclogo.jpg" 
            alt="FIRST Tech Challenge Logo" 
            className="w-32 h-32 mx-auto mb-6 rounded-lg"
          />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-center">
          <span className="text-white inline-block animate__animated animate__fadeInUp" style={{ animationDelay: '0.2s' }}>
            FTC
          </span>
          <span className="text-baywatch-orange glow-orange inline-block animate__animated animate__fadeInUp ml-4" style={{ animationDelay: '0.4s' }}>
            Team
          </span>
        </h1>
        <p className="text-gray-400 text-center mt-4 max-w-2xl mx-auto animate__animated animate__fadeInUp" style={{ animationDelay: '0.6s' }}>
          Our FIRST Tech Challenge team provides a stepping stone for middle school students to enter the world of competitive robotics.
        </p>
        <div className="mt-8 animate__animated animate__fadeInUp" style={{ animationDelay: '0.8s' }}>
          <a
            href="#ftc-team"
            className="bg-baywatch-orange hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
          >
            Meet Our Team
          </a>
        </div>
      </div>
    </section>
  );
}
