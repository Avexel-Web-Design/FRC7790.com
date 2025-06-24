export default function ScheduleHero() {
  return (
    <section className="pt-32 pb-16 relative z-10">
      <div className="container mx-auto px-6">
        <h1 className="text-5xl md:text-7xl font-bold text-center">
          <span
            className="text-white inline-block animate__animated animate__fadeInUp"
            style={{ animationDelay: '0.2s' }}
          >
            2025
          </span>
          {' '}
          <span
            className="text-baywatch-orange glow-orange inline-block animate__animated animate__fadeInUp"
            style={{ animationDelay: '0.4s' }}
          >
            Schedule
          </span>
        </h1>
        <p
          className="text-gray-400 text-center mt-4 max-w-2xl mx-auto animate__animated animate__fadeInUp"
          style={{ animationDelay: '0.6s' }}
        >
          Join us at these exciting FRC events throughout the 2025 season
        </p>
      </div>
    </section>
  );
}
