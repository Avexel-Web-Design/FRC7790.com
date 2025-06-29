export default function CompetitionSchedule() {
  return (
    <section
      className="py-16 relative z-10 animate__animated animate__fadeInUp"
      style={{ animationDelay: '1s' }}
    >
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {/* Timeline */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-[calc(100%-2rem)] bg-gradient-to-b from-baywatch-orange/50 via-baywatch-orange/40 to-baywatch-orange/30 top-0"></div>

            {/* Starting dot */}
            <div className="flex items-center justify-center mb-12">
              <div className="w-8 h-8 bg-baywatch-orange rounded-full relative z-10 glow-orange"></div>
            </div>

            {/* Event 1: Lake City Regional */}
            <div className="relative mb-20 reveal">
              <a href="/event?event=2025milac" className="block relative z-20">
                <div className="card-gradient rounded-xl p-6 transform transition-all duration-300 hover:scale-105 group bg-black">
                  <h3 className="text-2xl font-bold mb-2 text-baywatch-orange glow-orange text-center">
                    Lake City Regional
                  </h3>
                  <div className="flex flex-wrap gap-4 mb-4 justify-center">
                    <span className="px-3 py-1 bg-baywatch-orange/20 rounded-full text-sm">
                      <i className="far fa-calendar-alt mr-2"></i>February 28 - March 2, 2025
                    </span>
                    <span className="px-3 py-1 bg-baywatch-orange/20 rounded-full text-sm">
                      <i className="fas fa-map-marker-alt mr-2"></i>251 Russell Rd, Lake City, MI
                    </span>
                  </div>
                  
                  {/* Results Section for Lake City Regional */}
                  <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      {/* Final Ranking */}
                      <div className="p-4 bg-black/30 rounded-lg flex flex-col items-center">
                        <h4 className="text-lg font-semibold mb-2">Final Ranking</h4>
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-4xl font-bold text-baywatch-orange">15</span>
                          <span className="text-sm text-gray-400 self-end mb-1">th</span>
                        </div>
                        <span className="text-gray-400 block mt-1">of 37 teams</span>
                        <div className="text-sm text-gray-400 mt-1">6-6-0</div>
                      </div>

                      {/* Alliance Selection */}
                      <div className="p-4 bg-black/30 rounded-lg flex flex-col items-center">
                        <h4 className="text-lg font-semibold mb-2">Alliance</h4>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-baywatch-orange mb-1">5</div>
                          <span className="text-sm bg-baywatch-orange/20 px-2 py-1 rounded-full text-white">
                            First Pick
                          </span>
                        </div>
                      </div>

                      {/* Playoffs */}
                      <div className="p-4 bg-black/30 rounded-lg flex flex-col items-center">
                        <h4 className="text-lg font-semibold mb-2">Playoffs</h4>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-baywatch-orange">3rd</div>
                          <div className="text-sm text-gray-400 mt-1">2-2-0</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-4 right-4 text-baywatch-orange/50 group-hover:text-baywatch-orange transition-colors">
                    <i className="fas fa-external-link-alt"></i>
                  </div>
                </div>
              </a>
              {/* Dot between events */}
              <div className="flex items-center justify-center -mb-12 mt-8">
                <div className="w-8 h-8 bg-baywatch-orange rounded-full relative z-10 glow-orange"></div>
              </div>
            </div>

            {/* Event 2: Traverse City Regional */}
            <div className="relative mb-20 reveal">
              <a href="/event?event=2025mitvc" className="block relative z-20">
                <div className="card-gradient rounded-xl p-6 transform transition-all duration-300 hover:scale-105 group bg-black">
                  <h3 className="text-2xl font-bold mb-2 text-baywatch-orange glow-orange text-center">
                    Traverse City Regional
                  </h3>
                  <div className="flex flex-wrap gap-4 mb-4 justify-center">
                    <span className="px-3 py-1 bg-baywatch-orange/20 rounded-full text-sm">
                      <i className="far fa-calendar-alt mr-2"></i>March 13-15, 2025
                    </span>
                    <span className="px-3 py-1 bg-baywatch-orange/20 rounded-full text-sm">
                      <i className="fas fa-map-marker-alt mr-2"></i>1150 Milliken Drive, Traverse City, MI
                    </span>
                  </div>
                  
                  {/* Results Section for Traverse City Regional */}
                  <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      {/* Final Ranking */}
                      <div className="p-4 bg-black/30 rounded-lg flex flex-col items-center">
                        <h4 className="text-lg font-semibold mb-2">Final Ranking</h4>
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-4xl font-bold text-baywatch-orange">1</span>
                          <span className="text-sm text-gray-400 self-end mb-1">st</span>
                        </div>
                        <span className="text-gray-400 block mt-1">of 40 teams</span>
                        <div className="text-sm text-gray-400 mt-1">9-3-0</div>
                      </div>

                      {/* Alliance Selection */}
                      <div className="p-4 bg-black/30 rounded-lg flex flex-col items-center">
                        <h4 className="text-lg font-semibold mb-2">Alliance</h4>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-baywatch-orange mb-1">1</div>
                          <span className="text-sm bg-baywatch-orange/20 px-2 py-1 rounded-full text-white">
                            <i className="fas fa-crown mr-1"></i>Captain
                          </span>
                        </div>
                      </div>

                      {/* Playoffs */}
                      <div className="p-4 bg-black/30 rounded-lg flex flex-col items-center">
                        <h4 className="text-lg font-semibold mb-2">Playoffs</h4>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-yellow-500">
                            <i className="fas fa-medal"></i> 1st <i className="fas fa-medal"></i>
                          </div>
                          <div className="text-sm text-gray-400 mt-1">6-2-1</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-4 right-4 text-baywatch-orange/50 group-hover:text-baywatch-orange transition-colors">
                    <i className="fas fa-external-link-alt"></i>
                  </div>
                </div>
              </a>
              {/* Dot between events */}
              <div className="flex items-center justify-center -mb-12 mt-8">
                <div className="w-8 h-8 bg-baywatch-orange rounded-full relative z-10 glow-orange"></div>
              </div>
            </div>

            {/* Event 3: FIM District Championship */}
            <div className="relative mb-20 reveal">
              <a href="/event?event=2025micmp4" className="block relative z-20">
                <div className="card-gradient rounded-xl p-6 transform transition-all duration-300 hover:scale-105 group bg-black">
                  <div className="absolute -top-2 -right-2 px-3 py-1 bg-baywatch-orange rounded-full text-sm">
                    Qualified!
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-baywatch-orange glow-orange text-center">
                    FIM District Championship
                  </h3>
                  <div className="flex flex-wrap gap-4 mb-4 justify-center">
                    <span className="px-3 py-1 bg-baywatch-orange/20 rounded-full text-sm">
                      <i className="far fa-calendar-alt mr-2"></i>April 3-5, 2025
                    </span>
                    <span className="px-3 py-1 bg-baywatch-orange/20 rounded-full text-sm">
                      <i className="fas fa-map-marker-alt mr-2"></i>7400 Bay Road, Saginaw, MI
                    </span>
                    <span className="px-3 py-1 bg-baywatch-orange/20 rounded-full text-sm">
                      <i className="fas fa-location-crosshairs mr-2"></i>Aptiv Division
                    </span>
                  </div>
                  
                  {/* Results Section */}
                  <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      {/* Final Ranking */}
                      <div className="p-4 bg-black/30 rounded-lg flex flex-col items-center">
                        <h4 className="text-lg font-semibold mb-2">Final Ranking</h4>
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-4xl font-bold text-baywatch-orange">16</span>
                          <span className="text-sm text-gray-400 self-end mb-1">th</span>
                        </div>
                        <span className="text-gray-400 block mt-1">of 40 teams</span>
                        <div className="text-sm text-gray-400 mt-1">7-5-0</div>
                      </div>

                      {/* Alliance Selection */}
                      <div className="p-4 bg-black/30 rounded-lg flex flex-col items-center">
                        <h4 className="text-lg font-semibold mb-2">Alliance</h4>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-baywatch-orange mb-1">3</div>
                          <span className="text-sm bg-baywatch-orange/20 px-2 py-1 rounded-full text-white">
                            Second Pick
                          </span>
                        </div>
                      </div>

                      {/* Playoffs */}
                      <div className="p-4 bg-black/30 rounded-lg flex flex-col items-center">
                        <h4 className="text-lg font-semibold mb-2">Playoffs</h4>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-baywatch-orange">7th</div>
                          <div className="text-sm text-gray-400 mt-1">0-2-0</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-4 right-4 text-baywatch-orange/50 group-hover:text-baywatch-orange transition-colors">
                    <i className="fas fa-external-link-alt"></i>
                  </div>
                </div>
              </a>
              {/* Dot between events */}
              <div className="flex items-center justify-center -mb-12 mt-8">
                <div className="w-8 h-8 bg-baywatch-orange rounded-full relative z-10 glow-orange"></div>
              </div>
            </div>

            {/* Event 4: FIRST Championship */}
            <div className="relative reveal">
              <a href="/event?event=2025mil" className="block relative z-20">
                <div className="card-gradient rounded-xl p-6 transform transition-all duration-300 hover:scale-105 group bg-black">
                  <div className="absolute -top-2 -right-2 px-3 py-1 bg-baywatch-orange rounded-full text-sm">
                    Qualified!
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-baywatch-orange glow-orange text-center">
                    FIRST Championship
                  </h3>
                  <div className="flex flex-wrap gap-4 mb-4 justify-center">
                    <span className="px-3 py-1 bg-baywatch-orange/20 rounded-full text-sm">
                      <i className="far fa-calendar-alt mr-2"></i>April 16-19, 2025
                    </span>
                    <span className="px-3 py-1 bg-baywatch-orange/20 rounded-full text-sm">
                      <i className="fas fa-map-marker-alt mr-2"></i>1001 Avenida De Las Americas, Houston, TX
                    </span>
                    <span className="px-3 py-1 bg-baywatch-orange/20 rounded-full text-sm">
                      <i className="fas fa-location-crosshairs mr-2"></i>Milstein Division
                    </span>
                  </div>
                  
                  {/* Results for FIRST Championship */}
                  <div className="mt-6" id="championship-results">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      {/* Final Ranking */}
                      <div className="p-4 bg-black/30 rounded-lg flex flex-col items-center">
                        <h4 className="text-lg font-semibold mb-2">Final Ranking</h4>
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-4xl font-bold text-baywatch-orange">41</span>
                          <span className="text-sm text-gray-400 self-end mb-1">st</span>
                        </div>
                        <span className="text-gray-400 block mt-1">of 75 teams</span>
                        <div className="text-sm text-gray-400 mt-1">6-4-0</div>
                      </div>
                      {/* Alliance Selection */}
                      <div className="p-4 bg-black/30 rounded-lg flex flex-col items-center">
                        <h4 className="text-lg font-semibold mb-2">Alliance</h4>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-baywatch-orange mb-1">
                            <i className="fas fa-times"></i>
                          </div>
                          <span className="text-sm bg-baywatch-orange/20 px-2 py-1 rounded-full text-white">
                            No selection
                          </span>
                        </div>
                      </div>
                      {/* Playoffs */}
                      <div className="p-4 bg-black/30 rounded-lg flex flex-col items-center">
                        <h4 className="text-lg font-semibold mb-2">Playoffs</h4>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-baywatch-orange">
                            <i className="fas fa-minus"></i>
                          </div>
                          <div className="text-sm text-gray-400 mt-1">Did not qualify</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-4 right-4 text-baywatch-orange/50 group-hover:text-baywatch-orange transition-colors">
                    <i className="fas fa-external-link-alt"></i>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
