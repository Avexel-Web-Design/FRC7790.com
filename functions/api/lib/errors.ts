/**
 * Effect Library for Cloudflare Workers - Error Types
 * 
 * Custom error types for the backend API using Effect's Data.TaggedError
 */

import { Data } from "effect"

/**
 * Validation errors for request data
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
  readonly reason: "invalid_credentials" | "token_expired" | "unauthorized" | "forbidden" | "invalid_token"
  readonly message: string
}> {
  static invalidCredentials(message?: string): AuthError {
    return new AuthError({
      reason: "invalid_credentials",
      message: message || "Invalid username or password"
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
  
  static forbidden(message?: string): AuthError {
    return new AuthError({
      reason: "forbidden",
      message: message || "You don't have permission to perform this action"
    })
  }
  
  static invalidToken(message?: string): AuthError {
    return new AuthError({
      reason: "invalid_token",
      message: message || "Invalid or malformed token"
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
 * Not found errors
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
 * Rate limiting errors
 */
export class RateLimitError extends Data.TaggedError("RateLimitError")<{
  readonly retryAfter: number
  readonly message: string
}> {
  static exceeded(retryAfter: number = 60): RateLimitError {
    return new RateLimitError({
      retryAfter,
      message: `Rate limit exceeded. Retry after ${retryAfter} seconds`
    })
  }
}

/**
 * Conflict errors (e.g., duplicate username)
 */
export class ConflictError extends Data.TaggedError("ConflictError")<{
  readonly resource: string
  readonly field: string
  readonly message: string
}> {
  static duplicate(resource: string, field: string): ConflictError {
    return new ConflictError({
      resource,
      field,
      message: `${resource} with this ${field} already exists`
    })
  }
  
  static field(field: string, message: string): ConflictError {
    return new ConflictError({
      resource: "record",
      field,
      message
    })
  }
}

/**
 * Union type of all API errors
 */
export type ApiError = 
  | ValidationError
  | AuthError
  | DbError
  | NotFoundError
  | RateLimitError
  | ConflictError
