// API host priority list for the native app. The first reachable host will be used.
// Put the apex domain first; some emulators fail DNS resolution for www/pages.dev.
export const API_HOSTS: string[] = [
  'https://frc7790.com',
  'https://www.frc7790.com'
  // If needed, you can append Pages preview domains here, but these may not resolve on some emulators:
  // 'https://frc7790-com.pages.dev',
  // 'https://frc7790.pages.dev'
];

// The Blue Alliance API Configuration
export const TBA_CONFIG = {
  AUTH_KEY: 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf',
  BASE_URL: 'https://www.thebluealliance.com/api/v3',
} as const;

// Statbotics API Configuration
export const STATBOTICS_CONFIG = {
  BASE_URL: 'https://api.statbotics.io/v3',
} as const;

// SWR Cache Configuration - determines how long different data types are cached
export const CACHE_CONFIG = {
  // Historical data (past years) - never changes, cache forever
  HISTORICAL_TTL: Infinity,
  // Team basic info - rarely changes
  TEAM_INFO_TTL: 24 * 60 * 60 * 1000, // 24 hours
  // Current year events list - changes during season
  CURRENT_EVENTS_TTL: 5 * 60 * 1000, // 5 minutes
  // Event rankings/matches during active event
  LIVE_DATA_TTL: 30 * 1000, // 30 seconds
  // Default TTL for unspecified data
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
} as const;
