/**
 * Effect-Hono Integration
 * 
 * Provides utilities for using Effect in Hono handlers with proper
 * error handling and response generation.
 */

import { Effect, Exit, Cause, pipe } from "effect"
import type { Context as HonoContext } from "hono"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import { 
  ValidationError, 
  AuthError, 
  type ApiError 
} from "./errors"
import { D1, D1Live, type D1Database } from "./db"

// =============================================================================
// Types
// =============================================================================

/**
 * Environment bindings from Cloudflare
 */
export interface Env {
  DB: D1Database
  JWT_SECRET: string
  OPENROUTER_API_KEY?: string
  OPENROUTER_MODEL?: string
  OPENROUTER_SITE_URL?: string
  OPENROUTER_APP_NAME?: string
  OPENAI_API_KEY?: string
  AZURE_OPENAI_API_KEY?: string
  AZURE_OPENAI_ENDPOINT?: string
  AZURE_OPENAI_DEPLOYMENT?: string
  GROQ_API_KEY?: string
}

/**
 * Hono context with typed environment
 */
export type AppContext = HonoContext<{ Bindings: Env }>

/**
 * Authenticated user from auth middleware
 */
export interface AuthUser {
  id: number
  username: string
  isAdmin: boolean
  avatar?: string
  userType?: string
}

/**
 * Hono context with typed environment and auth variables
 */
export type AuthContext = HonoContext<{ 
  Bindings: Env
  Variables: { user: AuthUser }
}>

/**
 * Handler function type that returns an Effect
 */
export type EffectHandler<A, E extends ApiError = ApiError> = (
  c: AppContext
) => Effect.Effect<A, E, D1>

/**
 * Handler function type for authenticated routes
 */
export type AuthEffectHandler<A, E extends ApiError = ApiError> = (
  c: AuthContext
) => Effect.Effect<A, E, D1>

// =============================================================================
// Error to HTTP Response Mapping
// =============================================================================

/**
 * Convert an API error to an HTTP status code
 */
const errorToStatus = (error: ApiError): ContentfulStatusCode => {
  switch (error._tag) {
    case "ValidationError":
      return 400
    case "AuthError":
      switch (error.reason) {
        case "invalid_credentials":
        case "invalid_token":
          return 401
        case "token_expired":
          return 401
        case "unauthorized":
          return 401
        case "forbidden":
          return 403
      }
      break
    case "NotFoundError":
      return 404
    case "ConflictError":
      return 409
    case "RateLimitError":
      return 429
    case "DbError":
      return 500
  }
  return 500
}

/**
 * Convert an API error to a JSON response body
 */
const errorToBody = (error: ApiError): Record<string, unknown> => {
  switch (error._tag) {
    case "ValidationError":
      return { error: error.message, errors: error.errors }
    case "AuthError":
      return { error: error.message, reason: error.reason }
    case "NotFoundError":
      return { error: error.message, resource: error.resource }
    case "ConflictError":
      return { error: error.message, field: error.field }
    case "RateLimitError":
      return { error: error.message, retryAfter: error.retryAfter }
    case "DbError":
      // Don't expose internal DB errors to clients
      return { error: "Database error occurred" }
  }
}

// =============================================================================
// Effect Handler Wrapper
// =============================================================================

/**
 * Convert an Effect-based handler to a Hono handler
 * 
 * This function:
 * 1. Creates a D1 service layer from the context
 * 2. Runs the Effect with the service layer
 * 3. Converts success/failure to appropriate HTTP responses
 * 
 * @example
 * ```ts
 * app.get('/users/:id', effectHandler((c) => 
 *   Effect.gen(function* () {
 *     const db = yield* D1
 *     const id = c.req.param('id')
 *     const user = yield* db.queryOne('SELECT * FROM users WHERE id = ?', id)
 *     if (!user) return yield* Effect.fail(NotFoundError.resource('User', id))
 *     return user
 *   })
 * ))
 * ```
 */
export const effectHandler = <A>(
  handler: (c: AppContext) => Effect.Effect<A, ApiError, D1>
): ((c: AppContext) => Promise<Response>) => {
  return async (c: AppContext) => {
    const db = c.env.DB
    const d1Layer = D1Live(db)
    
    const effect = pipe(
      handler(c),
      Effect.provide(d1Layer)
    )
    
    const exit = await Effect.runPromiseExit(effect)
    
    if (Exit.isSuccess(exit)) {
      // Success - return JSON response
      const value = exit.value
      
      // If the handler returned a Response directly, use it
      if (value instanceof Response) {
        return value
      }
      
      // Otherwise, wrap in JSON
      return c.json(value)
    }
    
    // Failure - convert error to HTTP response
    const cause = exit.cause
    const failure = Cause.failureOption(cause)
    
    if (failure._tag === "Some") {
      const error = failure.value as ApiError
      const status = errorToStatus(error)
      const body = errorToBody(error)
      
      // Add Retry-After header for rate limit errors
      if (error._tag === "RateLimitError") {
        return c.json(body, status, {
          "Retry-After": String(error.retryAfter)
        })
      }
      
      return c.json(body, status)
    }
    
    // Defect (unexpected error) - log and return 500
    console.error("Unexpected error in handler:", Cause.pretty(cause))
    return c.json({ error: "Internal server error" }, 500)
  }
}

/**
 * Convert an Effect-based handler for authenticated routes to a Hono handler
 * 
 * This is specifically for routes that use authMiddleware and have access to
 * the `user` variable in the context.
 * 
 * @example
 * ```ts
 * app.get('/profile', authEffectHandler((c) => 
 *   Effect.gen(function* () {
 *     const user = c.get('user') // Typed as AuthUser
 *     const db = yield* D1
 *     return yield* db.queryOne('SELECT * FROM users WHERE id = ?', user.id)
 *   })
 * ))
 * ```
 */
export const authEffectHandler = <A>(
  handler: (c: AuthContext) => Effect.Effect<A, ApiError, D1>
): ((c: AuthContext) => Promise<Response>) => {
  return async (c: AuthContext) => {
    const db = c.env.DB
    const d1Layer = D1Live(db)
    
    const effect = pipe(
      handler(c),
      Effect.provide(d1Layer)
    )
    
    const exit = await Effect.runPromiseExit(effect)
    
    if (Exit.isSuccess(exit)) {
      // Success - return JSON response
      const value = exit.value
      
      // If the handler returned a Response directly, use it
      if (value instanceof Response) {
        return value
      }
      
      // Otherwise, wrap in JSON
      return c.json(value)
    }
    
    // Failure - convert error to HTTP response
    const cause = exit.cause
    const failure = Cause.failureOption(cause)
    
    if (failure._tag === "Some") {
      const error = failure.value as ApiError
      const status = errorToStatus(error)
      const body = errorToBody(error)
      
      // Add Retry-After header for rate limit errors
      if (error._tag === "RateLimitError") {
        return c.json(body, status, {
          "Retry-After": String(error.retryAfter)
        })
      }
      
      return c.json(body, status)
    }
    
    // Defect (unexpected error) - log and return 500
    console.error("Unexpected error in handler:", Cause.pretty(cause))
    return c.json({ error: "Internal server error" }, 500)
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse and validate JSON body from a Hono request
 */
export const parseBody = <T>(c: { req: { json: <J>() => Promise<J> } }): Effect.Effect<T, ValidationError, never> =>
  Effect.tryPromise({
    try: () => c.req.json<T>(),
    catch: () => ValidationError.single("Invalid JSON body")
  })

/**
 * Get a required parameter from the request
 */
export const getParam = (
  c: { req: { param: (name: string) => string | undefined } },
  name: string
): Effect.Effect<string, ValidationError, never> => {
  const value = c.req.param(name)
  if (!value) {
    return Effect.fail(ValidationError.single(`Missing required parameter: ${name}`))
  }
  return Effect.succeed(value)
}

/**
 * Get a required query parameter
 */
export const getQuery = (
  c: { req: { query: (name: string) => string | undefined } },
  name: string
): Effect.Effect<string, ValidationError, never> => {
  const value = c.req.query(name)
  if (!value) {
    return Effect.fail(ValidationError.single(`Missing required query parameter: ${name}`))
  }
  return Effect.succeed(value)
}

/**
 * Get an optional query parameter with a default value
 */
export const getQueryOr = <T>(
  c: { req: { query: (name: string) => string | undefined } },
  name: string,
  defaultValue: T
): Effect.Effect<string | T, never, never> => {
  const value = c.req.query(name)
  return Effect.succeed(value ?? defaultValue)
}

/**
 * Get the authorization header and extract the JWT token
 */
export const getAuthToken = (
  c: { req: { header: (name: string) => string | undefined } }
): Effect.Effect<string, AuthError, never> => {
  const authHeader = c.req.header("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return Effect.fail(AuthError.unauthorized())
  }
  return Effect.succeed(authHeader.slice(7))
}

/**
 * Get the JWT payload from the context (set by auth middleware)
 */
export const getJwtPayload = (
  c: { get: (key: string) => unknown }
): Effect.Effect<{ userId: number; username: string; isAdmin: boolean }, AuthError, never> => {
  const payload = c.get("jwtPayload") as { userId: number; username: string; isAdmin: boolean } | undefined
  if (!payload) {
    return Effect.fail(AuthError.unauthorized())
  }
  return Effect.succeed(payload)
}

// =============================================================================
// Re-exports
// =============================================================================

export { D1, D1Live, query, queryOne, execute, batch } from "./db"
export * from "./errors"
