import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoadingOverlay from '../sections/event/LoadingOverlay';
import EventHero from '../sections/event/Hero';
import EventCountdown from '../sections/event/Countdown';
import RegisteredTeams from '../sections/event/RegisteredTeams';
import EventTabs from '../sections/event/Tabs';
import Rankings from '../sections/event/Rankings';
import Schedule from '../sections/event/Schedule';
import Playoffs from '../sections/event/Playoffs';
import Awards from '../sections/event/Awards';
import { useEventData } from '../../hooks/useEventData';

const Event: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('rankings');
  const [isChampionshipEvent, setIsChampionshipEvent] = useState(false);
  
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
    refetch
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

  // Detect championship events with divisions
  useEffect(() => {
    const detectChampionshipEvent = async () => {
      if (!eventData) return;
      
      try {
        const response = await fetch(`https://www.thebluealliance.com/api/v3/event/${eventCode}`, {
          headers: { "X-TBA-Auth-Key": "gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf" }
        });
        
        if (response.ok) {
          const fullEventData = await response.json();
          const hasDivisions = fullEventData.division_keys && fullEventData.division_keys.length > 0;
          setIsChampionshipEvent(hasDivisions);
          
          // If this is a championship event and current tab is rankings/schedule, switch to playoffs
          if (hasDivisions && (activeTab === 'rankings' || activeTab === 'schedule')) {
            setActiveTab('playoff');
          }
        }
      } catch (error) {
        console.warn('Failed to detect championship event:', error);
      }
    };

    detectChampionshipEvent();
  }, [eventData, eventCode, activeTab]);

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
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Hero Section */}
      <EventHero 
        eventData={eventData}
        eventCode={eventCode}
        isLoading={isLoading}
      />

      {/* Content Area - grows to fill available space */}
      <div className="flex-1 bg-black">
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
              isChampionshipEvent={isChampionshipEvent}
            />

            {/* Tab Content */}
            <div className="relative">
              {activeTab === 'rankings' && (
                <Rankings 
                  rankings={rankings}
                  epaData={epaData}
                  isLoading={isLoading}
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
    </div>
  );
};

export default Event;
