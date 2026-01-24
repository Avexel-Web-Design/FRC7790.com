/**
 * Effect Library - Main Entry Point
 * 
 * Re-exports all Effect utilities for convenient importing.
 * 
 * @example
 * ```ts
 * import { Effect, pipe } from "effect"
 * import { httpGet, ApiError, AuthToken } from "@/lib/effect"
 * ```
 */

// Re-export from Effect core for convenience
export { Effect, pipe, Layer, Context, Schedule, Duration, Option, Either, Exit, Cause } from "effect"

// Export error types
export * from "./errors"

// Export services
export * from "./services"

// Export HTTP utilities
export * from "./http"

// Export React hooks
export * from "./hooks"

// Export runtime utilities
export * from "./runtime"
