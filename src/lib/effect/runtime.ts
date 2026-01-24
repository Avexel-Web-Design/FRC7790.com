/**
 * Effect Library - Runtime Utilities
 * 
 * Provides utilities for running Effects in different contexts,
 * with pre-configured services and proper error handling.
 */

import { Effect, Exit, Cause, pipe } from "effect"
import { BrowserServicesLive, AuthToken, SessionId } from "./services"
import type { AppError } from "./errors"

// =============================================================================
// Types
// =============================================================================

/**
 * Result type that mirrors Effect's Exit but is easier to use in React
 */
export type EffectRunResult<A, E> = 
  | { readonly _tag: "Success"; readonly value: A }
  | { readonly _tag: "Failure"; readonly error: E }

// =============================================================================
// Runtime Utilities
// =============================================================================

/**
 * Run an Effect that requires browser services (AuthToken, SessionId)
 * and convert the result to a simple success/failure object.
 * 
 * @example
 * ```ts
 * const result = await runWithServices(httpGet<User>("/profile"))
 * if (result._tag === "Success") {
 *   console.log(result.value)
 * } else {
 *   console.error(result.error)
 * }
 * ```
 */
export const runWithServices = async <A, E>(
  effect: Effect.Effect<A, E, AuthToken | SessionId>
): Promise<EffectRunResult<A, E>> => {
  const provided = pipe(
    effect,
    Effect.provide(BrowserServicesLive)
  )
  
  const exit = await Effect.runPromiseExit(provided)
  
  if (Exit.isSuccess(exit)) {
    return { _tag: "Success", value: exit.value }
  }
  
  const failure = Cause.failureOption(exit.cause)
  if (failure._tag === "Some") {
    return { _tag: "Failure", error: failure.value }
  }
  
  // Defect (unexpected error)
  throw Cause.squash(exit.cause)
}

/**
 * Run an Effect that requires browser services and return the value,
 * throwing on failure. Use when you want exceptions.
 * 
 * @example
 * ```ts
 * try {
 *   const user = await runWithServicesOrThrow(httpGet<User>("/profile"))
 * } catch (error) {
 *   // Handle error
 * }
 * ```
 */
export const runWithServicesOrThrow = async <A, E>(
  effect: Effect.Effect<A, E, AuthToken | SessionId>
): Promise<A> => {
  const provided = pipe(
    effect,
    Effect.provide(BrowserServicesLive)
  )
  
  return Effect.runPromise(provided)
}

/**
 * Run a pure Effect (no requirements) and return success/failure result
 */
export const runPure = async <A, E>(
  effect: Effect.Effect<A, E, never>
): Promise<EffectRunResult<A, E>> => {
  const exit = await Effect.runPromiseExit(effect)
  
  if (Exit.isSuccess(exit)) {
    return { _tag: "Success", value: exit.value }
  }
  
  const failure = Cause.failureOption(exit.cause)
  if (failure._tag === "Some") {
    return { _tag: "Failure", error: failure.value }
  }
  
  throw Cause.squash(exit.cause)
}

/**
 * Run a pure Effect synchronously (for effects that don't have async operations)
 */
export const runSync = <A, E>(
  effect: Effect.Effect<A, E, never>
): A => {
  return Effect.runSync(effect)
}

// =============================================================================
// Error Handling Utilities
// =============================================================================

/**
 * Convert an AppError to a user-friendly message
 */
export const errorToMessage = (error: AppError): string => {
  switch (error._tag) {
    case "NetworkError":
      return "Unable to connect. Please check your internet connection."
    case "ApiError":
      if (error.status === 401) return "Please log in to continue."
      if (error.status === 403) return "You don't have permission to do this."
      if (error.status === 404) return "The requested resource was not found."
      if (error.status >= 500) return "Server error. Please try again later."
      return error.message
    case "ValidationError":
      return error.errors.join(", ")
    case "AuthError":
      return error.message
    case "DbError":
      return "Database error. Please try again."
    case "RateLimitError":
      return `Too many requests. Please wait ${error.retryAfter} seconds.`
    case "NotFoundError":
      return error.message
    default:
      return "An unexpected error occurred."
  }
}

/**
 * Check if an error is a specific type
 */
export const isErrorType = <T extends AppError["_tag"]>(
  error: AppError,
  tag: T
): error is Extract<AppError, { _tag: T }> => {
  return error._tag === tag
}

// =============================================================================
// Promise Interop
// =============================================================================

/**
 * Convert a Promise-returning function to an Effect
 * 
 * @example
 * ```ts
 * const fetchUser = fromPromise(
 *   () => fetch("/api/user").then(r => r.json()),
 *   (error) => NetworkError.fromUnknown(error)
 * )
 * ```
 */
export const fromPromise = <A, E>(
  promise: () => Promise<A>,
  onError: (error: unknown) => E
): Effect.Effect<A, E, never> =>
  Effect.tryPromise({
    try: promise,
    catch: onError
  })

/**
 * Convert an Effect to a Promise (with services provided)
 * This is the bridge from Effect world back to Promise world.
 * 
 * @example
 * ```ts
 * // In a React component or other Promise-based code
 * const user = await toPromise(httpGet<User>("/profile"))
 * ```
 */
export const toPromise = <A, E>(
  effect: Effect.Effect<A, E, AuthToken | SessionId>
): Promise<A> => runWithServicesOrThrow(effect)
