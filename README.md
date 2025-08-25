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

Dev tips:

- For live reload from your dev machine inside the app, set `server.url` to your LAN dev server (e.g., `http://192.168.1.10:5173`) and set `cleartext: true`. Switch back to HTTPS for production.
- If you need notifications, background tasks, or native features later, add Capacitor plugins as needed.
