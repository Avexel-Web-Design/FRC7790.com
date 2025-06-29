import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import RegionalTabs from '../sections/regional/Tabs';
import RegionalRankings from '../sections/regional/Rankings';
import RegionalEvents from '../sections/regional/Events';
import { useRegionalData } from '../../hooks/useRegionalData';

const Regional: React.FC = () => {
  const [params] = useSearchParams();
  const yearParam = params.get('year');
  const year = useMemo(() => {
    const current = new Date().getFullYear().toString();
    const y = yearParam || current;
    return /^\d{4}$/.test(y) ? y : current;
  }, [yearParam]);

  const { rankings, events, isLoading, error, refetch } = useRegionalData(year);
  const showRankings = parseInt(year, 10) >= 2025;
  const [activeTab, setActiveTab] = React.useState<'rankings' | 'events'>(showRankings ? 'rankings' : 'events');

  return (
    <div className="min-h-screen bg-black text-white">
      <section className="pt-32 pb-8 relative z-10 text-center">
        <h1 className="text-5xl md:text-7xl font-bold">
          <span className="text-white inline-block animate__animated animate__fadeInUp" style={{ animationDelay: '0.2s' }}>
            {year}
          </span>
          {' '}
          <span className="text-baywatch-orange glow-orange inline-block animate__animated animate__fadeInUp" style={{ animationDelay: '0.4s' }}>
            Regional Pool
          </span>
        </h1>
        {error && (
          <p className="mt-4 text-red-400 text-sm">{error} <button className="underline" onClick={refetch}>retry</button></p>
        )}
      </section>

      {showRankings && (
        <RegionalTabs activeTab={activeTab} onTabChange={(tab)=>setActiveTab(tab as any)} />
      )}

      {showRankings && activeTab === 'rankings' && (
        <RegionalRankings rankings={rankings} isLoading={isLoading} />
      )}

      {(!showRankings || activeTab === 'events') && (
        <RegionalEvents events={events} isLoading={isLoading} />
      )}
    </div>
  );
};

export default Regional;
