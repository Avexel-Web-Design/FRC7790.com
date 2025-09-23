import React from 'react';
import type { MatchData } from '../../../hooks/useMatchData';
import { useMatchSummary } from '../../../hooks/useMatchSummary';

interface MatchSummaryProps { matchData: MatchData; }

export const MatchSummary: React.FC<MatchSummaryProps> = ({ matchData }) => {
  const { summary, loading, error, regenerate, model, fallbackUsed } = useMatchSummary(matchData);

  return (
    <div className="card-gradient backdrop-blur-sm border border-white/10 rounded-xl p-5 mb-8 animate__animated animate__fadeInUp" style={{ animationDelay: '0.35s' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
            <span className="text-baywatch-orange"><i className="fas fa-robot"></i></span>
            Match Summary
          </h2>
          {loading && (
            <div className="space-y-2">
              <div className="h-4 bg-white/10 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-white/10 rounded w-4/6 animate-pulse" />
            </div>
          )}
          {!loading && error && (
            <div className="text-sm text-red-400">
              Failed to load summary: {error}
              <button onClick={regenerate} className="ml-2 underline text-baywatch-orange">Retry</button>
            </div>
          )}
          {!loading && !error && summary && (
            <p className="text-gray-200 leading-relaxed text-sm md:text-base">{summary}</p>
          )}
          {!loading && !error && !summary && (
            <p className="text-gray-400 text-sm">Summary unavailable.</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={regenerate}
            disabled={loading}
            className="px-3 py-2 text-xs rounded bg-baywatch-orange/20 hover:bg-baywatch-orange/30 text-baywatch-orange font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Regenerate summary"
          >
            <i className="fas fa-rotate"></i>
          </button>
        </div>
      </div>
      <div className="mt-4 text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-3">
        <span className="inline-flex items-center gap-1">
          <i className="fas fa-microchip"></i>
          {fallbackUsed ? 'Baseline Summary' : 'AI Summary'}
        </span>
        {model && !fallbackUsed && (
          <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400">{model}</span>
        )}
      </div>
    </div>
  );
};

export default MatchSummary;
