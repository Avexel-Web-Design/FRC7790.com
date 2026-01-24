/**
 * Register Handler - Effect-based implementation
 */

import { Hono } from "hono"
import { sign, verify } from "hono/jwt"
import { Effect, pipe } from "effect"
import {
  effectHandler,
  parseBody,
  ValidationError,
  AuthError,
  ConflictError,
  DbError,
  execute,
  type Env
} from "../lib/effect-hono"

// =============================================================================
// Types
// =============================================================================

interface RegisterRequest {
  username: string
  password: string
  is_admin?: boolean
  user_type?: "member" | "public"
}

interface RegisterResponse {
  token: string
  user: {
    id: number
    username: string
    isAdmin: boolean
    userType: string
    avatar?: string
  }
  message: string
}

// =============================================================================
// Password Hashing
// =============================================================================

/**
 * Hash password using Web Crypto API (SHA-256)
 */
const hashPassword = (password: string): Effect.Effect<string, never, never> =>
  Effect.promise(async () => {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
  })

// =============================================================================
// Authorization Check
// =============================================================================

interface AuthorizationResult {
  isAdmin: boolean
  creatorIsAdmin: boolean
}

/**
 * Check if requester can create admin users
 */
const checkAdminAuthorization = (
  authHeader: string | undefined,
  requestedAdmin: boolean,
  jwtSecret: string
): Effect.Effect<AuthorizationResult, AuthError, never> =>
  Effect.gen(function* () {
    if (!requestedAdmin) {
      return { isAdmin: false, creatorIsAdmin: false }
    }

    // Admin privileges requested - verify requester is an admin
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return yield* Effect.fail(
        AuthError.forbidden("Admin privileges cannot be assigned by non-admin users")
      )
    }

    const token = authHeader.slice(7)
    
    const decoded = yield* Effect.tryPromise({
      try: () => verify(token, jwtSecret, "HS256"),
      catch: () => AuthError.invalidToken("Invalid authorization for admin user creation")
    })

    if (!(decoded.isAdmin === true || decoded.isAdmin === 1)) {
      return yield* Effect.fail(
        AuthError.forbidden("Only administrators can create admin users")
      )
    }

    return { isAdmin: true, creatorIsAdmin: true }
  })

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate registration input
 */
const validateInput = (
  body: RegisterRequest,
  userType: "member" | "public"
): Effect.Effect<void, ValidationError, never> =>
  Effect.gen(function* () {
    const { username, password } = body

    if (!username || !password) {
      return yield* Effect.fail(ValidationError.single("Username and password are required"))
    }

    if (password.length < 6) {
      return yield* Effect.fail(ValidationError.single("Password must be at least 6 characters long"))
    }

    // For public accounts, enforce username pattern [A-Za-z0-9._]+
    const allowedUsername = /^[A-Za-z0-9._]+$/
    if (userType === "public" && !allowedUsername.test(username)) {
      return yield* Effect.fail(
        ValidationError.single("Username may only contain letters, numbers, underscores, and periods")
      )
    }
  })

// =============================================================================
// Register Effect
// =============================================================================

/**
 * Main register logic as an Effect
 */
const registerEffect = (
  body: RegisterRequest,
  authHeader: string | undefined,
  jwtSecret: string
): Effect.Effect<RegisterResponse, ValidationError | AuthError | ConflictError | DbError, import("../lib/db").D1> =>
  Effect.gen(function* () {
    const { username, password, is_admin, user_type } = body

    // Check admin authorization
    const { isAdmin, creatorIsAdmin } = yield* checkAdminAuthorization(
      authHeader,
      is_admin === true,
      jwtSecret
    )

    // Determine user type
    let userType: "member" | "public" = "public"
    if (creatorIsAdmin) {
      if (user_type === "public" || user_type === "member") {
        userType = user_type
      } else {
        userType = "member"
      }
    }

    // Validate input
    yield* validateInput(body, userType)

    // Hash password
    const hashedPassword = yield* hashPassword(password)

    // Prepare values
    const isAdminValue = isAdmin ? 1 : 0
    const avatarValue = userType === "member" 
      ? `https://api.dicebear.com/7.x/initials/svg?seed=${username}` 
      : null

    // Insert user - handle unique constraint violation
    const insertEffect = execute(
      "INSERT INTO users (username, password, avatar, is_admin, user_type) VALUES (?, ?, ?, ?, ?)",
      username,
      hashedPassword,
      avatarValue,
      isAdminValue,
      userType
    )
    
    const result = yield* pipe(
      insertEffect,
      Effect.catchTag("DbError", (error): Effect.Effect<never, ConflictError | DbError, never> => {
        if (error.message.includes("UNIQUE constraint failed")) {
          return Effect.fail(ConflictError.field("username", "Username already exists"))
        }
        return Effect.fail(error)
      })
    )

    const userId = result.lastRowId

    // Generate JWT token
    const token = yield* Effect.promise(() =>
      sign(
        {
          id: userId,
          username: username,
          isAdmin: isAdminValue,
          userType,
          avatar: avatarValue || undefined,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hours
        },
        jwtSecret
      )
    )

    return {
      token,
      user: {
        id: userId,
        username: username,
        isAdmin: isAdminValue === 1,
        userType,
        avatar: avatarValue || undefined
      },
      message: "Registration successful"
    }
  })

// =============================================================================
// Hono Router
// =============================================================================

const register = new Hono<{ Bindings: Env }>()

register.post("/", effectHandler((c) =>
  Effect.gen(function* () {
    const body = yield* parseBody<RegisterRequest>(c)
    const authHeader = c.req.header("Authorization")
    return yield* registerEffect(body, authHeader, c.env.JWT_SECRET)
  })
))

export default register
