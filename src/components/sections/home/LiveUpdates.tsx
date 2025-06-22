import { useState, useEffect } from 'react';
import { frcAPI, type CompetitionData, formatRankSuffix } from '../../../utils/frcAPI';

export default function LiveUpdates() {
  const [competitionData, setCompetitionData] = useState<CompetitionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await frcAPI.getCompetitionData();
        setCompetitionData(data);
      } catch (err) {
        console.error('Error fetching competition data:', err);
        setError('Failed to load competition data');
        // Fallback to placeholder data
        setCompetitionData({
          ranking: 0,
          totalTeams: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          nextMatch: null,
          eventName: "No active event"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up automatic refresh every 30 seconds during active events
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Don't render if no competition data or no active event
  if (isLoading || !competitionData || competitionData.totalTeams === 0) {
    return null;
  }

  const hasNextMatch = competitionData.nextMatch !== null;

  return (
    <section id="live-updates" className="py-12 sm:py-20 gradient-section scroll-mt-24">
      <div className="container mx-auto px-3 sm:px-6">
        <h2 className="text-4xl font-bold mb-4 text-center">Competition Updates</h2>
        <p className="text-gray-400 text-center mb-2">
          Live updates from The Blue Alliance API
        </p>
        <p className="text-baywatch-orange text-center mb-12 font-semibold">
          {competitionData.eventName}
        </p>
        
        {error && (
          <div className="text-center mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Current Ranking */}
          <div className="p-6 card-gradient rounded-xl transition-all duration-300 hover:scale-105">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-baywatch-orange/20 to-baywatch-orange/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-trophy text-2xl text-baywatch-orange"></i>
              </div>
            </div>
            <h3 className="text-xl font-bold text-center mb-4">Current Ranking</h3>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-5xl font-bold text-baywatch-orange counter">
                  {competitionData.ranking || '--'}
                </span>
                <span className="text-2xl text-gray-400">
                  {competitionData.ranking ? formatRankSuffix(competitionData.ranking) : ''}
                </span>
              </div>
              <span className="text-gray-400 block mt-2">
                {competitionData.totalTeams > 0 ? `out of ${competitionData.totalTeams} teams` : 'Loading...'}
              </span>
            </div>
          </div>

          {/* Win/Loss Record */}
          <div className="p-6 card-gradient rounded-xl transition-all duration-300 hover:scale-105">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-baywatch-orange/20 to-baywatch-orange/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-chart-line text-2xl text-baywatch-orange"></i>
              </div>
            </div>
            <h3 className="text-xl font-bold text-center mb-4">Event Record</h3>
            <div className="flex justify-center items-center gap-4">
              <div className="text-center">
                <span className="text-4xl font-bold text-green-500 counter">
                  {competitionData.wins}
                </span>
                <span className="text-gray-400 block">Wins</span>
              </div>
              <span className="text-2xl text-gray-400">-</span>
              <div className="text-center">
                <span className="text-4xl font-bold text-red-500 counter">
                  {competitionData.losses}
                </span>
                <span className="text-gray-400 block">Losses</span>
              </div>
              {competitionData.ties > 0 && (
                <>
                  <span className="text-2xl text-gray-400">-</span>
                  <div className="text-center">
                    <span className="text-4xl font-bold text-yellow-500 counter">
                      {competitionData.ties}
                    </span>
                    <span className="text-gray-400 block">Ties</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Next Match */}
          <div className="p-6 card-gradient rounded-xl transition-all duration-300 hover:scale-105">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-baywatch-orange/20 to-baywatch-orange/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-2xl text-baywatch-orange"></i>
              </div>
            </div>
            <h3 className="text-xl font-bold text-center mb-4">Next Match</h3>
            <div className="text-center">
              {hasNextMatch && competitionData.nextMatch ? (
                <>
                  <span className="text-3xl font-bold text-baywatch-orange">
                    {frcAPI.formatMatchName(competitionData.nextMatch)}
                  </span>
                  <div className="text-gray-400 mt-2">
                    {frcAPI.formatMatchTime(competitionData.nextMatch)}
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="text-sm px-3 py-1 bg-blue-500/20 rounded-full text-blue-400">
                      Blue: {frcAPI.getAllianceTeams(competitionData.nextMatch, 'blue')}
                    </div>
                    <div className="text-sm px-3 py-1 bg-red-500/20 rounded-full text-red-400">
                      Red: {frcAPI.getAllianceTeams(competitionData.nextMatch, 'red')}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-3xl font-bold text-gray-500">
                    No matches
                  </span>
                  <div className="text-gray-400 mt-2">Event complete or TBD</div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-center mt-8 text-sm text-gray-500">
          Data provided by The Blue Alliance | Updates every 30 seconds
        </div>
      </div>
    </section>
  );
}
