import { useState, useEffect } from 'react';
import NebulaLoader from '../common/NebulaLoader';
import { useSearchParams } from 'react-router-dom';
import TeamHero from '../sections/team/Hero';
import TeamTabs from '../sections/team/Tabs';
import TeamOverview from '../sections/team/Overview';
import TeamMatches from '../sections/team/Matches';
import TeamHistory from '../sections/team/History';

export default function Team() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'overview';
  });
  const [teamNumber, setTeamNumber] = useState('7790');
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Keep URL hash in sync when tab changes
  useEffect(() => {
    if (activeTab) {
      window.location.hash = activeTab;
    }
  }, [activeTab]);

  useEffect(() => {
    // Get team number from URL parameters, default to 7790
    const teamParam = searchParams.get('team') || '7790';
    setTeamNumber(teamParam);
    
    // Update page title
    document.title = `Team ${teamParam} Overview - Baywatch Robotics | FRC Team 7790`;
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Update URL hash to persist tab selection
    window.location.hash = tab;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4"><NebulaLoader size={120} /></div>
            <h2 className="text-xl font-bold text-orange-500 mt-4">Loading Team Data</h2>
            <p className="text-gray-400 mt-2">Retrieving information from The Blue Alliance</p>
          </div>
        </div>
      )}

      <TeamHero 
        teamNumber={teamNumber} 
        teamData={teamData}
        setTeamData={setTeamData}
        setLoading={setLoading}
      />
      
      <section className="py-16 relative z-10">
        <div className="container mx-auto sm:px-6">
          <TeamTabs 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            teamNumber={teamNumber}
          />
          
          {activeTab === 'overview' && (
            <TeamOverview 
              teamNumber={teamNumber} 
              teamData={teamData}
            />
          )}
          
          {activeTab === 'matches' && (
            <TeamMatches 
              teamNumber={teamNumber} 
              teamData={teamData}
            />
          )}
          
          {activeTab === 'history' && (
            <TeamHistory 
              teamNumber={teamNumber} 
              teamData={teamData}
            />
          )}
        </div>
      </section>
    </div>
  );
}
