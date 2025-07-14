import { useState, useEffect } from 'react';
import { getTeamCardGradientClass } from '../../../utils/color';

interface TeamStatsProps {
  teamNumber: string;
  teamData: any;
  eventsData: any[];
}

export default function TeamStats({ teamNumber, teamData, eventsData }: TeamStatsProps) {
  const [stats, setStats] = useState({
    avgRanking: 'Loading...',
    winRate: 'Loading...',
    eventsCount: 'Loading...'
  });

  useEffect(() => {
    const calculateStats = async () => {
      if (!eventsData.length) {
        setStats({
          avgRanking: 'N/A',
          winRate: 'N/A',
          eventsCount: '0'
        });
        return;
      }

      try {
        let totalRank = 0;
        let totalEvents = 0;
        let totalWins = 0;
        let totalMatches = 0;

        // Calculate stats from events
        for (const event of eventsData) {
          try {
            const statusResponse = await fetch(`https://www.thebluealliance.com/api/v3/team/frc${teamNumber}/event/${event.key}/status`, {
              headers: {
                'X-TBA-Auth-Key': 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf'
              }
            });

            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              if (statusData?.qual?.ranking) {
                totalRank += statusData.qual.ranking.rank;
                totalEvents++;

                if (statusData.qual.ranking.record) {
                  totalWins += statusData.qual.ranking.record.wins;
                  totalMatches += statusData.qual.ranking.record.wins + 
                                 statusData.qual.ranking.record.losses + 
                                 statusData.qual.ranking.record.ties;
                }
              }
            }
          } catch (error) {
            console.log(`Error fetching status for event ${event.key}:`, error);
          }
        }

        setStats({
          avgRanking: totalEvents > 0 ? (totalRank / totalEvents).toFixed(1) : 'N/A',
          winRate: totalMatches > 0 ? `${((totalWins / totalMatches) * 100).toFixed(1)}%` : 'N/A',
          eventsCount: eventsData.length.toString()
        });
      } catch (error) {
        console.error('Error calculating stats:', error);
        setStats({
          avgRanking: 'Error',
          winRate: 'Error',
          eventsCount: eventsData.length.toString()
        });
      }
    };

    calculateStats();
  }, [teamNumber, eventsData]);

  return (
    <>
      {/* Card with gradient, only visible on sm and up */}
      <div className={`hidden sm:block ${getTeamCardGradientClass(teamNumber)} rounded-xl p-6 animate__animated animate__fadeIn sm:border sm:border-gray-800`} style={{animationDelay: '0.2s'}}>
        <h2 className="text-2xl font-bold mb-6 text-center">Team Stats</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-gray-700 pb-2">
            <span className="text-gray-400">Rookie Year</span>
            <span className="font-bold">{teamData?.rookie_year || 'Loading...'}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-700 pb-2">
            <span className="text-gray-400">Events ({new Date().getFullYear()})</span>
            <span className="font-bold">{stats.eventsCount}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-700 pb-2">
            <span className="text-gray-400">Avg. Ranking</span>
            <span className="font-bold">{stats.avgRanking}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-700 pb-2">
            <span className="text-gray-400">Win Rate</span>
            <span className="font-bold">{stats.winRate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Location</span>
            <span className="font-bold">
              {teamData ? `${teamData.city}, ${teamData.state_prov}` : 'Loading...'}
            </span>
          </div>
        </div>
      </div>
      {/* Card without gradient, only visible below sm */}
      <div className={`block sm:hidden rounded-xl p-6 animate__animated animate__fadeIn sm:border sm:border-gray-800`} style={{animationDelay: '0.2s'}}>
        <h2 className="text-2xl font-bold mb-6 text-center">Team Stats</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-gray-700 pb-2">
            <span className="text-gray-400">Rookie Year</span>
            <span className="font-bold">{teamData?.rookie_year || 'Loading...'}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-700 pb-2">
            <span className="text-gray-400">Events ({new Date().getFullYear()})</span>
            <span className="font-bold">{stats.eventsCount}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-700 pb-2">
            <span className="text-gray-400">Avg. Ranking</span>
            <span className="font-bold">{stats.avgRanking}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-700 pb-2">
            <span className="text-gray-400">Win Rate</span>
            <span className="font-bold">{stats.winRate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Location</span>
            <span className="font-bold">
              {teamData ? `${teamData.city}, ${teamData.state_prov}` : 'Loading...'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
