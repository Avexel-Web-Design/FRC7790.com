/**
 * Login Handler - Effect-based implementation
 */

import { Hono } from "hono"
import { sign } from "hono/jwt"
import { Effect } from "effect"
import { 
  effectHandler, 
  parseBody, 
  ValidationError, 
  AuthError,
  DbError,
  queryOne,
  type Env 
} from "../lib/effect-hono"

// =============================================================================
// Types
// =============================================================================

interface LoginRequest {
  username: string
  password: string
}

interface UserRow {
  id: number
  username: string
  password: string
  is_admin: number
  avatar: string | null
  user_type: string
}

interface LoginResponse {
  token: string
  user: {
    id: number
    username: string
    isAdmin: boolean
    userType: string
  }
  message: string
}

// =============================================================================
// Password Verification
// =============================================================================

/**
 * Verify password using Web Crypto API (SHA-256)
 */
const verifyPassword = (
  password: string, 
  hashedPassword: string
): Effect.Effect<boolean, never, never> =>
  Effect.promise(async () => {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const computedHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
    return computedHash === hashedPassword
  })

// =============================================================================
// Login Effect
// =============================================================================

/**
 * Main login logic as an Effect
 */
const loginEffect = (
  body: LoginRequest,
  jwtSecret: string
): Effect.Effect<LoginResponse, ValidationError | AuthError | DbError, import("../lib/db").D1> =>
  Effect.gen(function* () {
    const { username, password } = body

    // Validate input
    if (!username || !password) {
      return yield* Effect.fail(ValidationError.single("Username and password are required"))
    }

    // Find user
    const user = yield* queryOne<UserRow>(
      "SELECT * FROM users WHERE username = ?",
      username
    )

    if (!user) {
      return yield* Effect.fail(AuthError.invalidCredentials())
    }

    // Verify password
    const validPassword = yield* verifyPassword(password, user.password)
    if (!validPassword) {
      return yield* Effect.fail(AuthError.invalidCredentials())
    }

    // Generate JWT token
    const token = yield* Effect.promise(() => 
      sign(
        {
          id: user.id,
          username: user.username,
          isAdmin: user.is_admin,
          userType: user.user_type,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hours
        },
        jwtSecret
      )
    )

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: !!user.is_admin,
        userType: user.user_type
      },
      message: "Login successful"
    }
  })

// =============================================================================
// Hono Router
// =============================================================================

const login = new Hono<{ Bindings: Env }>()

login.post("/", effectHandler((c) =>
  Effect.gen(function* () {
    const body = yield* parseBody<LoginRequest>(c)
    return yield* loginEffect(body, c.env.JWT_SECRET)
  })
))

export default login
