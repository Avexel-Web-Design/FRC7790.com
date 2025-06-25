import React from 'react';
import type { MatchData } from '../../../hooks/useMatchData';

interface MatchVideoProps {
  matchData: MatchData;
}

const MatchVideo: React.FC<MatchVideoProps> = ({ matchData }) => {
  const getYouTubeVideoId = (): string | null => {
    if (!matchData.videos || matchData.videos.length === 0) {
      return null;
    }

    // Find YouTube video
    const youtubeVideo = matchData.videos.find(video => video.type === 'youtube');
    return youtubeVideo ? youtubeVideo.key : null;
  };

  const renderVideoContent = () => {
    const videoId = getYouTubeVideoId();

    if (!videoId) {
      return (
        <div className="text-center text-gray-400 py-12">
          <i className="fas fa-video text-gray-600 text-4xl mb-4"></i>
          <p className="text-lg">No match video available</p>
          <p className="text-sm mt-2">Videos are typically uploaded after the event</p>
        </div>
      );
    }

    return (
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-xl shadow-lg"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="Match Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Match Video</h2>
      <div className="card-gradient backdrop-blur-sm border border-white/10 rounded-xl p-6">
        {renderVideoContent()}
      </div>
    </>
  );
};

export default MatchVideo;
