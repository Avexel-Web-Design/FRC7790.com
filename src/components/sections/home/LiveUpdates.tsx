import { useState, useEffect } from 'react';

interface CompetitionData {
  ranking: number;
  totalTeams: number;
  wins: number;
  losses: number;
  nextMatch: string;
  matchTime: string;
  blueAlliance: string;
  redAlliance: string;
}

export default function LiveUpdates() {
  const [competitionData, setCompetitionData] = useState<CompetitionData>({
    ranking: 0,
    totalTeams: 0,
    wins: 0,
    losses: 0,
    nextMatch: 'Loading...',
    matchTime: '--:-- --',
    blueAlliance: 'Loading...',
    redAlliance: 'Loading...'
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // This would be replaced with actual API calls to The Blue Alliance
    // For now, we'll simulate loading data
    const fetchCompetitionData = async () => {
      // Simulate API call
      setTimeout(() => {
        setCompetitionData({
          ranking: 8,
          totalTeams: 32,
          wins: 6,
          losses: 2,
          nextMatch: 'Q15',
          matchTime: '2:30 PM',
          blueAlliance: 'Teams 7790, 1234, 5678',
          redAlliance: 'Teams 9876, 5432, 1111'
        });
        setIsVisible(true);
      }, 1000);
    };

    fetchCompetitionData();
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <section id="live-updates" className="py-12 sm:py-20 gradient-section scroll-mt-24">
      <div className="container mx-auto px-3 sm:px-6">
        <h2 className="text-4xl font-bold mb-4 text-center">Competition Updates</h2>
        <p className="text-gray-400 text-center mb-12">
          Live updates from The Blue Alliance API
        </p>
        
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
                  {competitionData.ranking}
                </span>
                <span className="text-2xl text-gray-400">th</span>
              </div>
              <span className="text-gray-400 block mt-2">
                out of {competitionData.totalTeams} teams
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
              <span className="text-3xl font-bold text-baywatch-orange">
                {competitionData.nextMatch}
              </span>
              <div className="text-gray-400 mt-2">{competitionData.matchTime}</div>
              <div className="mt-4 flex justify-center gap-4">
                <div className="text-sm px-3 py-1 bg-blue-500/20 rounded-full text-blue-400">
                  {competitionData.blueAlliance}
                </div>
                <div className="text-sm px-3 py-1 bg-red-500/20 rounded-full text-red-400">
                  {competitionData.redAlliance}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-8 text-sm text-gray-500">
          Data provided by The Blue Alliance | Updates automatically
        </div>
      </div>
    </section>
  );
}
