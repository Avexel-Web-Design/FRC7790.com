export default function SponsorsHero() {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative z-10">
        <div className="container mx-auto px-6">
          <h1 className="text-5xl md:text-7xl font-bold text-center">
            <span 
              className="text-white inline-block animate__animated animate__fadeInUp" 
              style={{ animationDelay: '0.2s' }}
            >
              Our
            </span>
          {' '}
            <span 
              className="text-baywatch-orange glow-orange inline-block animate__animated animate__fadeInUp" 
              style={{ animationDelay: '0.4s' }}
            >
              Sponsors
            </span>
          </h1>
          <p 
            className="text-gray-400 text-center mt-4 max-w-2xl mx-auto animate__animated animate__fadeInUp" 
            style={{ animationDelay: '0.6s' }}
          >
            We are incredibly grateful to our sponsors who make our robotics
            program possible. Their support enables us to inspire the next
            generation of engineers and innovators.
          </p>
        </div>
      </section>

      {/* Become a Sponsor Button */}
      <div className="flex justify-center mb-16">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-red-600 rounded-full blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <a 
            href="/become-a-sponsor" 
            className="relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-baywatch-orange to-orange-700 rounded-full text-white font-semibold hover:scale-105 transition-all duration-300 shadow-[0_0_15px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] group overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-orange-600 to-red-600 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></span>
            <span className="relative flex items-center justify-center">
              <i className="fas fa-handshake mr-2 group-hover:scale-110 transition-transform duration-300"></i>
              Become a Sponsor
            </span>
          </a>
        </div>
      </div>
    </>
  );
}
