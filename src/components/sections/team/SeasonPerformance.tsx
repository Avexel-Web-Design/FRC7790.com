import { useState, useEffect } from 'react';

interface SeasonPerformanceProps {
  teamNumber: string;
  eventsData: any[];
  loading: boolean;
}

export default function SeasonPerformance({ teamNumber, eventsData, loading }: SeasonPerformanceProps) {
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (!eventsData.length) {
        setPerformanceData([]);
        setDataLoading(false);
        return;
      }

      try {
        setDataLoading(true);
        
        // Sort events by start date
        const sortedEvents = [...eventsData].sort((a, b) => 
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );

        const performancePromises = sortedEvents.map(async (event) => {
          const eventData = {
            ...event,
            ranking: 'Not Available',
            record: 'N/A',
            awards: 'None',
            status: 'completed'
          };

          try {
            // Get team status at this event
            const statusResponse = await fetch(`https://www.thebluealliance.com/api/v3/team/frc${teamNumber}/event/${event.key}/status`, {
              headers: {
                'X-TBA-Auth-Key': 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf'
              }
            });

            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              if (statusData?.qual?.ranking) {
                eventData.ranking = `${statusData.qual.ranking.rank} of ${statusData.qual.num_teams}`;
                
                if (statusData.qual.ranking.record) {
                  const record = statusData.qual.ranking.record;
                  eventData.record = `${record.wins}-${record.losses}-${record.ties}`;
                }
              }
            }

            // Get awards
            const awardsResponse = await fetch(`https://www.thebluealliance.com/api/v3/team/frc${teamNumber}/event/${event.key}/awards`, {
              headers: {
                'X-TBA-Auth-Key': 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf'
              }
            });

            if (awardsResponse.ok) {
              const awardsData = await awardsResponse.json();
              if (awardsData.length > 0) {
                eventData.awards = awardsData.map((award: any) => award.name).join(', ');
              }
            }

            // Determine event status
            const now = new Date();
            const eventStart = new Date(event.start_date);
            const eventEnd = new Date(event.end_date);
            eventEnd.setHours(23, 59, 59);

            if (now < eventStart) {
              eventData.status = 'upcoming';
            } else if (now >= eventStart && now <= eventEnd) {
              eventData.status = 'current';
            } else {
              eventData.status = 'completed';
            }

          } catch (error) {
            console.log(`Error fetching details for event ${event.key}:`, error);
          }

          return eventData;
        });

        const results = await Promise.all(performancePromises);
        setPerformanceData(results);
      } catch (error) {
        console.error('Error fetching performance data:', error);
        setPerformanceData([]);
      } finally {
        setDataLoading(false);
      }
    };

    fetchPerformanceData();
  }, [teamNumber, eventsData]);

  const formatEventDate = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      return `${startStr} - ${endStr}`;
    } catch (error) {
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

  if (loading || dataLoading) {
    return (
      <div className="card-gradient rounded-xl p-6 animate__animated animate__fadeIn border border-gray-800" style={{animationDelay: '0.5s'}}>
        <h3 className="text-2xl font-bold mb-6 text-center">{new Date().getFullYear()} Season Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="text-left">
                <th className="p-4 text-orange-500">Event</th>
                <th className="p-4 text-orange-500">Date</th>
                <th className="p-4 text-orange-500">Ranking</th>
                <th className="p-4 text-orange-500">Record</th>
                <th className="p-4 text-orange-500">Awards</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr>
                <td colSpan={5} className="p-4 text-center">Loading season data...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="card-gradient rounded-xl p-6 animate__animated animate__fadeIn border border-gray-800" style={{animationDelay: '0.5s'}}>
      <h3 className="text-2xl font-bold mb-6 text-center">{new Date().getFullYear()} Season Performance</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="text-left">
              <th className="p-4 text-orange-500">Event</th>
              <th className="p-4 text-orange-500">Date</th>
              <th className="p-4 text-orange-500">Ranking</th>
              <th className="p-4 text-orange-500">Record</th>
              <th className="p-4 text-orange-500">Awards</th>
            </tr>
          </thead>
          <tbody className="text-gray-300">
            {performanceData.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center">
                  No events scheduled for {new Date().getFullYear()} yet.
                </td>
              </tr>
            ) : (
              performanceData.map((event ) => (
                <tr 
                  key={event.key} 
                  className={`hover:bg-black/30 transition-colors ${
                    event.status === 'current' ? 'bg-orange-500/10' : ''
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center">
                      <a
                        href={`/event?event=${event.key}`}
                        className="hover:text-orange-500 transition-colors font-medium"
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
      </div>
    </div>
  );
}
