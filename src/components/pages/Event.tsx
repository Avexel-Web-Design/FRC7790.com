import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoadingOverlay from '../sections/event/LoadingOverlay';
import EventHero from '../sections/event/EventHero';
import EventCountdown from '../sections/event/EventCountdown';
import RegisteredTeams from '../sections/event/RegisteredTeams';
import EventTabs from '../sections/event/EventTabs';
import Rankings from '../sections/event/Rankings';
import Schedule from '../sections/event/Schedule';
import Playoffs from '../sections/event/Playoffs';
import Awards from '../sections/event/Awards';
import { useEventData } from '../../hooks/useEventData';

const Event: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('rankings');
  
  // Get event code from URL parameters
  let eventCode = searchParams.get('event');
  
  // Default event codes for direct page access without parameters
  if (!eventCode) {
    eventCode = '2025milac'; // Default fallback
  } else if (!/^\d{4}/.test(eventCode)) {
    // Add default year 2025 if no year is specified
    eventCode = `2025${eventCode}`;
  }

  // Fetch event data
  const { 
    eventData, 
    isLoading, 
    error, 
    isUpcoming, 
    rankings,
    matches,
    playoffMatches,
    awards,
    teams,
    epaData,
    refetch,
    fetchEpaData
  } = useEventData(eventCode);

  // Handle tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Update URL hash
    window.history.replaceState({}, '', `#${tabId}`);
  };

  // Set active tab from URL hash on load
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (['rankings', 'schedule', 'playoff', 'awards'].includes(hash)) {
      setActiveTab(hash);
    } else if (hash === 'playoffs') {
      setActiveTab('playoff');
    }
  }, []);

  // Show loading overlay while fetching initial data
  if (isLoading && !eventData) {
    return <LoadingOverlay />;
  }

  // Show error if data failed to load
  if (error && !eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Event</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-6 py-2 bg-baywatch-orange text-white rounded-lg hover:bg-baywatch-orange/80 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <EventHero 
        eventData={eventData}
        eventCode={eventCode}
        isLoading={isLoading}
      />

      {/* Upcoming Event Section */}
      {isUpcoming && eventData && (
        <div>
          <EventCountdown 
            eventData={eventData}
            isLoading={isLoading}
          />
          <RegisteredTeams 
            teams={teams}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Competition Data Section */}
      {!isUpcoming && (
        <div id="competition-data-container">
          <EventTabs 
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* Tab Content */}
          <div className="relative">
            {activeTab === 'rankings' && (
              <Rankings 
                rankings={rankings}
                epaData={epaData}
                isLoading={isLoading}
                onLoadEpa={fetchEpaData}
              />
            )}
            
            {activeTab === 'schedule' && (
              <Schedule 
                matches={matches}
                isLoading={isLoading}
              />
            )}
            
            {activeTab === 'playoff' && (
              <Playoffs 
                playoffMatches={playoffMatches}
                isLoading={isLoading}
              />
            )}
            
            {activeTab === 'awards' && (
              <Awards 
                awards={awards}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Event;
