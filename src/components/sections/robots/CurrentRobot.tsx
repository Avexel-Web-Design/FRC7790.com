export default function CurrentRobot() {
  return (
    <section id="robot-riptide" className="py-20 relative z-10 bg-black">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold mb-8 text-center animate__animated animate__fadeInUp" style={{ animationDelay: '0.8s' }}>
          2025 - REEFSCAPE
        </h2>
        
        <div className="flex flex-col items-center justify-center max-w-6xl mx-auto">
          <h3 className="text-center mb-8">
            <span 
              className="text-[min(8vw,6rem)] font-bold font-anurati text-baywatch-orange glow-orange tracking-[.25em] animate__animated animate__fadeInUp" 
              style={{ animationDelay: '1s' }}
            >
              RIPTIDE
            </span>
          </h3>
          
          {/* Main Robot Image */}
          <div className="mb-16 relative">
            <div className="rounded-xl overflow-hidden">
              <img
                src="/assets/images/RIPTIDE/short-better.png"
                alt="RIPTIDE Robot"
                className="w-full max-w-4xl mx-auto object-contain animate__animated animate__fadeInUp"
                style={{ animationDelay: '1s' }}
              />
            </div>
          </div>

          {/* Robot Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 animate__animated animate__fadeInUp">
            <div className="card-gradient rounded-xl p-6 hover:scale-105 transition-all duration-300">
              <i className="fas fa-layer-group text-3xl text-baywatch-orange mb-4"></i>
              <h3 className="text-xl font-bold mb-2">Multi-Level Scoring</h3>
              <p className="text-gray-400">
                Placement system with "scope" camera capable of quickly scoring on all reef levels
              </p>
            </div>
            <div className="card-gradient rounded-xl p-6 hover:scale-105 transition-all duration-300">
              <i className="fas fa-eye text-3xl text-baywatch-orange mb-4"></i>
              <h3 className="text-xl font-bold mb-2">Advanced Vision</h3>
              <p className="text-gray-400">
                Dual-camera powered pose estimation system enables precise scoring and autonomous navigation
              </p>
            </div>
            <div className="card-gradient rounded-xl p-6 hover:scale-105 transition-all duration-300">
              <i className="fas fa-arrow-up text-3xl text-baywatch-orange mb-4"></i>
              <h3 className="text-xl font-bold mb-2">Deep Cage Climb</h3>
              <p className="text-gray-400">
                Folding funnel and climb camera allow for centered Deep Cage positioning
              </p>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="card-gradient rounded-xl p-8 mb-12 hover:scale-105 transition-all duration-300">
            <h3 className="text-2xl font-bold mb-6 text-center">Technical Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="relative p-6 rounded-2xl bg-black/90 border border-baywatch-orange/30 shadow-2xl hover:shadow-baywatch-orange/30 transition-all duration-500 animate-fade-in group">
                <h4 className="text-xl font-bold mb-4 text-baywatch-orange">Key Features</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>• Folding Funnel Intake</li>
                  <li>• Processor Placement</li>
                  <li>• Deep Cage Climbing</li>
                  <li>• Pose Estimation</li>
                  <li>• MK4i Swerve Drive</li>
                </ul>
              </div>
              <div className="relative p-6 rounded-2xl bg-black/90 border border-baywatch-orange/30 shadow-2xl hover:shadow-baywatch-orange/30 transition-all duration-500 animate-fade-in group">
                <h4 className="text-xl font-bold mb-4 text-baywatch-orange">Capabilities</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>• L1-L4 Scoring</li>
                  <li>• 3-Coral L4 Auton</li>
                  <li>• Algae Removal</li>
                  <li>• Autonomous Reef Lineup</li>
                  <li>• 14-17 Coral per Match</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
