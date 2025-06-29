import React from 'react';
import type { MatchData, EventData } from '../../../hooks/useMatchData';

interface MatchHeroProps {
  matchData: MatchData;
  eventData: EventData | null;
}

const MatchHero: React.FC<MatchHeroProps> = ({ matchData, eventData }) => {
  const formatMatchTitle = (match: MatchData): string => {
    const matchTypeMap = {
      'qm': 'Qualification',
      'sf': 'Semifinal',
      'f': 'Final'
    };
    
    const matchType = matchTypeMap[match.comp_level as keyof typeof matchTypeMap] || 'Match';
    const matchNumber = match.match_number;
    
    // Format title differently based on match type
    if (match.comp_level === 'qm') {
      return `${matchType} ${matchNumber}`;
    } else if (match.comp_level === 'sf') {
      return `${matchType} ${match.set_number} Match ${matchNumber}`;
    } else if (match.comp_level === 'f') {
      // Check if this is a finals match beyond #3 (overtime)
      if (matchNumber <= 3) {
        return `${matchType} ${matchNumber}`;
      } else {
        // This is an overtime match (Finals 4 becomes Overtime 1, etc.)
        const overtimeNumber = matchNumber - 3;
        return `Overtime ${overtimeNumber}`;
      }
    } else {
      const matchSet = match.set_number > 1 ? ` (Set ${match.set_number})` : '';
      return `${matchType} ${matchNumber}${matchSet}`;
    }
  };

  const formatEventInfo = (event: EventData | null, match: MatchData): string => {
    if (!event) return 'Loading event information...';
    
    let eventInfo = `${event.name} | ${event.year}`;
    if (match.comp_level !== 'qm') {
      eventInfo += ' | Playoffs';
    }
    return eventInfo;
  };

  return (
    <section className="pb-8 relative z-10">
      <div className="container mx-auto px-6">
        <div className="animate__animated animate__fadeIn">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-2">
            <span className="text-baywatch-orange">{formatMatchTitle(matchData)}</span>
          </h1>
          <div className="text-gray-400 text-center mb-6">
            {formatEventInfo(eventData, matchData)}
            {matchData.comp_level !== 'qm' && (
              <span className="bg-baywatch-orange/30 text-baywatch-orange px-2 py-0.5 rounded text-sm ml-2">
                Playoffs
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MatchHero;
