// Capacitor config for wrapping the existing website as a native app.
// Strategy: point the webview to the live site so all relative 
// API calls (/api, assets, etc.) work without code changes.
// For local development with hot reload, temporarily change server.url
// to your LAN Vite dev URL (e.g., http://192.168.1.10:5173) and set cleartext:true.

const config = {
  appId: 'com.frc7790.app',
  appName: 'FRC 7790',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    // Default to packaged assets for reliability; for dev, set url to your LAN dev server.
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: [
      'https://www.frc7790.com/*',
      'https://frc7790.com/*',
      'https://frc7790-com.pages.dev/*',
      'https://frc7790.pages.dev/*',
      'https://youtube.com/*',
      'https://www.youtube.com/*',
      'https://www.youtube-nocookie.com/*'
    ],
  },
  android: {
    allowMixedContent: false,
    // Use default activity name; additional settings done in Android Studio as needed
  },
} as const;

export default config;
