export default function FTCRobots() {
  return (
    <section id="robots" className="py-20 bg-black">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold mb-4 text-center">Our Robot</h2>
        <p className="text-gray-400 text-center mb-12">
          Meet our robot for the 2024 FIRST Tech Challenge season.
        </p>
        <div className="flex flex-col items-center justify-center">
          <h3 className="text-4xl sm:text-5xl md:text-7xl font-bold font-anurati text-orange-500 mb-4 glow-orange tracking-[.25em] text-center">
            COBALT
          </h3>
          <div className="robot-image-container mx-auto mb-8 max-w-md">
            <img
              src="/assets/images/COBALT/Cobalt-Start-non-metal.png"
              alt="COBALT"
              className="w-full h-auto object-contain"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-8">
            <div className="card-gradient rounded-xl p-6 text-center hover:scale-105 transition-all duration-300">
              <i className="fas fa-compass text-3xl text-baywatch-orange mb-4"></i>
              <h4 className="text-xl font-bold mb-2">Field-Oriented Drive</h4>
              <p className="text-gray-400">
                Mecanum drive system with field-oriented control for intuitive
                operation
              </p>
            </div>
            <div className="card-gradient rounded-xl p-6 text-center hover:scale-105 transition-all duration-300">
              <i className="fas fa-rotate text-3xl text-baywatch-orange mb-4"></i>
              <h4 className="text-xl font-bold mb-2">End-Effector Pivot</h4>
              <p className="text-gray-400">
                Precise pivoting mechanism for optimal game piece manipulation
              </p>
            </div>
            <div className="card-gradient rounded-xl p-6 text-center hover:scale-105 transition-all duration-300">
              <i className="fas fa-gamepad text-3xl text-baywatch-orange mb-4"></i>
              <h4 className="text-xl font-bold mb-2">Gyroscopic Auton</h4>
              <p className="text-gray-400">
                Advanced autonomous navigation using gyroscopic feedback
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
