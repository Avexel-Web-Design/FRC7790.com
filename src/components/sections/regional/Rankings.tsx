import React from 'react';
import type { RegionalRanking } from '../../../hooks/useRegionalData';

interface RegionalRankingsProps {
  rankings: RegionalRanking[];
  isLoading: boolean;
}

const getEventPoints = (r: RegionalRanking, idx: number): string => {
  const events = r.event_points || [];
  return events[idx] ? events[idx].total.toFixed(2) : '—';
};

const RegionalRankings: React.FC<RegionalRankingsProps> = ({ rankings, isLoading }) => {
  return (
    <section className="py-8 relative z-10">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl font-bold mb-4">Regional Rankings</h2>
        <div className="overflow-x-auto bg-gray-900/40 rounded-lg shadow-inner">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-800/60 text-baywatch-orange text-left">
                <th className="p-4">Rank</th>
                <th className="p-4">Team</th>
                <th className="p-4">Event 1</th>
                <th className="p-4">Event 2</th>
                <th className="p-4">Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center">
                    <i className="fas fa-spinner fa-spin mr-2"></i>Loading rankings...
                  </td>
                </tr>
              ) : rankings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-400">No rankings available</td>
                </tr>
              ) : (
                rankings.map(r => (
                  <tr key={r.team_key} className="hover:bg-gray-800/50 transition-all">
                    <td className="p-4 font-semibold">{r.rank}</td>
                    <td className="p-4 text-baywatch-orange cursor-pointer" onClick={() => window.location.href = `/team?team=${r.team_key.replace('frc','')}`}>{r.team_key.replace('frc','')}</td>
                    <td className="p-4">{getEventPoints(r, 0)}</td>
                    <td className="p-4">{getEventPoints(r, 1)}</td>
                    <td className="p-4 font-semibold">{r.point_total?.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default RegionalRankings;
