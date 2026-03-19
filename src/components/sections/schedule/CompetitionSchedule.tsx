import { useState, useEffect } from 'react';

interface EventDateRange {
  start: Date;
  end: Date;
}

type EventStatus = 'upcoming' | 'live' | 'completed';

interface CountdownProps {
  targetDate: Date;
}

function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="mt-6">
      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="p-4 bg-black/30 rounded-lg">
          <div className="text-3xl font-bold text-baywatch-orange">{timeLeft.days}</div>
          <div className="text-sm text-gray-400">Days</div>
        </div>
        <div className="p-4 bg-black/30 rounded-lg">
          <div className="text-3xl font-bold text-baywatch-orange">{timeLeft.hours}</div>
          <div className="text-sm text-gray-400">Hours</div>
        </div>
        <div className="p-4 bg-black/30 rounded-lg">
          <div className="text-3xl font-bold text-baywatch-orange">{timeLeft.minutes}</div>
          <div className="text-sm text-gray-400">Minutes</div>
        </div>
        <div className="p-4 bg-black/30 rounded-lg">
          <div className="text-3xl font-bold text-baywatch-orange">{timeLeft.seconds}</div>
          <div className="text-sm text-gray-400">Seconds</div>
        </div>
      </div>
    </div>
  );
}

interface LiveUpdatesProps {
  eventKey: string;
}

function LiveUpdates({ eventKey }: LiveUpdatesProps) {
  return (
    <div className="mt-6 rounded-lg border border-baywatch-orange/40 bg-black/30 p-5">
      <div className="flex items-center justify-center gap-2 text-baywatch-orange">
        <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-baywatch-orange"></span>
        <span className="text-sm font-semibold uppercase tracking-wide">Live updates in progress</span>
      </div>
      <p className="mt-3 text-center text-gray-300">
        This event is currently active. View the latest rankings, match scores, and playoff progress on the event page.
      </p>
      <div className="mt-4 text-center">
        <span className="inline-flex rounded-full bg-baywatch-orange/20 px-3 py-1 text-sm text-white">
          Auto-refreshing data available on event details
        </span>
      </div>
      <div className="mt-4 text-center">
        <a
          href={`/event?event=${eventKey}`}
          className="inline-flex items-center gap-2 rounded-full bg-baywatch-orange px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-baywatch-orange/90"
        >
          Open live event page
          <i className="fas fa-arrow-right"></i>
        </a>
      </div>
    </div>
  );
}

function getEventStatus({ start, end }: EventDateRange, now: Date): EventStatus {
  const currentTime = now.getTime();

  if (currentTime < start.getTime()) {
    return 'upcoming';
  }

  if (currentTime > end.getTime()) {
    return 'completed';
  }

  return 'live';
}

export default function CompetitionSchedule() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  // 2026 Event Date Ranges
  const lakeCityDateRange: EventDateRange = {
    start: new Date('2026-03-13T08:00:00'),
    end: new Date('2026-03-15T23:59:59')
  };
  const traverseCityDateRange: EventDateRange = {
    start: new Date('2026-03-19T08:00:00'),
    end: new Date('2026-03-21T23:59:59')
  };
  const districtChampionshipDateRange: EventDateRange = {
    start: new Date('2026-04-15T08:00:00'),
    end: new Date('2026-04-17T23:59:59')
  };
  const firstChampionshipDateRange: EventDateRange = {
    start: new Date('2026-04-28T08:00:00'),
    end: new Date('2026-05-01T23:59:59')
  };

  const lakeCityStatus = getEventStatus(lakeCityDateRange, now);
  const traverseCityStatus = getEventStatus(traverseCityDateRange, now);
  const districtChampionshipStatus = getEventStatus(districtChampionshipDateRange, now);
  const firstChampionshipStatus = getEventStatus(firstChampionshipDateRange, now);

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

            {/* Event 1: Lake City District Event */}
            <div className="relative mb-20 reveal">
              <a href="/event?event=2026milac" className="block relative z-20">
                <div className="rounded-xl p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,102,0,0.5)] group bg-black border border-baywatch-orange/20">
                  <h3 className="text-2xl font-bold mb-2 text-baywatch-orange glow-orange text-center">
                    Lake City District Event
                  </h3>
                  <div className="flex flex-wrap gap-4 mb-4 justify-center">
                    <span className="px-3 py-1 bg-baywatch-orange/20 rounded-full text-sm">
                      <i className="far fa-calendar-alt mr-2"></i>March 13-15, 2026
                    </span>
                    <span className="px-3 py-1 bg-baywatch-orange/20 rounded-full text-sm">
                      <i className="fas fa-map-marker-alt mr-2"></i>251 Russell Rd, Lake City, MI
                    </span>
                  </div>
                  
                  {lakeCityStatus === 'upcoming' && <Countdown targetDate={lakeCityDateRange.start} />}

                  {lakeCityStatus === 'live' && <LiveUpdates eventKey="2026milac" />}

                  {lakeCityStatus === 'completed' && (
                    <div className="mt-6">
                      <div className="grid grid-cols-1 gap-4 text-center md:grid-cols-3">
                        <div className="flex flex-col items-center rounded-lg bg-black/30 p-4">
                          <h4 className="mb-2 text-lg font-semibold">Final Ranking</h4>
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-4xl font-bold text-baywatch-orange">15</span>
                            <span className="mb-1 self-end text-sm text-gray-400">th</span>
                          </div>
                          <span className="mt-1 block text-gray-400">of 37 teams</span>
                          <div className="mt-1 text-sm text-gray-400">6-6-0</div>
                        </div>
                        <div className="flex flex-col items-center rounded-lg bg-black/30 p-4">
                          <h4 className="mb-2 text-lg font-semibold">Alliance</h4>
                          <div className="text-center">
                            <div className="mb-1 text-4xl font-bold text-baywatch-orange">5</div>
                            <span className="rounded-full bg-baywatch-orange/20 px-2 py-1 text-sm text-white">
                              First Pick
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center rounded-lg bg-black/30 p-4">
                          <h4 className="mb-2 text-lg font-semibold">Playoffs</h4>
                          <div className="text-center">
                            <div className="text-4xl font-bold text-baywatch-orange">3rd</div>
                            <div className="mt-1 text-sm text-gray-400">2-2-0</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
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

            {/* Event 2: Traverse City District Event */}
            <div className="relative mb-20 reveal">
              <a href="/event?event=2026mitvc" className="block relative z-20">
                <div className="rounded-xl p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,102,0,0.5)] group bg-black border border-baywatch-orange/20">
                  <h3 className="text-2xl font-bold mb-2 text-baywatch-orange glow-orange text-center">
                    Traverse City District Event
                  </h3>
                  <div className="flex flex-wrap gap-4 mb-4 justify-center">
                    <span className="px-3 py-1 bg-baywatch-orange/20 rounded-full text-sm">
                      <i className="far fa-calendar-alt mr-2"></i>March 19-21, 2026
                    </span>
                    <span className="px-3 py-1 bg-baywatch-orange/20 rounded-full text-sm">
                      <i className="fas fa-map-marker-alt mr-2"></i>5376 N Long Lake Rd, Traverse City, MI
                    </span>
                  </div>
                  
                  {traverseCityStatus === 'upcoming' && <Countdown targetDate={traverseCityDateRange.start} />}

                  {traverseCityStatus === 'live' && <LiveUpdates eventKey="2026mitvc" />}

                  {traverseCityStatus === 'completed' && (
                    <div className="mt-6">
                      <div className="grid grid-cols-1 gap-4 text-center md:grid-cols-3">
                        <div className="flex flex-col items-center rounded-lg bg-black/30 p-4">
                          <h4 className="mb-2 text-lg font-semibold">Final Ranking</h4>
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-4xl font-bold text-baywatch-orange">1</span>
                            <span className="mb-1 self-end text-sm text-gray-400">st</span>
                          </div>
                          <span className="mt-1 block text-gray-400">of 40 teams</span>
                          <div className="mt-1 text-sm text-gray-400">9-3-0</div>
                        </div>
                        <div className="flex flex-col items-center rounded-lg bg-black/30 p-4">
                          <h4 className="mb-2 text-lg font-semibold">Alliance</h4>
                          <div className="text-center">
                            <div className="mb-1 text-4xl font-bold text-baywatch-orange">1</div>
                            <span className="rounded-full bg-baywatch-orange/20 px-2 py-1 text-sm text-white">
                              <i className="mr-1 fas fa-crown"></i>Captain
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center rounded-lg bg-black/30 p-4">
                          <h4 className="mb-2 text-lg font-semibold">Playoffs</h4>
                          <div className="text-center">
                            <div className="text-4xl font-bold text-yellow-500">
                              <i className="fas fa-medal"></i> 1st <i className="fas fa-medal"></i>
                            </div>
                            <div className="mt-1 text-sm text-gray-400">6-2-1</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
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
              <a href="/event?event=2026micmp" className="block relative z-20">
                <div className="rounded-xl p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,102,0,0.5)] group bg-black border border-baywatch-orange/20">
                  <div className="absolute -top-2 -right-2 px-3 py-1 bg-baywatch-orange rounded-full text-sm">
                    Qualification Pending
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-baywatch-orange glow-orange text-center">
                    FIM District Championship
                  </h3>
                  <div className="flex flex-wrap gap-4 mb-4 justify-center">
                    <span className="px-3 py-1 bg-baywatch-orange/20 rounded-full text-sm">
                      <i className="far fa-calendar-alt mr-2"></i>April 15-17, 2026
                    </span>
                    <span className="px-3 py-1 bg-baywatch-orange/20 rounded-full text-sm">
                      <i className="fas fa-map-marker-alt mr-2"></i>7400 Bay Road, Saginaw, MI
                    </span>
                  </div>
                  
                  {districtChampionshipStatus === 'upcoming' && (
                    <Countdown targetDate={districtChampionshipDateRange.start} />
                  )}

                  {districtChampionshipStatus === 'live' && <LiveUpdates eventKey="2026micmp" />}

                  {districtChampionshipStatus === 'completed' && (
                    <div className="mt-6">
                      <div className="grid grid-cols-1 gap-4 text-center md:grid-cols-3">
                        <div className="flex flex-col items-center rounded-lg bg-black/30 p-4">
                          <h4 className="mb-2 text-lg font-semibold">Final Ranking</h4>
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-4xl font-bold text-baywatch-orange">16</span>
                            <span className="mb-1 self-end text-sm text-gray-400">th</span>
                          </div>
                          <span className="mt-1 block text-gray-400">of 40 teams</span>
                          <div className="mt-1 text-sm text-gray-400">7-5-0</div>
                        </div>
                        <div className="flex flex-col items-center rounded-lg bg-black/30 p-4">
                          <h4 className="mb-2 text-lg font-semibold">Alliance</h4>
                          <div className="text-center">
                            <div className="mb-1 text-4xl font-bold text-baywatch-orange">3</div>
                            <span className="rounded-full bg-baywatch-orange/20 px-2 py-1 text-sm text-white">
                              Second Pick
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center rounded-lg bg-black/30 p-4">
                          <h4 className="mb-2 text-lg font-semibold">Playoffs</h4>
                          <div className="text-center">
                            <div className="text-4xl font-bold text-baywatch-orange">7th</div>
                            <div className="mt-1 text-sm text-gray-400">0-2-0</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
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
              <a href="/event?event=2026cmptx" className="block relative z-20">
                <div className="rounded-xl p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,102,0,0.5)] group bg-black border border-baywatch-orange/20">
                  <div className="absolute -top-2 -right-2 px-3 py-1 bg-baywatch-orange rounded-full text-sm">
                    Qualification Pending
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-baywatch-orange glow-orange text-center">
                    FIRST Championship
                  </h3>
                  <div className="flex flex-wrap gap-4 mb-4 justify-center">
                    <span className="px-3 py-1 bg-baywatch-orange/20 rounded-full text-sm">
                      <i className="far fa-calendar-alt mr-2"></i>April 28 - May 1, 2026
                    </span>
                    <span className="px-3 py-1 bg-baywatch-orange/20 rounded-full text-sm">
                      <i className="fas fa-map-marker-alt mr-2"></i>1001 Avenida De Las Americas, Houston, TX
                    </span>
                  </div>
                  
                  {firstChampionshipStatus === 'upcoming' && (
                    <Countdown targetDate={firstChampionshipDateRange.start} />
                  )}

                  {firstChampionshipStatus === 'live' && <LiveUpdates eventKey="2026cmptx" />}

                  {firstChampionshipStatus === 'completed' && (
                    <div className="mt-6" id="championship-results">
                      <div className="grid grid-cols-1 gap-4 text-center md:grid-cols-3">
                        <div className="flex flex-col items-center rounded-lg bg-black/30 p-4">
                          <h4 className="mb-2 text-lg font-semibold">Final Ranking</h4>
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-4xl font-bold text-baywatch-orange">41</span>
                            <span className="mb-1 self-end text-sm text-gray-400">st</span>
                          </div>
                          <span className="mt-1 block text-gray-400">of 75 teams</span>
                          <div className="mt-1 text-sm text-gray-400">6-4-0</div>
                        </div>
                        <div className="flex flex-col items-center rounded-lg bg-black/30 p-4">
                          <h4 className="mb-2 text-lg font-semibold">Alliance</h4>
                          <div className="text-center">
                            <div className="mb-1 text-4xl font-bold text-baywatch-orange">
                              <i className="fas fa-times"></i>
                            </div>
                            <span className="rounded-full bg-baywatch-orange/20 px-2 py-1 text-sm text-white">
                              No selection
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center rounded-lg bg-black/30 p-4">
                          <h4 className="mb-2 text-lg font-semibold">Playoffs</h4>
                          <div className="text-center">
                            <div className="text-4xl font-bold text-baywatch-orange">
                              <i className="fas fa-minus"></i>
                            </div>
                            <div className="mt-1 text-sm text-gray-400">Did not qualify</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
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
