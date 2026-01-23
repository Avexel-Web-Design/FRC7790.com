import { getTeamCardGradientClass, getTeamAccentStyle } from '../../../utils/color';
import { useTeamHistory } from '../../../hooks/useTeamHistory';

interface TeamHistoryProps {
  teamNumber: string;
  teamData: {
    rookie_year?: number;
    motto?: string;
  } | null;
}

export default function TeamHistory({ teamNumber, teamData }: TeamHistoryProps) {
  const { years, isLoading, isLoadingAwards, progress } = useTeamHistory(teamNumber);

  const formatEventDate = (startDate: string) => {
    try {
      const date = new Date(startDate);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'Date TBD';
    }
  };

  const renderAwards = (awards: { name: string }[]) => {
    if (!awards.length) return null;
    
    return (
      <div className="mt-2">
        <span className="text-sm" style={getTeamAccentStyle(teamNumber)}>Awards: </span>
        <span className="text-sm text-yellow-400">
          {awards.map(award => award.name).join(', ')}
        </span>
      </div>
    );
  };

  // Loading skeleton for a year
  const YearSkeleton = ({ year }: { year?: number }) => (
    <div className="mb-6 animate-pulse">
      <h3 className="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">
        {year ? `${year} Season` : <span className="bg-gray-700 rounded w-32 h-5 inline-block" />}
      </h3>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-black/30 p-3 rounded">
            <div className="flex justify-between items-center">
              <span className="bg-gray-700 rounded w-48 h-4 inline-block" />
              <span className="bg-gray-700 rounded w-16 h-4 inline-block" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Initial loading state
  if (isLoading) {
    return (
      <section className="py-8 relative z-10">
        <h2 className="text-3xl font-bold mb-8 text-center">Team History</h2>
        <div className={`${getTeamCardGradientClass(teamNumber)} rounded-xl p-6 animate__animated animate__fadeIn border border-gray-800`}>
          <YearSkeleton />
          <YearSkeleton />
          <YearSkeleton />
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 relative z-10">
      <h2 className="text-3xl font-bold mb-8 text-center">Team History</h2>
      <div className={`${getTeamCardGradientClass(teamNumber)} rounded-xl p-6 animate__animated animate__fadeIn border border-gray-800`}>
        {/* Progress indicator when loading awards */}
        {isLoadingAwards && progress.totalEvents > 0 && (
          <div className="mb-4 p-3 bg-black/30 rounded">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>Loading event details...</span>
              <span>{progress.loadedEvents} / {progress.totalEvents}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(progress.loadedEvents / progress.totalEvents) * 100}%`,
                  backgroundColor: getTeamAccentStyle(teamNumber).color || '#f97316'
                }}
              />
            </div>
          </div>
        )}

        <div className="space-y-6">
          {years.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-400">No historical data available</p>
            </div>
          ) : (
            years.map((yearData) => (
              <div key={yearData.year} className="mb-6">
                <h3 className="text-lg font-semibold mb-3 border-b border-gray-700 pb-2 flex items-center justify-between">
                  <span>{yearData.year} Season</span>
                  {yearData.loading && (
                    <span className="text-xs text-gray-500 animate-pulse">Loading awards...</span>
                  )}
                </h3>
                <div className="space-y-3">
                  {yearData.events.map((event) => (
                    <div 
                      key={event.key} 
                      className={`bg-black/30 p-3 rounded hover:bg-black/50 transition-colors ${
                        !event.awardsLoaded ? 'animate-pulse' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white">
                          <a
                            href={`/event?event=${event.key}`}
                            className="transition-colors"
                            style={{
                              color: 'white',
                            }}
                            onMouseEnter={(e) => {
                              (e.target as HTMLAnchorElement).style.color = getTeamAccentStyle(teamNumber).color || '#f97316';
                            }}
                            onMouseLeave={(e) => {
                              (e.target as HTMLAnchorElement).style.color = 'white';
                            }}
                          >
                            {event.name}
                          </a>
                        </span>
                        <span className="text-sm text-gray-400">
                          {formatEventDate(event.start_date)}
                        </span>
                      </div>
                      {event.awardsLoaded && renderAwards(event.awards)}
                      {!event.awardsLoaded && (
                        <div className="mt-2">
                          <span className="bg-gray-700 rounded w-32 h-3 inline-block" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
          
          {/* Team summary at bottom */}
          {teamData && (
            <div className="mt-8 pt-6 border-t border-gray-700">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">Team Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-black/30 p-3 rounded">
                    <div className="font-medium" style={getTeamAccentStyle(teamNumber)}>Rookie Year</div>
                    <div className="text-white">{teamData.rookie_year}</div>
                  </div>
                  <div className="bg-black/30 p-3 rounded">
                    <div className="font-medium" style={getTeamAccentStyle(teamNumber)}>Years Active</div>
                    <div className="text-white">
                      {teamData.rookie_year ? new Date().getFullYear() - teamData.rookie_year + 1 : '-'} years
                    </div>
                  </div>
                  <div className="bg-black/30 p-3 rounded">
                    <div className="font-medium" style={getTeamAccentStyle(teamNumber)}>Total Seasons</div>
                    <div className="text-white">{years.length + 1}</div>
                  </div>
                </div>
                
                {teamData.motto && (
                  <div className="mt-4 p-3 bg-black/30 rounded">
                    <div className="font-medium mb-2" style={getTeamAccentStyle(teamNumber)}>Team Motto</div>
                    <div className="text-gray-300 italic">"{teamData.motto}"</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
