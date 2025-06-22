export default function ScheduleHero() {
  return (
    <section className="min-h-screen relative overflow-hidden pt-12 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-baywatch-dark to-black opacity-90"></div>

      <div className="container mx-auto px-3 sm:px-6 flex flex-col items-center justify-center relative z-10 -mt-12">
        <h1 className="text-5xl md:text-7xl font-bold text-center">
          <span className="text-white inline-block animate__animated animate__fadeInUp" style={{ animationDelay: '0.2s' }}>
            Competition
          </span>
          <span className="text-baywatch-orange glow-orange inline-block animate__animated animate__fadeInUp ml-4" style={{ animationDelay: '0.4s' }}>
            Schedule
          </span>
        </h1>
        <p className="text-gray-400 text-center mt-4 max-w-2xl mx-auto animate__animated animate__fadeInUp" style={{ animationDelay: '0.6s' }}>
          Follow our journey through the 2025 FIRST Robotics Competition season. Join us at competitions and team events!
        </p>
        <div className="mt-8 animate__animated animate__fadeInUp" style={{ animationDelay: '0.8s' }}>
          <a
            href="#competitions"
            className="bg-baywatch-orange hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
          >
            View Competitions
          </a>
        </div>
      </div>
    </section>
  );
}
