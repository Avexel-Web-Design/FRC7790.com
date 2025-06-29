export default function PreviousRobots() {
  return (
    <section id="past-robots" className="py-20 relative z-10 bg-black">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold mb-12 text-center">Previous Robots</h2>
        
        {/* CRESCENDO Robot */}
        <div className="max-w-6xl mx-auto mb-24">
          <div className="card-gradient rounded-xl p-8 transition-all duration-300 reveal">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/2">
                <h3 className="font-anurati text-3xl md:text-4xl text-baywatch-orange tracking-wider mb-4">HUNGRY</h3>
                <p className="text-xl font-bold mb-2">2024 - CRESCENDO</p>
                <p className="text-gray-400 mb-6">
                  HUNGRY featured a high-velocity shooter with adjustable angle control, allowing for long-range note shooting. The telescoping arm provided versatility for placing into the Amp.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <i className="fas fa-eye text-baywatch-orange mt-1 mr-3"></i>
                    <div>
                      <p className="font-bold">Note Detection</p>
                      <p className="text-gray-400 text-sm">Multi-stage ground intake equipped with Limelight 2 and Google Coral to detect Notes</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <i className="fas fa-crosshairs text-baywatch-orange mt-1 mr-3"></i>
                    <div>
                      <p className="font-bold">Auto Aim</p>
                      <p className="text-gray-400 text-sm">Limelight 3-powered trigonometric rotation and arm angle calculations for precise long-distance shots</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="rounded-xl overflow-hidden">
                  <img
                    src="/assets/images/hungry.png"
                    alt="Hungry Robot - 2024 CRESCENDO Challenge"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
