import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  MatchHero,
  MatchScoreboard,
  MatchBreakdown,
  MatchTeamDetails,
  MatchVideo,
  LoadingOverlay
} from '../sections/match';
import { useMatchData } from '../../hooks/useMatchData';

const Match: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const matchKey = searchParams.get('match');

  const { matchData, eventData, teamData, loading, error } = useMatchData(matchKey);

  if (!matchKey) {
    return (
      <div className="min-h-screen bg-black text-white pt-32">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">
            No Match Selected <span className="text-red-400"><i className="fas fa-circle-exclamation"></i></span>
          </h1>
          <p className="text-gray-400">Please select a match from the schedule</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingOverlay />;
  }

  if (error || !matchData) {
    return (
      <div className="min-h-screen bg-black text-white pt-32">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">
            Error Loading Match <span className="text-red-400"><i className="fas fa-circle-exclamation"></i></span>
          </h1>
          <p className="text-gray-400">Failed to load match details. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Back Button */}
      <div className="pt-32 pb-4 relative z-10">
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate(`/event?event=${matchData?.event_key}`)}
            className="inline-flex items-center text-baywatch-orange hover:text-white bg-baywatch-orange/10 hover:bg-baywatch-orange/30 transition-all duration-300 px-4 py-2 rounded-lg"
          >
            <i className="fas fa-arrow-left mr-2"></i> Back to Event
          </button>
        </div>
      </div>

      {/* Match Hero Section */}
      <MatchHero matchData={matchData} eventData={eventData} />

      {/* Match Scoreboard */}
      <MatchScoreboard matchData={matchData} teamData={teamData} />

      {/* Match Details Grid */}
      <section className="py-8 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Breakdown */}
            <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.3s' }}>
              <MatchBreakdown matchData={matchData} />
            </div>
            
            {/* Right Column: Teams and Video */}
            <div className="space-y-8">
              {/* Teams Section */}
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.4s' }}>
                <MatchTeamDetails matchData={matchData} teamData={teamData} />
              </div>
              
              {/* Video Section */}
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.5s' }}>
                <MatchVideo matchData={matchData} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Match;
