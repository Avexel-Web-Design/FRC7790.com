# FRC Team 7790 - Baywatch Robotics Website

A modern React + TypeScript website for FRC Team 7790 Baywatch Robotics from Harbor Springs High School.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

The project follows a scalable component architecture:

```
src/
├── components/
│   ├── pages/           # Main page components
│   │   ├── Home.tsx
│   │   ├── Robots.tsx
│   │   ├── Sponsors.tsx
│   │   └── ...
│   ├── sections/        # Page sections organized by page
│   │   ├── home/        # Home page sections
│   │   │   ├── Hero.tsx
│   │   │   ├── LiveUpdates.tsx
│   │   │   ├── Countdown.tsx
│   │   │   └── ...
│   │   └── ...
│   └── shared/          # Reusable components
│       ├── Layout.tsx
│       ├── Navigation.tsx
│       └── Footer.tsx
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
└── index.css           # Global styles with Tailwind
```

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

## 📱 Android app (Capacitor)

This site can be shipped as a Play Store app using Capacitor. The app loads the live site (https://www.frc7790.com) inside a secure WebView.

Setup overview:

- Install deps:
  - npm i -D @capacitor/cli
  - npm i @capacitor/core @capacitor/android
- Ensure `capacitor.config.ts` exists. It is configured to use `server.url = https://www.frc7790.com`.
- Add Android platform: `npm run cap:android`
- Build and copy assets: `npm run android:build`
- Open Android Studio: `npm run cap:open:android`
- Generate a signed App Bundle (AAB) and upload to Google Play Console.

### Adaptive App Icon (logo.png)

The Android launcher icon uses the project `public/assets/images/logo.png` as the adaptive foreground source.

To (re)generate the foreground PNGs for all densities:

```bash
npm run generate:icons
```

This script scales `logo.png` with padding and writes `ic_launcher_foreground.png` into each `mipmap-*` folder. The adaptive XML (`mipmap-anydpi-v26/ic_launcher.xml`) already references `@mipmap/ic_launcher_foreground`. Background color is currently set to white (`#FFFFFF`) in `android/app/src/main/res/values/ic_launcher_background.xml`.

If you change `logo.png`, run the script again then rebuild the Android project (e.g. `npm run android:build` then open Android Studio).

### Reducing Android App Bundle Size

The Play Console flagged bundle size because large media (videos / hi-res images) are packaged when using bundled web assets. Since the app loads the live site (remote mode), you can safely prune oversized static files from `dist/` before copying into the Android project:

```bash
npm run build
npm run prune:dist   # removes videos, audio, hi-res & >750KB images
npm run android:build
```

Ultra-lean remote shell (only a minimal redirecting index, for smallest AAB; no offline capability):
```bash
LEAN_DIST=1 npm run android:release
```
Combines minify + prune. Use only if the live site is always reachable; otherwise the app shows a simple loading screen then redirects.

Environment variables:
`PRUNE_IMAGE_THRESHOLD_KB=500 npm run prune:dist` to use a smaller threshold.
`DRY_RUN=1 npm run prune:dist` to preview deletions.

If you ever need full offline capability, skip pruning (or ship a minimized offline subset & load heavy media remotely from the live domain).

### App Links (Deep Links)

The manifest now includes intent-filters for both `https://www.frc7790.com/*` and `https://frc7790.com/*` so either host opens directly in the app. Ensure DNS for `www` CNAME points to Cloudflare Pages; otherwise Android auto-verification may fail for that host (the apex will still verify).

Dev tips:

- For live reload from your dev machine inside the app, set `server.url` to your LAN dev server (e.g., `http://192.168.1.10:5173`) and set `cleartext: true`. Switch back to HTTPS for production.
- If you need notifications, background tasks, or native features later, add Capacitor plugins as needed.

## 🔔 Notifications diagnostics

Push setup has a server-side component and a device token registration step. Use these to diagnose:

- Check server push configuration JSON in your browser:
  - https://frc7790.com/api/chat/notifications/push-config?user_id=<YOUR_ID>
  - Expect: `{ mode: "v1" | "legacy" | "none", hasServiceAccount: bool, tokenCount: number }`
- Send a test push (requires at least one token registered for that user):
  - POST https://frc7790.com/api/chat/notifications/test with JSON `{ "user_id": <YOUR_ID> }`

On the device:
- First run the app and log in to register the device token.
- In logcat, confirm you see:
  - `Registering plugin instance: PushNotifications`
  - A `registration` event with token and a 200 posting to `/chat/notifications/register-device`.

## 🗄️ Apply DB migrations to production

If you see 500 from `/api/chat/notifications/all`, ensure the new tables exist in production.

Apply migrations with Wrangler using `--remote`:

```bash
wrangler d1 execute frc7790-com --remote --file=migrations/009_add_notifications.sql
wrangler d1 execute frc7790-com --remote --file=migrations/010_notifications_push.sql
```

## 🤖 AI Match Summaries

The Match page now shows a 1–2 sentence automatically generated recap above the Team Information card.

How it works:

- Frontend calls `POST /api/ai/match-summary/generate` with the full match object (and key) once per match view.
- The serverless function (Hono) fetches match data if not supplied, builds a concise stats prompt, and (if an AI key is configured) requests a summary.
- Response is cached client-side in `localStorage` (`match_summary_v1:<match_key>`) to avoid repeated API usage.
- If no AI key is present, a deterministic fallback summary (scores + winner) is returned.

Environment variables (set in Cloudflare Pages / Wrangler env):

```
# Preferred (OpenRouter: GLM 4.5 Air)
OPENROUTER_API_KEY=or_...
OPENROUTER_MODEL=z-ai/glm-4.5-air:free        # or another listing from https://openrouter.ai/models
OPENROUTER_SITE_URL=https://www.frc7790.com   # (recommended) used for attribution / ranking
OPENROUTER_APP_NAME=FRC 7790

# OpenAI (fallback chain if OpenRouter not set)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1

# Azure OpenAI (if both OpenRouter & OpenAI unset and Azure vars present)
AZURE_OPENAI_KEY=...
AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=<deploymentName>

# Groq (last before fallback)
GROQ_API_KEY=gk_...
GROQ_MODEL=llama-3.1-70b-versatile
```

Provider precedence: OpenRouter → Azure OpenAI → OpenAI → Groq → fallback (deterministic manual summary).

Nothing configured? You still get a fallback summary; the UI labels it "AI Generated" regardless (you can change the badge if desired).

Regenerate button: Re-requests the endpoint (ignores existing cached value) and overwrites cache.

To disable temporarily, remove the `<MatchSummary />` import / component in `src/components/pages/Match.tsx`.

