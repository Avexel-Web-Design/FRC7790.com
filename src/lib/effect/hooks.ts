/**
 * Effect Library - React Hooks
 * 
 * Provides React hooks for running Effects and managing async state.
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { Effect, Exit, Cause } from "effect"

// =============================================================================
// Types
// =============================================================================

export type EffectStatus = "idle" | "loading" | "success" | "error"

export interface EffectResult<A, E> {
  status: EffectStatus
  data: A | undefined
  error: E | undefined
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  refetch: () => void
}

// =============================================================================
// Runtime Configuration
// =============================================================================

// =============================================================================
// Hooks
// =============================================================================

/**
 * Run an Effect and manage its lifecycle with React state
 * 
 * @example
 * ```tsx
 * function ProfileComponent() {
 *   const { data, isLoading, error, refetch } = useEffectQuery(
 *     () => httpGet<User>("/profile"),
 *     []
 *   )
 *   
 *   if (isLoading) return <Spinner />
 *   if (error) return <ErrorMessage error={error} />
 *   return <UserProfile user={data!} />
 * }
 * ```
 */
export function useEffectQuery<A, E>(
  effectFn: () => Effect.Effect<A, E, never>,
  deps: readonly unknown[] = []
): EffectResult<A, E> {
  const [status, setStatus] = useState<EffectStatus>("idle")
  const [data, setData] = useState<A | undefined>(undefined)
  const [error, setError] = useState<E | undefined>(undefined)
  const mountedRef = useRef(true)
  
  const run = useCallback(() => {
    setStatus("loading")
    setError(undefined)
    
    const effect = effectFn()
    
    Effect.runPromiseExit(effect).then((exit) => {
      if (!mountedRef.current) return
      
      if (Exit.isSuccess(exit)) {
        setData(exit.value)
        setStatus("success")
      } else {
        const failure = Cause.failureOption(exit.cause)
        if (failure._tag === "Some") {
          setError(failure.value as E)
        }
        setStatus("error")
      }
    })
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  
  useEffect(() => {
    mountedRef.current = true
    run()
    
    return () => {
      mountedRef.current = false
    }
  }, [run])
  
  return {
    status,
    data,
    error,
    isLoading: status === "loading",
    isSuccess: status === "success",
    isError: status === "error",
    refetch: run
  }
}

/**
 * Create a mutation function that runs an Effect
 * 
 * @example
 * ```tsx
 * function LoginForm() {
 *   const { mutate, isLoading, error } = useEffectMutation(
 *     (credentials: Credentials) => login(credentials)
 *   )
 *   
 *   const handleSubmit = () => {
 *     mutate({ username, password })
 *       .then(result => {
 *         if (result.success) navigate("/dashboard")
 *       })
 *   }
 *   
 *   return <form onSubmit={handleSubmit}>...</form>
 * }
 * ```
 */
export function useEffectMutation<A, E, Args extends readonly unknown[]>(
  effectFn: (...args: Args) => Effect.Effect<A, E, never>
): {
  mutate: (...args: Args) => Promise<{ success: true; data: A } | { success: false; error: E }>
  isLoading: boolean
  error: E | undefined
  reset: () => void
} {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<E | undefined>(undefined)
  
  const mutate = useCallback(async (...args: Args) => {
    setIsLoading(true)
    setError(undefined)
    
    try {
      const effect = effectFn(...args)
      const exit = await Effect.runPromiseExit(effect)
      
      if (Exit.isSuccess(exit)) {
        setIsLoading(false)
        return { success: true as const, data: exit.value }
      } else {
        const failure = Cause.failureOption(exit.cause)
        const err = failure._tag === "Some" ? failure.value as E : undefined
        setError(err)
        setIsLoading(false)
        return { success: false as const, error: err! }
      }
    } catch (e) {
      setIsLoading(false)
      throw e
    }
  }, [effectFn])
  
  const reset = useCallback(() => {
    setError(undefined)
    setIsLoading(false)
  }, [])
  
  return { mutate, isLoading, error, reset }
}

/**
 * Run an Effect with browser services already provided
 * 
 * @example
 * ```ts
 * const result = await runEffect(httpGet<User>("/profile"))
 * ```
 */
export function runEffect<A, E>(
  effect: Effect.Effect<A, E, never>
): Promise<A> {
  return Effect.runPromise(effect)
}

/**
 * Run an Effect and return the Exit (success or failure)
 */
export function runEffectExit<A, E>(
  effect: Effect.Effect<A, E, never>
): Promise<Exit.Exit<A, E>> {
  return Effect.runPromiseExit(effect)
}
