import React from 'react';
import type { RegionalEvent } from '../../../hooks/useRegionalData';
import { formatEventDate } from '../../../utils/frcAPI';

interface RegionalEventsProps {
  events: RegionalEvent[];
  isLoading: boolean;
}

const RegionalEvents: React.FC<RegionalEventsProps> = ({ events, isLoading }) => {
  const handleEventClick = (eventKey: string) => {
    window.location.href = `/event?event=${eventKey}`;
  };

  return (
    <section className="py-8 relative z-10">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl font-bold mb-4">Regional Events</h2>
        {isLoading ? (
          <div className="text-center text-gray-400">
            <i className="fas fa-spinner fa-spin mr-2"></i>Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center text-gray-400">No events found for this season</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...events].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).map(ev => (
              <div key={ev.key} className="bg-gray-900/40 rounded-lg p-6 hover:bg-gray-800/60 transition cursor-pointer" onClick={() => handleEventClick(ev.key)}>
                <h3 className="text-lg font-semibold text-baywatch-orange mb-1">{ev.name}</h3>
                <p className="text-gray-400 text-sm mb-1">{formatEventDate(ev.start_date, ev.end_date)}</p>
                {ev.city && (
                  <p className="text-gray-500 text-xs">{[ev.city, ev.state_prov, ev.country].filter(Boolean).join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RegionalEvents;
