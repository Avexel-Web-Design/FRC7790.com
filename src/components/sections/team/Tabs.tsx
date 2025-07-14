import { getTeamAccentStyle } from '../../../utils/color';

interface TeamTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  teamNumber: string;
}

export default function TeamTabs({ activeTab, onTabChange, teamNumber }: TeamTabsProps) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-info-circle' },
    { id: 'matches', label: 'Matches', icon: 'fas fa-calendar-days' },
    { id: 'history', label: 'History', icon: 'fas fa-history' }
  ];

  return (
    <div className="container mx-auto px-6 mb-2">
      <div className="border-b border-gray-700 grid grid-cols-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center justify-center py-3 px-3 sm:px-6 font-medium focus:outline-none focus-visible:outline-none active:outline-none focus:ring-0 focus:ring-transparent focus-visible:ring-0 transition-all duration-300 relative ${
              activeTab === tab.id
                ? 'border-b-2' 
                : 'text-gray-400 hover:text-white border-b-2 border-transparent hover:border-gray-600'
            }`}
            style={activeTab === tab.id ? {
              ...getTeamAccentStyle(teamNumber),
              borderBottomColor: getTeamAccentStyle(teamNumber).color || '#ff6b00'
            } : {}}
          >
            <i className={`${tab.icon} mr-0 sm:mr-2`}></i>
            <span className="tab-text hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
