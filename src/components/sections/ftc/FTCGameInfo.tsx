export default function FTCGameInfo() {
  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold mb-8 text-center">INTO THE DEEP</h2>
        <div className="flex flex-col items-center max-w-4xl mx-auto gap-12">
          <p className="text-gray-400 text-lg text-center">
            In INTO THE DEEP presented by RTX, teams dive into underwater
            robotics challenges on a 12ft square field featuring a central
            submersible structure and elevated baskets.
          </p>

          {/* Video Container */}
          <div className="w-full aspect-video rounded-xl overflow-hidden">
            <video
              className="w-full h-full object-cover"
              controls
            >
              <source src="/assets/videos/INTO THE DEEP.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Game Elements Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="card-gradient rounded-xl p-4 hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <i className="fas fa-box text-baywatch-orange"></i>
                <h4 className="font-semibold">Sample Collection</h4>
              </div>
              <p className="text-gray-400 text-sm">
                Score samples in baskets and create specimens with clips for
                higher points
              </p>
            </div>
            <div className="card-gradient rounded-xl p-4 hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <i className="fas fa-robot text-baywatch-orange"></i>
                <h4 className="font-semibold">Robot Specs</h4>
              </div>
              <p className="text-gray-400 text-sm">
                18" cube at start, may expand to 20"x42" during play
              </p>
            </div>
            <div className="card-gradient rounded-xl p-4 hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <i className="fas fa-clock text-baywatch-orange"></i>
                <h4 className="font-semibold">Match Format</h4>
              </div>
              <p className="text-gray-400 text-sm">
                30s autonomous, 2min driver control, with special endgame
                scoring
              </p>
            </div>
            <div className="card-gradient rounded-xl p-4 hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <i className="fas fa-arrow-up text-baywatch-orange"></i>
                <h4 className="font-semibold">Endgame Ascent</h4>
              </div>
              <p className="text-gray-400 text-sm">
                Earn up to 30 points for high-level ascent in final 30 seconds
              </p>
            </div>
          </div>

          {/* Game Elements List */}
          <div className="card-gradient rounded-xl p-4 hover:scale-105 transition-all duration-300 w-full">
            <h4 className="font-semibold text-baywatch-orange mb-2">
              Game Elements
            </h4>
            <ul className="text-gray-400 space-y-2 text-sm">
              <li>
                • 20 Red Alliance samples, 20 Blue Alliance samples, 40 neutral
                samples
              </li>
              <li>• 20 clips per Alliance to create specimens</li>
              <li>• Observation zones for human players</li>
              <li>• Central submersible with low/high chambers and rungs</li>
              <li>• Low and high baskets in opposite corners</li>
              <li>• Net zones located below the baskets</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
