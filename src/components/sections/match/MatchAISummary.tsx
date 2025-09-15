import React, { useState, useEffect, useCallback } from 'react';
import { generateMatchSummary } from '../../../utils/aiSummary';
import type { MatchData, EventData, TeamData } from '../../../hooks/useMatchData';

interface MatchAISummaryProps {
  matchData: MatchData;
  eventData: EventData;
  teamData: TeamData[];
}

const MatchAISummary: React.FC<MatchAISummaryProps> = ({ matchData, eventData, teamData }) => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateMatchSummary(matchData, eventData, teamData);
      setSummary(result);
    } catch (err) {
      setError('Failed to generate AI summary');
      console.error('Error loading match summary:', err);
    } finally {
      setLoading(false);
    }
  }, [matchData, eventData, teamData]);

  useEffect(() => {
    if (matchData && eventData && teamData.length > 0) {
      loadSummary();
    }
  }, [matchData, eventData, teamData, loadSummary]);

  const retryLoad = () => {
    setError(null);
    loadSummary();
  };

  if (!expanded && !loading && !error) {
    return (
      <div className="bg-gradient-to-br from-baywatch-orange/10 to-baywatch-orange/5 border border-baywatch-orange/20 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-baywatch-orange/20 rounded-lg flex items-center justify-center">
              <i className="fas fa-robot text-baywatch-orange text-sm"></i>
            </div>
            <div>
              <h3 className="text-white font-semibold">AI Match Summary</h3>
              <p className="text-gray-400 text-sm">Get an AI-powered analysis of this match</p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(true)}
            className="px-4 py-2 bg-baywatch-orange/20 hover:bg-baywatch-orange/30 border border-baywatch-orange/40 text-baywatch-orange rounded-lg transition-all duration-200 text-sm font-medium"
          >
            Generate Summary
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-baywatch-orange/10 to-baywatch-orange/5 border border-baywatch-orange/20 rounded-lg p-6 mb-6 animate__animated animate__fadeIn">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-baywatch-orange/20 rounded-lg flex items-center justify-center">
          <i className="fas fa-robot text-baywatch-orange"></i>
        </div>
        <h3 className="text-xl font-bold text-white">AI Match Summary</h3>
        {!loading && !error && (
          <button
            onClick={() => setExpanded(false)}
            className="ml-auto text-gray-400 hover:text-white transition-colors"
            title="Collapse"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-baywatch-orange"></div>
            <span className="text-gray-300">Generating AI summary...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="text-center py-6">
          <div className="text-red-400 mb-3">
            <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
            <p>{error}</p>
          </div>
          <button
            onClick={retryLoad}
            className="px-4 py-2 bg-baywatch-orange hover:bg-baywatch-orange/80 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {summary && !loading && !error && (
        <div className="prose prose-invert max-w-none">
          <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
            {summary}
          </div>
          <div className="mt-4 pt-4 border-t border-baywatch-orange/20">
            <p className="text-xs text-gray-500 flex items-center">
              <i className="fas fa-magic mr-1"></i>
              Powered by AI • Generated using Mistral AI
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchAISummary;