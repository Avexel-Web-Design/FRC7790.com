import React, { useState } from 'react';
import type { MatchData } from '../../../hooks/useMatchData';
import { useMatchVideo } from '../../../hooks/useMatchVideo';

interface MatchVideoProps {
  matchData: MatchData;
}

const MatchVideo: React.FC<MatchVideoProps> = ({ matchData }) => {
  const { videoId: prioritizedVideoId } = useMatchVideo(matchData.videos);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const activeVideoId = selectedVideoId || prioritizedVideoId;

  const youtubeVideos = matchData.videos?.filter((video) => video.type === 'youtube') ?? [];

  const renderVideoContent = () => {
    if (youtubeVideos.length === 0) {
      return (
        <div className="text-center text-gray-400 py-12">
          <i className="fas fa-video text-gray-600 text-4xl mb-4"></i>
          <p className="text-lg">No match video available</p>
          <p className="text-sm mt-2">Videos are typically uploaded after the event</p>
        </div>
      );
    }

    if (!activeVideoId) {
      return (
        <div className="text-center text-gray-400 py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading video...</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-xl shadow-lg"
            src={`https://www.youtube.com/embed/${activeVideoId}`}
            title="Match Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>

        {youtubeVideos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {youtubeVideos.map((video, index) => (
              <button
                key={video.key}
                onClick={() => setSelectedVideoId(video.key)}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  activeVideoId === video.key
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Video {index + 1}
              </button>
            ))}
          </div>
        )}
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
