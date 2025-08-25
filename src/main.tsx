import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { Capacitor } from '@capacitor/core'

// Rewrite relative '/api' requests to the production domain when running natively
// so that API calls from the packaged app go to the live backend.
if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
  const originalFetch = window.fetch.bind(window)
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (typeof input === 'string') {
        if (input.startsWith('/api')) {
          return originalFetch(`https://www.frc7790.com${input}`, init)
        }
      } else if (input instanceof Request) {
        const url = input.url
        if (url.startsWith('/api')) {
          const req = new Request(`https://www.frc7790.com${url}`, input)
          return originalFetch(req, init)
        }
      }
    } catch {}
    return originalFetch(input as any, init)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
