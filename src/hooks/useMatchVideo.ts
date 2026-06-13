import { useState, useEffect, useMemo } from 'react';
import { fetchYouTubeEmbedData, isOfficialFIRSTChannel } from '../utils/youtube';

interface VideoItem {
  type: string;
  key: string;
}

export interface UseMatchVideoReturn {
  videoId: string | null;
  isLoading: boolean;
}

export function useMatchVideo(videos: VideoItem[] | undefined): UseMatchVideoReturn {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Stable dependency key based on actual video IDs
  const videoKeys = useMemo(
    () => videos?.filter((v) => v.type === 'youtube').map((v) => v.key).join(',') ?? '',
    [videos]
  );

  useEffect(() => {
    if (!videos || videos.length === 0) {
      setVideoId(null);
      setIsLoading(false);
      return;
    }

    const youtubeVideos = videos.filter((video) => video.type === 'youtube');
    if (youtubeVideos.length === 0) {
      setVideoId(null);
      setIsLoading(false);
      return;
    }

    // Set first video immediately to avoid flash
    setVideoId(youtubeVideos[0].key);
    setIsLoading(false);

    // If multiple videos, check in background for official FIRST channel
    if (youtubeVideos.length > 1) {
      const prioritize = async () => {
        try {
          const results = await Promise.all(
            youtubeVideos.map(async (video) => {
              const embedData = await fetchYouTubeEmbedData(video.key);
              return {
                videoId: video.key,
                isOfficial: embedData ? isOfficialFIRSTChannel(embedData) : false,
              };
            })
          );

          const official = results.find((r) => r.isOfficial);
          if (official && official.videoId !== youtubeVideos[0].key) {
            setVideoId(official.videoId);
          }
        } catch {
          // Ignore errors, keep first video
        }
      };

      prioritize();
    }
  }, [videoKeys]); // eslint-disable-line react-hooks/exhaustive-deps

  return { videoId, isLoading };
}
