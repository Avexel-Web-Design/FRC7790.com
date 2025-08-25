// API host priority list for the native app. The first reachable host will be used.
// Put the apex domain first; some emulators fail DNS resolution for www/pages.dev.
export const API_HOSTS: string[] = [
  'https://frc7790.com',
  'https://www.frc7790.com'
  // If needed, you can append Pages preview domains here, but these may not resolve on some emulators:
  // 'https://frc7790-com.pages.dev',
  // 'https://frc7790.pages.dev'
];
