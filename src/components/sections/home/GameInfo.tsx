export default function GameInfo() {
  return (
    <section className="py-12 sm:py-20 bg-black">
      <div className="container mx-auto px-3 sm:px-6">
        <h2 className="text-4xl font-bold mb-8 text-center">REBUILT</h2>
        <div className="flex flex-col items-center max-w-4xl mx-auto gap-12">
          <p className="text-gray-400 text-lg text-center">
            Welcome to FIRST AGE and the 2026 FRC game, REBUILT!
          </p>

          {/* Video Container */}
          <div className="w-full aspect-video rounded-xl overflow-hidden">
            <video 
              className="w-full h-full"
              src="/assets/videos/AGE.mp4#t=1"
              title="FIRST AGE Season Reveal"
              controls
              preload="metadata"
              poster="/assets/images/video-thumbnail.jpg"
            >
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Game Elements Grid - Commented out in original but ready to enable */}
          {/* 
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="card-gradient rounded-xl p-4 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-3 mb-2">
                <i className="fas fa-robot text-baywatch-orange"></i>
                <h4 className="font-semibold">Match Format</h4>
              </div>
              <p className="text-gray-400 text-sm">
                15s autonomous, 2:15 driver control, with 20s endgame for barge ascent
              </p>
            </div>
            <div className="card-gradient rounded-xl p-4 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-3 mb-2">
                <i className="fas fa-water text-baywatch-orange"></i>
                <h4 className="font-semibold">Game Elements</h4>
              </div>
              <p className="text-gray-400 text-sm">
                Score coral on reefs, harvest algae, and climb onto a cage for points
              </p>
            </div>
            <div className="card-gradient rounded-xl p-4 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-3 mb-2">
                <i className="fas fa-trophy text-baywatch-orange"></i>
                <h4 className="font-semibold">Ranking Points</h4>
              </div>
              <p className="text-gray-400 text-sm">
                Earn up to 6 RPs per match through autonomous, coral, coopertition, and barge tasks
              </p>
            </div>
            <div className="card-gradient rounded-xl p-4 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-3 mb-2">
                <i className="fas fa-handshake text-baywatch-orange"></i>
                <h4 className="font-semibold">Coopertition®</h4>
              </div>
              <p className="text-gray-400 text-sm">
                Work together to deliver algae and reduce coral RP requirements
              </p>
            </div>
          </div>
          */}
        </div>
      </div>
    </section>
  );
}
