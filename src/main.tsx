import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { Capacitor } from '@capacitor/core'
import { API_HOSTS } from './config'

// Rewrite relative '/api' requests to the production domain when running natively
// so that API calls from the packaged app go to the live backend.
if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
  try {
    // Ensure debug overlay remains disabled in production
    localStorage.removeItem('apiDebug');
  } catch {}
  const originalFetch = window.fetch.bind(window)
  const customFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      if (typeof input === 'string') {
        if (input.startsWith('/api')) {
          // try hosts in order until one responds
          const attempt = async () => {
            let lastRes: Response | undefined
            for (const host of API_HOSTS) {
              try {
                const res = await originalFetch(`${host}${input}`, init)
                if (res.ok) return res
                lastRes = res
              } catch {}
            }
            return lastRes ?? originalFetch(`https://www.frc7790.com${input}`, init)
          }
          return attempt()
        }
      } else if (input instanceof Request) {
        const url = input.url
        if (url.startsWith('/api')) {
          const attempt = async () => {
            let lastRes: Response | undefined
            for (const host of API_HOSTS) {
              try {
                const req = new Request(`${host}${url}`, input)
                const res = await originalFetch(req, init)
                if (res.ok) return res
                lastRes = res
              } catch {}
            }
            const req = new Request(`https://www.frc7790.com${url}`, input)
            return lastRes ?? originalFetch(req, init)
          }
          return attempt()
        }
      }
    } catch {}
    return originalFetch(input, init)
  }
  // Preserve any extra properties on the original fetch
  Object.assign(customFetch, originalFetch)
  window.fetch = customFetch as typeof fetch
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
