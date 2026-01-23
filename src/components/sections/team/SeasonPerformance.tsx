import { getTeamCardGradientClass, getTeamAccentStyle, getTeamColor } from '../../../utils/color';
import { useSeasonPerformance } from '../../../hooks/useSeasonPerformance';

interface SeasonPerformanceProps {
  teamNumber: string;
  eventsData: Array<{
    key: string;
    name: string;
    start_date: string;
    end_date: string;
  }>;
  loading: boolean;
}

export default function SeasonPerformance({ teamNumber, eventsData, loading }: SeasonPerformanceProps) {
  const { performanceData, isLoading: dataLoading } = useSeasonPerformance(teamNumber, eventsData);

  const formatEventDate = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      return `${startStr} - ${endStr}`;
    } catch {
      return 'Date TBD';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'current':
        return <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">Current</span>;
      case 'upcoming':
        return <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">Upcoming</span>;
      default:
        return null;
    }
  };

  const TableContent = ({ showLoading }: { showLoading: boolean }) => (
    <table className="min-w-full table-auto">
      <thead>
        <tr className="text-left">
          <th className="p-4 font-bold" style={getTeamAccentStyle(teamNumber)}>Event</th>
          <th className="p-4 font-bold" style={getTeamAccentStyle(teamNumber)}>Date</th>
          <th className="p-4 font-bold" style={getTeamAccentStyle(teamNumber)}>Ranking</th>
          <th className="p-4 font-bold" style={getTeamAccentStyle(teamNumber)}>Record</th>
          <th className="p-4 font-bold" style={getTeamAccentStyle(teamNumber)}>Awards</th>
        </tr>
      </thead>
      <tbody className="text-gray-300">
        {showLoading ? (
          <tr>
            <td colSpan={5} className="p-4 text-center">Loading season data...</td>
          </tr>
        ) : performanceData.length === 0 ? (
          <tr>
            <td colSpan={5} className="p-4 text-center">
              No events scheduled for {new Date().getFullYear()} yet.
            </td>
          </tr>
        ) : (
          performanceData.map((event) => (
            <tr 
              key={event.key} 
              className="hover:bg-black/30 transition-colors"
              style={event.status === 'current' ? {
                backgroundColor: `${getTeamColor(teamNumber) || '#f97316'}10`
              } : undefined}
            >
              <td className="p-4">
                <div className="flex items-center">
                  <a
                    href={`/event?event=${event.key}`}
                    className="transition-colors font-medium"
                    style={{ color: 'white' }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLAnchorElement).style.color = getTeamAccentStyle(teamNumber).color || '#f97316';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLAnchorElement).style.color = 'white';
                    }}
                  >
                    {event.name}
                  </a>
                  {getStatusBadge(event.status)}
                </div>
              </td>
              <td className="p-4">
                {formatEventDate(event.start_date, event.end_date)}
              </td>
              <td className="p-4">{event.ranking}</td>
              <td className="p-4">{event.record}</td>
              <td className="p-4">
                <div className="max-w-xs">
                  {event.awards === 'None' ? (
                    <span className="text-gray-500">None</span>
                  ) : (
                    <span className="text-yellow-400">{event.awards}</span>
                  )}
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  const isShowingLoading = loading || dataLoading;

  return (
    <>
      {/* Card with gradient, only visible on sm and up */}
      <div className={`hidden sm:block ${getTeamCardGradientClass(teamNumber)} rounded-xl p-6 animate__animated animate__fadeIn sm:border sm:border-gray-800`} style={{animationDelay: '0.5s'}}>
        <h3 className="text-2xl font-bold mb-6 text-center">{new Date().getFullYear()} Season Performance</h3>
        <div className="overflow-x-auto">
          <TableContent showLoading={isShowingLoading} />
        </div>
      </div>
      {/* Card without gradient, only visible below sm */}
      <div className={`block sm:hidden rounded-xl p-6 animate__animated animate__fadeIn sm:border sm:border-gray-800`} style={{animationDelay: '0.5s'}}>
        <h3 className="text-2xl font-bold mb-6 text-center">{new Date().getFullYear()} Season Performance</h3>
        <div className="overflow-x-auto">
          <TableContent showLoading={isShowingLoading} />
        </div>
      </div>
    </>
  );
}
