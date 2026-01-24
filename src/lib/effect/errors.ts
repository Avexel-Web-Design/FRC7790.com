/**
 * Effect Library - Core Error Types
 * 
 * These error classes extend Data.TaggedError for proper Effect integration,
 * allowing for type-safe error handling and pattern matching.
 */

import { Data } from "effect"

/**
 * Network-level errors (connection failures, timeouts, etc.)
 */
export class NetworkError extends Data.TaggedError("NetworkError")<{
  readonly cause: unknown
  readonly message: string
}> {
  static fromUnknown(cause: unknown): NetworkError {
    const message = cause instanceof Error ? cause.message : String(cause)
    return new NetworkError({ cause, message })
  }
}

/**
 * API response errors (non-2xx status codes)
 */
export class ApiError extends Data.TaggedError("ApiError")<{
  readonly status: number
  readonly statusText: string
  readonly message: string
  readonly body?: unknown
}> {
  static fromResponse(status: number, statusText: string, body?: unknown): ApiError {
    return new ApiError({
      status,
      statusText,
      message: `API error: ${status} ${statusText}`,
      body
    })
  }
}

/**
 * Validation errors for request/response data
 */
export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly errors: readonly string[]
  readonly message: string
}> {
  static fromErrors(errors: readonly string[]): ValidationError {
    return new ValidationError({
      errors,
      message: `Validation failed: ${errors.join(", ")}`
    })
  }
  
  static single(error: string): ValidationError {
    return ValidationError.fromErrors([error])
  }
}

/**
 * Authentication errors
 */
export class AuthError extends Data.TaggedError("AuthError")<{
  readonly reason: "invalid_credentials" | "token_expired" | "unauthorized" | "forbidden"
  readonly message: string
}> {
  static invalidCredentials(): AuthError {
    return new AuthError({
      reason: "invalid_credentials",
      message: "Invalid username or password"
    })
  }
  
  static tokenExpired(): AuthError {
    return new AuthError({
      reason: "token_expired", 
      message: "Authentication token has expired"
    })
  }
  
  static unauthorized(): AuthError {
    return new AuthError({
      reason: "unauthorized",
      message: "Authentication required"
    })
  }
  
  static forbidden(): AuthError {
    return new AuthError({
      reason: "forbidden",
      message: "You don't have permission to perform this action"
    })
  }
}

/**
 * Database operation errors
 */
export class DbError extends Data.TaggedError("DbError")<{
  readonly cause: unknown
  readonly message: string
  readonly operation?: string
}> {
  static fromUnknown(cause: unknown, operation?: string): DbError {
    const message = cause instanceof Error ? cause.message : String(cause)
    return new DbError({ cause, message, operation })
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends Data.TaggedError("RateLimitError")<{
  readonly retryAfter: number
  readonly message: string
}> {
  static fromHeaders(retryAfter: number): RateLimitError {
    return new RateLimitError({
      retryAfter,
      message: `Rate limited. Retry after ${retryAfter} seconds`
    })
  }
}

/**
 * Not found errors (resources that don't exist)
 */
export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly resource: string
  readonly id?: string
  readonly message: string
}> {
  static resource(resource: string, id?: string): NotFoundError {
    const message = id 
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`
    return new NotFoundError({ resource, id, message })
  }
}

/**
 * Union type of all application errors for comprehensive error handling
 */
export type AppError = 
  | NetworkError
  | ApiError
  | ValidationError
  | AuthError
  | DbError
  | RateLimitError
  | NotFoundError
