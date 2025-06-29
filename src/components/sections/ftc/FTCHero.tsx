export default function FTCHero() {
  return (
    <section className="min-h-screen relative overflow-hidden pt-12 flex items-center justify-center">
      <div className="absolute inset-0"></div>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute w-96 h-96 bg-baywatch-orange/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse"
          style={{ animationDuration: '5s' }}
        ></div>
        <div
          className="absolute w-[500px] h-[500px] bg-baywatch-orange/5 rounded-full blur-3xl bottom-40 -right-20 animate-pulse"
          style={{ animationDuration: '7s' }}
        ></div>
      </div>
      <div className="container mx-auto px-6 flex flex-col items-center justify-center relative z-10 -mt-12">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="mb-8">
            <div
              className="flex items-center justify-center gap-4 text-6xl md:text-8xl font-bold animate__animated animate__fadeInUp"
              style={{ animationDuration: '3s' }}
            >
              <span className="text-white">FTC</span>
              <span className="text-baywatch-orange glow-orange">15814</span>
            </div>
            <div
              className="text-5xl md:text-7xl flex items-center justify-center gap-4 font-bold mt-4 animate__animated animate__fadeInUp"
              style={{ animationDelay: '1s', animationDuration: '3s' }}
            >
              <span className="text-white">Metal</span>
              <span className="text-baywatch-orange glow-orange">Makers</span>
            </div>
          </h1>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent"></div>
    </section>
  );
}
