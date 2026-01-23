import { useMemo } from 'react';
import { getTeamCardGradientClass } from '../../../utils/color';
import useTeamRanking from '../../../hooks/useTeamRanking';
import { useTeamEventStatuses } from '../../../hooks/useTeamEventStatuses';

interface TeamStatsProps {
  teamNumber: string;
  teamData: {
    rookie_year?: number;
    city?: string;
    state_prov?: string;
  } | null;
  eventsData: Array<{ key: string }>;
}

export default function TeamStats({ teamNumber, teamData, eventsData }: TeamStatsProps) {
  const { rank: teamRank, totalTeams, year: rankingYear, loading: rankingLoading, rankingType } = useTeamRanking(teamNumber);
  const currentYear = new Date().getFullYear();

  // Extract event keys for parallel fetching
  const eventKeys = useMemo(() => eventsData.map(e => e.key), [eventsData]);
  
  // Fetch all event statuses in parallel (not sequential!)
  const { stats, isLoading: statsLoading } = useTeamEventStatuses(teamNumber, eventKeys);

  // Format stats for display
  const displayStats = useMemo(() => ({
    avgRanking: stats.avgRanking !== null ? stats.avgRanking.toFixed(1) : 'N/A',
    winRate: stats.winRate !== null ? `${stats.winRate.toFixed(1)}%` : 'N/A',
    eventsCount: eventsData.length.toString(),
  }), [stats, eventsData.length]);

  const StatsContent = () => (
    <>
      <h2 className="text-2xl font-bold mb-6 text-center">Team Stats</h2>
      <div className="space-y-4">
        {teamData?.rookie_year && (
          <div className="flex justify-between items-center border-b border-gray-700 pb-2">
            <span className="text-gray-400">Rookie Year</span>
            <span className="font-bold">{teamData.rookie_year}</span>
          </div>
        )}
        <div className="flex justify-between items-center border-b border-gray-700 pb-2">
          <span className="text-gray-400">Events ({currentYear})</span>
          <span className="font-bold">{displayStats.eventsCount}</span>
        </div>
        {!statsLoading && displayStats.avgRanking !== 'N/A' && (
          <div className="flex justify-between items-center border-b border-gray-700 pb-2">
            <span className="text-gray-400">Avg. Ranking</span>
            <span className="font-bold">{displayStats.avgRanking}</span>
          </div>
        )}
        {!statsLoading && displayStats.winRate !== 'N/A' && (
          <div className="flex justify-between items-center border-b border-gray-700 pb-2">
            <span className="text-gray-400">Win Rate</span>
            <span className="font-bold">{displayStats.winRate}</span>
          </div>
        )}
        {statsLoading && eventsData.length > 0 && (
          <div className="flex justify-between items-center border-b border-gray-700 pb-2">
            <span className="text-gray-400">Loading stats...</span>
            <span className="font-bold animate-pulse">...</span>
          </div>
        )}
        {!rankingLoading && teamRank && (
          <div className="flex justify-between items-center border-b border-gray-700 pb-2">
            <span className="text-gray-400">{rankingType === 'district' ? 'District' : rankingType === 'regional' ? 'Regional' : ''} Ranking</span>
            <span className="font-bold">
              {teamRank} / {totalTeams}
              {rankingYear && rankingYear < currentYear && (
                <span className="text-sm text-gray-400 ml-1">({rankingYear})</span>
              )}
            </span>
          </div>
        )}
        {teamData?.city && teamData?.state_prov && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Location</span>
            <span className="font-bold text-right">
              {teamData.city}, {teamData.state_prov}
            </span>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Card with gradient, only visible on sm and up */}
      <div className={`hidden sm:block ${getTeamCardGradientClass(teamNumber)} rounded-xl p-6 animate__animated animate__fadeIn sm:border sm:border-gray-800`} style={{animationDelay: '0.2s'}}>
        <StatsContent />
      </div>
      {/* Card without gradient, only visible below sm */}
      <div className={`block sm:hidden rounded-xl p-6 animate__animated animate__fadeIn sm:border sm:border-gray-800`} style={{animationDelay: '0.2s'}}>
        <StatsContent />
      </div>
    </>
  );
}
