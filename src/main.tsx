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
    // Auto-enable API debug overlay on native if not explicitly set
    const current = localStorage.getItem('apiDebug');
    if (current === null) {
      localStorage.setItem('apiDebug', '1');
    }
  } catch {}
  const originalFetch = window.fetch.bind(window)
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
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
          return attempt() as unknown as Promise<Response>
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
          return attempt() as unknown as Promise<Response>
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
