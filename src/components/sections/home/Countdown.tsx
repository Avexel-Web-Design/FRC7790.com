import { useState, useEffect } from 'react';
import { useFRCCompetitionData } from '../../../hooks/useFRCData';
import { frcAPI } from '../../../utils/frcAPI';

// 2026 Season Events Schedule
const EVENTS_2026 = [
  {
    name: 'Lake City District Event',
    code: '2026milac',
    startDate: new Date('2026-03-13T08:00:00'),
    endDate: new Date('2026-03-15T23:59:59'),
    location: 'Lake City, MI'
  },
  {
    name: 'Traverse City District Event',
    code: '2026mitvc',
    startDate: new Date('2026-03-19T08:00:00'),
    endDate: new Date('2026-03-21T23:59:59'),
    location: 'Traverse City, MI'
  },
  {
    name: 'FIM District Championship',
    code: '2026micmp',
    startDate: new Date('2026-04-15T08:00:00'),
    endDate: new Date('2026-04-17T23:59:59'),
    location: 'Saginaw, MI'
  },
  {
    name: 'FIRST Championship',
    code: '2026cmptx',
    startDate: new Date('2026-04-28T08:00:00'),
    endDate: new Date('2026-05-01T23:59:59'),
    location: 'Houston, TX'
  }
];

// SIMULATION MODE - Set to true to preview the "live event" UI
// Set to false for production
const SIMULATE_LIVE_EVENT = false;
const SIMULATED_EVENT_INDEX = 0; // 0 = Lake City, 1 = Traverse City, 2 = FIM Championship, 3 = FIRST Championship

// Override with a real past event code to test with actual TBA data
// Set to null to use the SIMULATED_EVENT_INDEX from EVENTS_2026
const SIMULATE_EVENT_CODE = '2025milac'; // e.g., '2025mitvc' for Traverse City 2025

// Simulate being at a specific point in the event (after X matches played)
// Set to null to show actual data (completed events won't have "next match")
// Set to a number (e.g., 5) to simulate being after match 5, showing match 6 as "next"
// For 2025mitvc, Team 7790 played qual matches 1-64, then playoffs
const SIMULATE_AFTER_MATCH = 15; // null = real data, number = simulate after that many qual matches

interface ScheduledEvent {
  name: string;
  code: string;
  startDate: Date;
  endDate: Date;
  location: string;
}

interface AllianceInfo {
  allianceNumber: number;
  pickPosition: string; // "Captain", "1st Pick", "2nd Pick", "Backup"
}

function getNextEvent(): { event: ScheduledEvent | null; isLive: boolean } {
  // SIMULATION MODE - Override for testing
  if (SIMULATE_LIVE_EVENT) {
    // If a specific event code is provided, use it (for testing with real past event data)
    if (SIMULATE_EVENT_CODE) {
      return { 
        event: {
          name: 'Simulated Event',
          code: SIMULATE_EVENT_CODE,
          startDate: new Date(),
          endDate: new Date(),
          location: 'Simulation'
        }, 
        isLive: true 
      };
    }
    return { event: EVENTS_2026[SIMULATED_EVENT_INDEX], isLive: true };
  }

  const now = new Date();
  
  // Check if any event is currently happening
  for (const event of EVENTS_2026) {
    if (now >= event.startDate && now <= event.endDate) {
      return { event, isLive: true };
    }
  }
  
  // Find the next upcoming event
  for (const event of EVENTS_2026) {
    if (now < event.startDate) {
      return { event, isLive: false };
    }
  }
  
  // All events have passed
  return { event: null, isLive: false };
}

// Custom hook to fetch event data for a specific event code
function useEventData(eventCode: string | null, simulateAfterMatch: number | null = null) {
  const [data, setData] = useState<{
    ranking: number;
    totalTeams: number;
    wins: number;
    losses: number;
    ties: number;
    nextMatch: any;
    eventName: string;
    eventLocation: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!eventCode) {
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setIsLoading(true);
        
        // eventCode is guaranteed to be non-null here due to the early return above
        const code = eventCode as string;
        
        // Fetch ranking, all matches, and event info in parallel
        const [ranking, allMatches, eventInfo] = await Promise.all([
          frcAPI.getTeamRanking(code),
          frcAPI.getTeamMatches(code),
          frcAPI.fetchEventData(code)
        ]);

        // Determine next match based on simulation settings
        let nextMatch = null;
        let simulatedWins = ranking?.wins || 0;
        let simulatedLosses = ranking?.losses || 0;
        let simulatedTies = ranking?.ties || 0;
        
        if (simulateAfterMatch !== null && allMatches && allMatches.length > 0) {
          // Find all of team 7790's matches
          const team7790Matches = allMatches
            .filter((m: any) => {
              const blueTeams = m.alliances?.blue?.team_keys || [];
              const redTeams = m.alliances?.red?.team_keys || [];
              return blueTeams.includes('frc7790') || redTeams.includes('frc7790');
            })
            .sort((a: any, b: any) => {
              // Sort by actual_time or predicted_time (chronological order)
              // This works for both quals and the 2025 double-elimination playoffs
              const timeA = a.actual_time || a.predicted_time || 0;
              const timeB = b.actual_time || b.predicted_time || 0;
              return timeA - timeB;
            });
          
          // Debug: log match count and types
          console.log('Total team 7790 matches:', team7790Matches.length);
          console.log('Match breakdown:', team7790Matches.map((m: any) => `${m.comp_level}${m.set_number ? m.set_number : ''}-${m.match_number}`).join(', '));
          console.log('Simulating after match:', simulateAfterMatch);
          console.log('Next match would be index', simulateAfterMatch, ':', team7790Matches[simulateAfterMatch]?.key);
          
          if (team7790Matches.length > simulateAfterMatch) {
            // Get the next match after the simulated point
            nextMatch = team7790Matches[simulateAfterMatch];
            
            // Calculate simulated record based on qual matches "played" so far
            // (record only counts qual matches)
            simulatedWins = 0;
            simulatedLosses = 0;
            simulatedTies = 0;
            
            for (let i = 0; i < simulateAfterMatch; i++) {
              const match = team7790Matches[i];
              // Only count qual matches for record
              if (match.comp_level !== 'qm') continue;
              
              const blueTeams = match.alliances?.blue?.team_keys || [];
              const isBlue = blueTeams.includes('frc7790');
              const blueScore = match.alliances?.blue?.score || 0;
              const redScore = match.alliances?.red?.score || 0;
              
              if (blueScore === redScore) {
                simulatedTies++;
              } else if ((isBlue && blueScore > redScore) || (!isBlue && redScore > blueScore)) {
                simulatedWins++;
              } else {
                simulatedLosses++;
              }
            }
          }
        } else {
          // Use real next match data (will be null for completed events)
          nextMatch = await frcAPI.getNextMatch(code);
        }

        setData({
          ranking: ranking?.rank || 0,
          totalTeams: ranking?.totalTeams || 0,
          wins: simulateAfterMatch !== null ? simulatedWins : (ranking?.wins || 0),
          losses: simulateAfterMatch !== null ? simulatedLosses : (ranking?.losses || 0),
          ties: simulateAfterMatch !== null ? simulatedTies : (ranking?.ties || 0),
          nextMatch,
          eventName: eventInfo?.name || 'Event',
          eventLocation: eventInfo?.city && eventInfo?.state_prov 
            ? `${eventInfo.city}, ${eventInfo.state_prov}`
            : ''
        });
      } catch (error) {
        console.error('Error fetching event data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [eventCode, simulateAfterMatch]);

  return { data, isLoading };
}

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [nextEvent, setNextEvent] = useState<{ event: ScheduledEvent | null; isLive: boolean }>({ event: null, isLive: false });
  const [allianceInfo, setAllianceInfo] = useState<AllianceInfo | null>(null);
  
  // Initialize nextEvent immediately
  useEffect(() => {
    setNextEvent(getNextEvent());
  }, []);
  
  // Get live competition data - use custom hook for simulation, regular hook for production
  const { data: simEventData, isLoading: simLoading } = useEventData(
    SIMULATE_LIVE_EVENT && SIMULATE_EVENT_CODE ? SIMULATE_EVENT_CODE : null,
    SIMULATE_LIVE_EVENT ? SIMULATE_AFTER_MATCH : null
  );
  const { data: prodCompetitionData, isLoading: prodLoading } = useFRCCompetitionData(
    SIMULATE_LIVE_EVENT && SIMULATE_EVENT_CODE ? 0 : 30000 // Disable polling if simulating
  );
  
  // Use simulation data if available, otherwise production data
  const competitionData = (SIMULATE_LIVE_EVENT && SIMULATE_EVENT_CODE) ? simEventData : prodCompetitionData;
  const isLoading = (SIMULATE_LIVE_EVENT && SIMULATE_EVENT_CODE) ? simLoading : prodLoading;

  // Fetch alliance info when event is live
  useEffect(() => {
    async function fetchAllianceInfo() {
      if (!nextEvent.isLive || !nextEvent.event) return;
      
      // Use simulation event code if provided, otherwise use the current event code
      const allianceEventCode = SIMULATE_LIVE_EVENT && SIMULATE_EVENT_CODE 
        ? SIMULATE_EVENT_CODE 
        : nextEvent.event.code;
      
      try {
        const alliances = await frcAPI.fetchEventAlliances(allianceEventCode);
        if (!alliances || alliances.length === 0) {
          setAllianceInfo(null);
          return;
        }
        
        // Find which alliance Team 7790 is on
        for (let i = 0; i < alliances.length; i++) {
          const alliance = alliances[i];
          const picks = alliance.picks || [];
          const teamIndex = picks.findIndex((team: string) => team === 'frc7790');
          
          if (teamIndex !== -1) {
            const pickPositions = ['Captain', '1st Pick', '2nd Pick', 'Backup'];
            setAllianceInfo({
              allianceNumber: i + 1,
              pickPosition: pickPositions[teamIndex] || `Pick ${teamIndex}`
            });
            return;
          }
        }
        
        // Team not found in any alliance
        setAllianceInfo(null);
      } catch (error) {
        console.error('Error fetching alliance info:', error);
        setAllianceInfo(null);
      }
    }
    
    fetchAllianceInfo();
    // Refresh alliance info every 60 seconds during live event
    const interval = setInterval(fetchAllianceInfo, 60000);
    return () => clearInterval(interval);
  }, [nextEvent.isLive, nextEvent.event]);

  useEffect(() => {
    const updateTimer = () => {
      const eventInfo = getNextEvent();
      setNextEvent(eventInfo);
      
      if (!eventInfo.event || eventInfo.isLive) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const now = new Date().getTime();
      const distance = eventInfo.event.startDate.getTime() - now;

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  // If an event is currently live, show live event card
  if (nextEvent.isLive && nextEvent.event) {
    const hasData = !isLoading && competitionData && competitionData.ranking > 0;
    
    // Use fetched event data if available (for simulation), otherwise use nextEvent data
    const displayEventName = competitionData?.eventName || nextEvent.event.name;
    // eventLocation only exists on simEventData, not on CompetitionData
    const simData = simEventData as { eventLocation?: string } | null;
    const displayEventLocation = simData?.eventLocation || nextEvent.event.location;
    const displayEventCode = SIMULATE_LIVE_EVENT && SIMULATE_EVENT_CODE ? SIMULATE_EVENT_CODE : nextEvent.event.code;
    
    return (
      <section id="countdown-section" className="py-20 sm:py-20 bg-black scroll-mt-24">
        <div className="container mx-auto px-4 sm:px-6">
          <a 
            href={`/event?event=${displayEventCode}`}
            className="block max-w-4xl mx-auto p-4 sm:p-8 card-gradient rounded-xl transition-all duration-300 glow-orange hover:scale-105"
          >
            <h2 className="text-4xl font-bold mb-2 text-center text-baywatch-orange">{displayEventName}</h2>
            <p className="text-gray-400 text-center mb-6">
              {displayEventLocation}
            </p>
            
            {isLoading ? (
              <div className="flex justify-center">
                <div className="animate-pulse text-gray-400">Loading live data...</div>
              </div>
            ) : hasData ? (
              <div className={`grid gap-4 ${allianceInfo && competitionData.nextMatch ? 'grid-cols-3' : allianceInfo || competitionData.nextMatch ? 'grid-cols-2' : 'grid-cols-1'} max-w-2xl mx-auto`}>
                {/* Ranking */}
                <div className="bg-black/50 rounded-lg p-4 text-center">
                  <span className="text-gray-400 text-sm block mb-1">Ranking</span>
                  <div className="text-3xl font-bold text-baywatch-orange">
                    #{competitionData.ranking}
                    <span className="text-lg text-gray-400">/{competitionData.totalTeams}</span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {competitionData.wins}-{competitionData.losses}-{competitionData.ties}
                  </span>
                </div>

                {/* Alliance Info (only if team is on an alliance) */}
                {allianceInfo && (
                  <div className="bg-black/50 rounded-lg p-4 text-center">
                    <span className="text-gray-400 text-sm block mb-1">Alliance</span>
                    <div className="text-3xl font-bold text-baywatch-orange">
                      #{allianceInfo.allianceNumber}
                    </div>
                    <span className="text-gray-500 text-xs">{allianceInfo.pickPosition}</span>
                  </div>
                )}

                {/* Next Match (only if there's a scheduled match) */}
                {competitionData.nextMatch && (
                  <div className="bg-black/50 rounded-lg p-4 text-center">
                    <span className="text-gray-400 text-sm block mb-1">Next Match</span>
                    <div className="text-3xl font-bold text-baywatch-orange">
                      {frcAPI.formatMatchName(competitionData.nextMatch)}
                    </div>
                    <span className="text-gray-500 text-xs">
                      {frcAPI.formatMatchTime(competitionData.nextMatch)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <p>Event data will appear once matches begin</p>
              </div>
            )}
            
            <p className="text-center text-baywatch-orange mt-6 text-sm">
              <i className="fas fa-external-link-alt mr-2"></i>View Full Event Details
            </p>
          </a>
        </div>
      </section>
    );
  }

  // If no more events this season
  if (!nextEvent.event) {
    return (
      <section id="countdown-section" className="py-20 sm:py-20 bg-black scroll-mt-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto p-4 sm:p-8 card-gradient rounded-xl transition-all duration-300 glow-orange hover:scale-105">
            <h2 className="text-4xl font-bold mb-4 text-center">2026 Season Complete</h2>
            <p className="text-gray-400 text-center mb-4">
              Thanks for an amazing season! See you next year.
            </p>
            <div className="text-center">
              <a href="/schedule" className="text-baywatch-orange hover:underline">
                View Season Results <i className="fas fa-arrow-right ml-2"></i>
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Default: countdown to next event
  return (
    <section id="countdown-section" className="py-20 sm:py-20 bg-black scroll-mt-24">
      <div className="container mx-auto px-4 sm:px-6">
        <a 
          href={`/event?event=${nextEvent.event.code}`}
          className="block max-w-4xl mx-auto p-4 sm:p-8 card-gradient rounded-xl transition-all duration-300 glow-orange hover:scale-105"
        >
          <h2 className="text-4xl font-bold mb-2 text-center">Next Event</h2>
          <p className="text-2xl text-baywatch-orange text-center mb-1">{nextEvent.event.name}</p>
          <p className="text-gray-400 text-center mb-4">
            {nextEvent.event.location}
          </p>
          <div className="text-center">
            <div className="text-3xl sm:text-5xl font-bold text-baywatch-orange">
              {formatTime(timeLeft.days)}d {formatTime(timeLeft.hours)}h {formatTime(timeLeft.minutes)}m {formatTime(timeLeft.seconds)}s
            </div>
          </div>
          <p className="text-center text-gray-500 mt-4 text-sm">
            <i className="fas fa-external-link-alt mr-2"></i>Click for event details
          </p>
        </a>
      </div>
    </section>
  );
}
