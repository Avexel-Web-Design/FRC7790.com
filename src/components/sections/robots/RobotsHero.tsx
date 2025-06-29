export default function RobotsHero() {
  return (
    <section className="min-h-screen relative overflow-hidden pt-12 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-baywatch-dark to-black"></div>

      <div className="container mx-auto px-3 sm:px-6 flex flex-col items-center justify-center relative z-10 -mt-12">
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
            Robots
          </span>
        </h1>
        <p 
          className="text-gray-400 text-center mt-4 max-w-2xl mx-auto animate__animated animate__fadeInUp" 
          style={{ animationDelay: '0.6s' }}
        >
          Explore our team's engineering excellence through the robots we've built for FIRST Robotics Competition challenges.
        </p>
      </div>
    </section>
  );
}
