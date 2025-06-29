export default function Hero() {
  return (
    <section className="pt-32 pb-16 relative z-10">
      <div className="container mx-auto px-6">
        <h1 className="text-5xl md:text-7xl font-bold text-center">
          <span
            className="text-white inline-block animate__animated animate__fadeInUp"
            style={{ animationDelay: '0.2s' }}
          >
            Become
          </span>
          {' '}
          <span
            className="text-white inline-block animate__animated animate__fadeInUp"
            style={{ animationDelay: '0.3s' }}
          >
            a
          </span>
          {' '}
          <span
            className="text-baywatch-orange glow-orange inline-block animate__animated animate__fadeInUp"
            style={{ animationDelay: '0.4s' }}
          >
            Sponsor
          </span>
        </h1>
        <p
          className="text-gray-400 text-center mt-4 max-w-2xl mx-auto animate__animated animate__fadeInUp"
          style={{ animationDelay: '0.6s' }}
        >
          Fill out the form below and we'll be in touch to discuss how you can
          support our team!
        </p>
      </div>
    </section>
  );
}
