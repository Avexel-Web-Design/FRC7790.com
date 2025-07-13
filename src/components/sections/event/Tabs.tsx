import React from 'react';

interface EventTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isChampionshipEvent?: boolean;
}

interface TabConfig {
  id: string;
  label: string;
  icon: string;
  tooltip: string;
}

const EventTabs: React.FC<EventTabsProps> = ({ activeTab, onTabChange, isChampionshipEvent = false }) => {
  const allTabs: TabConfig[] = [
    {
      id: 'rankings',
      label: 'Rankings',
      icon: 'fas fa-trophy',
      tooltip: 'Team Rankings'
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: 'fas fa-calendar-days',
      tooltip: 'Match Schedule'
    },
    {
      id: 'playoff',
      label: 'Playoffs',
      icon: 'fas fa-medal',
      tooltip: 'Playoff Bracket'
    },
    {
      id: 'awards',
      label: 'Awards',
      icon: 'fas fa-award',
      tooltip: 'Event Awards'
    }
  ];

  // Filter tabs based on event type
  const tabs = isChampionshipEvent 
    ? allTabs.filter(tab => tab.id !== 'rankings' && tab.id !== 'schedule')
    : allTabs;

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
  };

  return (
    <div className="container mx-auto px-6 mb-2 mt-16">
      <div className={`border-b border-gray-700 grid ${tabs.length === 2 ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`
              w-full flex items-center justify-center py-3 px-3 sm:px-6 font-medium focus:outline-none focus-visible:outline-none active:outline-none focus:ring-0 focus:ring-transparent focus-visible:ring-0 transition-all duration-300 relative
              ${activeTab === tab.id 
                ? 'text-baywatch-orange border-b-2 border-baywatch-orange' 
                : 'text-gray-400 hover:text-white border-b-2 border-transparent hover:border-gray-600'
              }
            `}
            title={tab.tooltip}
          >
            <i className={`${tab.icon} mr-0 sm:mr-2`}></i>
            <span className="hidden sm:inline">{tab.label}</span>
            
            {/* Ripple effect */}
            <span className="absolute inset-0 rounded-lg bg-baywatch-orange/20 opacity-0 transform scale-75 transition-all duration-300 pointer-events-none"></span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EventTabs;
