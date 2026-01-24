/**
 * Effect Library - Service Tags and Context
 * 
 * Defines Effect services using the Context/Tag pattern for dependency injection.
 * This enables type-safe service composition and testing.
 */

import { Context, Layer, Effect } from "effect"

// =============================================================================
// Auth Token Service
// =============================================================================

/**
 * Service interface for auth token access
 */
export interface AuthTokenService {
  readonly getToken: () => string | null
  readonly setToken: (token: string) => void
  readonly clearToken: () => void
}

/**
 * Auth Token service tag for dependency injection
 */
export class AuthToken extends Context.Tag("AuthToken")<
  AuthToken,
  AuthTokenService
>() {}

/**
 * Live implementation using localStorage
 */
export const AuthTokenLive = Layer.succeed(
  AuthToken,
  {
    getToken: () => {
      if (typeof localStorage === "undefined") return null
      return localStorage.getItem("token")
    },
    setToken: (token: string) => {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("token", token)
      }
    },
    clearToken: () => {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("token")
      }
    }
  }
)

// =============================================================================
// Session ID Service
// =============================================================================

/**
 * Service interface for session ID management (for rate limiting)
 */
export interface SessionIdService {
  readonly getSessionId: () => string
}

/**
 * Session ID service tag for dependency injection
 */
export class SessionId extends Context.Tag("SessionId")<
  SessionId,
  SessionIdService
>() {}

/**
 * Live implementation using localStorage with crypto random generation
 */
export const SessionIdLive = Layer.succeed(
  SessionId,
  {
    getSessionId: () => {
      if (typeof localStorage === "undefined") {
        // Fallback for SSR/non-browser environments
        return `server-${Date.now().toString(36)}`
      }
      
      let sessionId = localStorage.getItem("session_id")
      if (!sessionId) {
        // Generate a cryptographically secure random string
        const randomUint8 = window.crypto.getRandomValues(new Uint8Array(16))
        const randomStr = Array.from(randomUint8).map(b => b.toString(36)).join("")
        sessionId = randomStr + Date.now().toString(36)
        try {
          localStorage.setItem("session_id", sessionId)
        } catch {
          // Ignore storage errors
        }
      }
      return sessionId
    }
  }
)

// =============================================================================
// Combined Services Layer
// =============================================================================

/**
 * Combined layer with all browser-based services
 */
export const BrowserServicesLive = Layer.mergeAll(
  AuthTokenLive,
  SessionIdLive
)

// =============================================================================
// Helper Effects
// =============================================================================

/**
 * Get the current auth token
 */
export const getAuthToken = Effect.gen(function* () {
  const service = yield* AuthToken
  return service.getToken()
})

/**
 * Set the auth token
 */
export const setAuthToken = (token: string) => Effect.gen(function* () {
  const service = yield* AuthToken
  service.setToken(token)
})

/**
 * Clear the auth token (logout)
 */
export const clearAuthToken = Effect.gen(function* () {
  const service = yield* AuthToken
  service.clearToken()
})

/**
 * Get the session ID for rate limiting
 */
export const getSessionId = Effect.gen(function* () {
  const service = yield* SessionId
  return service.getSessionId()
})
