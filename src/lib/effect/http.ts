/**
 * Effect Library - HTTP Client Utilities
 * 
 * Provides Effect-based HTTP client with retry logic, error handling,
 * and integration with auth/session services.
 */

import { Effect, Schedule, Duration, pipe } from "effect"
import { NetworkError, ApiError, RateLimitError } from "./errors"
import { AuthToken, SessionId } from "./services"
import { Capacitor, CapacitorHttp, type HttpResponse } from "@capacitor/core"

// =============================================================================
// Types
// =============================================================================

export interface HttpRequestConfig {
  method: string
  path: string
  data?: unknown
  headers?: Record<string, string>
  timeout?: number
}

export interface HttpResponseData<T = unknown> {
  status: number
  headers: Headers
  data: T
}

// =============================================================================
// Retry Configuration
// =============================================================================

/**
 * Retry schedule for transient failures and rate limiting
 * - Exponential backoff starting at 500ms
 * - Jittered to prevent thundering herd
 * - Maximum 3 retries
 * - Only retries on rate limit (429) or network errors
 */
const retrySchedule = pipe(
  Schedule.exponential(Duration.millis(500)),
  Schedule.jittered,
  Schedule.intersect(Schedule.recurs(3))
)

/**
 * Determines if an error should trigger a retry
 */
const shouldRetry = (error: NetworkError | ApiError | RateLimitError): boolean => {
  if (error._tag === "RateLimitError") return true
  if (error._tag === "ApiError" && error.status === 429) return true
  if (error._tag === "NetworkError") return true
  return false
}

// =============================================================================
// Core HTTP Functions
// =============================================================================

/**
 * Build headers for API requests
 */
const buildHeaders = (
  token: string | null,
  sessionId: string,
  customHeaders?: Record<string, string>
): Record<string, string> => ({
  "Content-Type": "application/json",
  "X-Session-ID": sessionId,
  ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  ...customHeaders
})

/**
 * Parse response and handle errors
 */
const handleResponse = async <T>(
  response: Response | HttpResponse
): Promise<T> => {
  // Handle Capacitor HTTP response
  if ("data" in response && !("json" in response)) {
    return response.data as T
  }
  
  // Handle standard fetch Response
  const fetchResponse = response as Response
  const text = await fetchResponse.text()
  
  if (!text) {
    return undefined as T
  }
  
  try {
    return JSON.parse(text) as T
  } catch {
    return text as T
  }
}

/**
 * Core fetch implementation using native fetch or Capacitor HTTP
 */
const fetchInternal = (
  url: string,
  config: RequestInit,
  isNative: boolean
): Effect.Effect<Response, NetworkError | ApiError | RateLimitError, never> =>
  pipe(
    Effect.tryPromise({
      try: async () => {
        if (isNative) {
          // Use Capacitor's HTTP plugin for native platforms
          const reqOpts = {
            method: (config.method || "GET").toUpperCase(),
            url,
            headers: config.headers as Record<string, string>,
            data: config.body ? JSON.parse(config.body as string) : undefined,
            responseType: "json" as const,
            connectTimeout: 10000,
            readTimeout: 15000,
          }
          
          const httpResp = await CapacitorHttp.request(reqOpts)
          
          // Synthesize a Response object for consistency
          const body = httpResp.data != null ? JSON.stringify(httpResp.data) : undefined
          return new Response(body, {
            status: httpResp.status || 0,
            headers: new Headers(httpResp.headers as Record<string, string>),
          })
        }
        
        // Standard fetch for web
        return await fetch(url, config)
      },
      catch: (error) => NetworkError.fromUnknown(error)
    }),
    Effect.flatMap((response): Effect.Effect<Response, ApiError | RateLimitError, never> => {
      if (response.ok) {
        return Effect.succeed(response)
      }
      
      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("Retry-After") || "1")
        return Effect.fail(RateLimitError.fromHeaders(retryAfter))
      }
      
      // Handle other errors
      return Effect.fail(
        ApiError.fromResponse(response.status, response.statusText)
      )
    })
  )

// =============================================================================
// Public API
// =============================================================================

/**
 * API host configuration
 */
const API_HOSTS = [
  "https://frc7790.com",
  "https://www.frc7790.com"
]

/**
 * Make an HTTP request to the backend API
 * 
 * Features:
 * - Automatic auth token injection
 * - Session ID for rate limiting
 * - Retry logic for transient failures
 * - Native platform support via Capacitor
 * 
 * @example
 * ```ts
 * const result = yield* httpRequest({
 *   method: "GET",
 *   path: "/profile"
 * })
 * ```
 */
export const httpRequest = <T = unknown>(
  config: HttpRequestConfig
): Effect.Effect<HttpResponseData<T>, NetworkError | ApiError | RateLimitError, AuthToken | SessionId> =>
  Effect.gen(function* () {
    const authService = yield* AuthToken
    const sessionService = yield* SessionId
    
    const token = authService.getToken()
    const sessionId = sessionService.getSessionId()
    const isNative = Capacitor.isNativePlatform()
    
    const headers = buildHeaders(token, sessionId, config.headers)
    
    const requestConfig: RequestInit = {
      method: config.method,
      headers,
      body: config.data ? JSON.stringify(config.data) : undefined,
    }
    
    // Determine URL candidates
    const candidates = isNative ? API_HOSTS : [""]
    
    // Try each host until one succeeds
    let lastError: NetworkError | ApiError | RateLimitError | null = null
    
    for (const host of candidates) {
      const url = host ? `${host}/api${config.path}` : `/api${config.path}`
      
      const result = yield* pipe(
        fetchInternal(url, requestConfig, isNative),
        Effect.retry({
          schedule: retrySchedule,
          while: shouldRetry
        }),
        Effect.either
      )
      
      if (result._tag === "Right") {
        const response = result.right
        const data = yield* Effect.tryPromise({
          try: () => handleResponse<T>(response),
          catch: (error) => NetworkError.fromUnknown(error)
        })
        
        return {
          status: response.status,
          headers: response.headers,
          data
        }
      }
      
      lastError = result.left
    }
    
    // All hosts failed
    return yield* Effect.fail(lastError!)
  })

/**
 * Convenience method for GET requests
 */
export const httpGet = <T = unknown>(
  path: string,
  headers?: Record<string, string>
): Effect.Effect<HttpResponseData<T>, NetworkError | ApiError | RateLimitError, AuthToken | SessionId> =>
  httpRequest<T>({ method: "GET", path, headers })

/**
 * Convenience method for POST requests
 */
export const httpPost = <T = unknown>(
  path: string,
  data?: unknown,
  headers?: Record<string, string>
): Effect.Effect<HttpResponseData<T>, NetworkError | ApiError | RateLimitError, AuthToken | SessionId> =>
  httpRequest<T>({ method: "POST", path, data, headers })

/**
 * Convenience method for PUT requests
 */
export const httpPut = <T = unknown>(
  path: string,
  data?: unknown,
  headers?: Record<string, string>
): Effect.Effect<HttpResponseData<T>, NetworkError | ApiError | RateLimitError, AuthToken | SessionId> =>
  httpRequest<T>({ method: "PUT", path, data, headers })

/**
 * Convenience method for DELETE requests
 */
export const httpDelete = <T = unknown>(
  path: string,
  headers?: Record<string, string>
): Effect.Effect<HttpResponseData<T>, NetworkError | ApiError | RateLimitError, AuthToken | SessionId> =>
  httpRequest<T>({ method: "DELETE", path, headers })

// =============================================================================
// External API Fetching (TBA, Statbotics)
// =============================================================================

/**
 * Fetch from an external API (no auth token, no session ID needed)
 */
export const fetchExternal = <T = unknown>(
  url: string,
  headers?: Record<string, string>
): Effect.Effect<T, NetworkError | ApiError> =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => fetch(url, { headers }),
      catch: (error) => NetworkError.fromUnknown(error)
    })
    
    if (!response.ok) {
      return yield* Effect.fail(
        ApiError.fromResponse(response.status, response.statusText)
      )
    }
    
    const data = yield* Effect.tryPromise({
      try: () => response.json() as Promise<T>,
      catch: (error) => NetworkError.fromUnknown(error)
    })
    
    return data
  })
