export interface YouTubeEmbedData {
  title: string;
  author_name: string;
  author_url: string;
  type: string;
}

export const FIRST_ROBOTICS_COMPETITION_CHANNEL = 'FIRSTRoboticsCompetition';
export const FIRST_ROBOTICS_COMPETITION_CHANNEL_URL = 'https://www.youtube.com/@FIRSTRoboticsCompetition';

export async function fetchYouTubeEmbedData(videoId: string): Promise<YouTubeEmbedData | null> {
  try {
    const response = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (data.type !== 'video') {
      return null;
    }
    return data as YouTubeEmbedData;
  } catch {
    return null;
  }
}

export function isOfficialFIRSTChannel(embedData: YouTubeEmbedData): boolean {
  return (
    embedData.author_name === FIRST_ROBOTICS_COMPETITION_CHANNEL ||
    embedData.author_url === FIRST_ROBOTICS_COMPETITION_CHANNEL_URL
  );
}
