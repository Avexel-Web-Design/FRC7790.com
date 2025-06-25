import React from 'react';

interface DistrictTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const DistrictTabs: React.FC<DistrictTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'rankings', label: 'Rankings', icon: 'fas fa-trophy' },
    { id: 'events', label: 'Events', icon: 'fas fa-calendar-days' }
  ];

  return (
    <div className="container mx-auto px-6 mb-2 mt-16">
      <div className="border-b border-gray-700 grid grid-cols-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center justify-center py-3 px-3 sm:px-6 font-medium transition-all duration-300 relative
              ${activeTab === tab.id ? 'text-baywatch-orange border-b-2 border-baywatch-orange' : 'text-gray-400 hover:text-white border-b-2 border-transparent hover:border-gray-600'}`}
          >
            <i className={`${tab.icon} mr-0 sm:mr-2`}></i>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="absolute inset-0 rounded-lg bg-baywatch-orange/20 opacity-0 transform scale-75 transition-all duration-300 pointer-events-none"></span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DistrictTabs;
