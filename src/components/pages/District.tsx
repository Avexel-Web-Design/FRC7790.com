import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoadingOverlay from '../sections/event/LoadingOverlay';
import DistrictTabs from '../sections/district/Tabs';
import DistrictRankings from '../sections/district/Rankings';
import DistrictEvents from '../sections/district/Events';
import { useDistrictData } from '../../hooks/useDistrictData';

const District: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('rankings');

  // Determine district key from URL, default to 2025fim
  let districtKey = searchParams.get('district');
  if (!districtKey) {
    districtKey = '2025fim';
  } else if (!/^\d{4}/.test(districtKey)) {
    districtKey = `2025${districtKey}`;
  }

  const formattedDistrictKey = `${districtKey.slice(0, 4)} ${districtKey.slice(4).toUpperCase()}`;

  const { rankings, events, isLoading, error, refetch } = useDistrictData(districtKey);

  // Sync tab with hash
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (['rankings', 'events'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    window.history.replaceState({}, '', `#${tabId}`);
  };

  if (isLoading && rankings.length === 0 && events.length === 0) {
    return <LoadingOverlay />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading District</h2>
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
      <section className="pt-32 pb-8 relative z-10 text-center">
      <h1 className="text-5xl md:text-7xl font-bold text-center">
          <span 
            className="text-white inline-block animate__animated animate__fadeInUp" 
            style={{ animationDelay: '0.2s' }}
          >
            {formattedDistrictKey}
          </span>
          {' '}
          <span 
            className="text-baywatch-orange glow-orange inline-block animate__animated animate__fadeInUp" 
            style={{ animationDelay: '0.4s' }}
          >
            District
          </span>
        </h1>
      </section>

      <DistrictTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {activeTab === 'rankings' && (
        <DistrictRankings rankings={rankings} isLoading={isLoading} />
      )}

      {activeTab === 'events' && (
        <DistrictEvents events={events} isLoading={isLoading} />
      )}
    </div>
  );
};

export default District;
