import React from 'react';
import type { EventData } from '../../../hooks/useEventData';

interface EventHeroProps {
  eventData: EventData | null;
  eventCode: string;
  isLoading: boolean;
}

const EventHero: React.FC<EventHeroProps> = ({ eventData, eventCode, isLoading }) => {
  const getEventCity = () => {
    if (!eventData) return 'Loading';
    return eventData.name || eventData.city || 'Event';
  };

  const getEventDetails = () => {
    if (!eventData) return 'Loading event information...';
    
    const location = [eventData.city, eventData.state_prov, eventData.country]
      .filter(Boolean)
      .join(', ');
    
    const dates = formatEventDates(eventData.start_date, eventData.end_date);
    
    return `${location} • ${dates}`;
  };

  const formatEventDates = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const options: Intl.DateTimeFormatOptions = { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      };
      
      const startStr = start.toLocaleDateString('en-US', options);
      const endStr = end.toLocaleDateString('en-US', options);
      
      // If same day, show just one date
      if (startDate === endDate) {
        return startStr;
      }
      
      return `${startStr} - ${endStr}`;
    } catch (e) {
      return 'Date TBD';
    }
  };

  const getTwitchUrl = () => {
    // Generate Twitch URL based on event
    if (eventData?.livestream?.channel) {
      return `https://www.twitch.tv/${eventData.livestream.channel}`;
    }
    
    // Default to main FRC channel
    return 'https://www.twitch.tv/firstinspires';
  };

  const getDistrictUrl = () => {
    if (eventData?.district) {
      return `/district?district=${eventData.district.key}`;
    }
    return '#';
  };

  const getRegionalUrl = () => {
    if (eventData && eventData.event_type === 0) {
      // first four chars of key are year
      return `/regional?year=${eventData.key.slice(0, 4)}`;
    }
    return '#';
  };

  return (
    <section className="pt-32 pb-16 relative z-10">
      <div className="container mx-auto px-6">
        <h1 className="text-5xl md:text-7xl font-bold text-center">
          <span 
            className={`text-white inline-block animate__animated animate__fadeInUp ${isLoading ? 'animate-pulse' : ''}`}
            style={{ animationDelay: '0.2s', textShadow: '0 0 20px rgba(255, 107, 0, 0.3)' }}
          >
            {getEventCity()}
          </span>
          {' '}
          <span 
            className={`text-baywatch-orange inline-block animate__animated animate__fadeInUp ${isLoading ? 'animate-pulse' : ''}`}
            style={{ 
              animationDelay: '0.4s',
              textShadow: '0 0 20px rgba(255, 107, 0, 0.5)'
            }}
          >
          </span>
        </h1>
        
        <p 
          className={`text-gray-400 text-center mt-4 max-w-2xl mx-auto animate__animated animate__fadeInUp ${isLoading ? 'animate-pulse' : ''}`}
          style={{ animationDelay: '0.6s' }}
        >
          {getEventDetails()}
        </p>
        
        <div className="flex justify-center mt-6 gap-4 flex-wrap">
          <a 
            href={getTwitchUrl()}
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center text-[#A970FF] bg-[#6441A4]/20 hover:bg-[#6441A4]/30 transition-colors duration-300 px-4 py-2 rounded-lg"
          >
            <i className="fab fa-twitch mr-2"></i> Watch Live
          </a>
          
          <a 
            href={`/scouting?event=${eventCode}`}
            className="inline-flex items-center text-baywatch-orange bg-baywatch-orange/20 hover:bg-baywatch-orange/40 transition-all duration-300 px-4 py-2 rounded-lg border border-baywatch-orange/30 hover:border-baywatch-orange hover:scale-105 hover:shadow-md hover:shadow-baywatch-orange/20"
          >
            <i className="fas fa-clipboard-list mr-2"></i> 
            Team Scouting 
            <i className="fas fa-chevron-right ml-1 text-xs opacity-70"></i>
          </a>
          
          {eventData && eventData.event_type === 0 && (
            <a 
              href={getRegionalUrl()}
              className="inline-flex items-center text-gray-300 bg-gray-800/50 hover:bg-gray-800/70 transition-colors duration-300 px-4 py-2 rounded-lg"
            >
              <i className="fas fa-trophy mr-2"></i> Regional Rankings
            </a>
          )}

          {eventData?.district && (
            <a 
              href={getDistrictUrl()}
              className="inline-flex items-center text-gray-300 bg-gray-800/50 hover:bg-gray-800/70 transition-colors duration-300 px-4 py-2 rounded-lg"
            >
              <i className="fas fa-trophy mr-2"></i> District
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

export default EventHero;
