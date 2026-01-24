/**
 * Effect Library for Cloudflare Workers - D1 Database Service
 * 
 * Provides a type-safe Effect-based interface for D1 database operations.
 */

import { Effect, Context, Layer } from "effect"
import { DbError } from "./errors"

// =============================================================================
// Types
// =============================================================================

/**
 * D1 Database binding type (from Cloudflare)
 */
export interface D1Database {
  prepare(query: string): D1PreparedStatement
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
  exec(query: string): Promise<D1ExecResult>
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(colName?: string): Promise<T | null>
  run(): Promise<D1Result<unknown>>
  all<T = unknown>(): Promise<D1Result<T>>
  raw<T = unknown>(): Promise<T[]>
}

export interface D1Result<T = unknown> {
  results?: T[]
  success: boolean
  meta: {
    duration: number
    changes: number
    last_row_id: number
    served_by: string
    internal_stats: null
  }
}

export interface D1ExecResult {
  count: number
  duration: number
}

// =============================================================================
// D1 Service Definition
// =============================================================================

/**
 * D1 Database Service interface
 */
export interface D1Service {
  /**
   * Query multiple rows
   */
  readonly query: <T>(
    sql: string,
    ...params: unknown[]
  ) => Effect.Effect<T[], DbError>
  
  /**
   * Query a single row
   */
  readonly queryOne: <T>(
    sql: string,
    ...params: unknown[]
  ) => Effect.Effect<T | null, DbError>
  
  /**
   * Execute a statement (INSERT, UPDATE, DELETE)
   */
  readonly execute: (
    sql: string,
    ...params: unknown[]
  ) => Effect.Effect<{ changes: number; lastRowId: number }, DbError>
  
  /**
   * Execute multiple statements in a batch
   */
  readonly batch: <T>(
    statements: Array<{ sql: string; params: unknown[] }>
  ) => Effect.Effect<T[][], DbError>
}

/**
 * D1 Service Context Tag
 */
export class D1 extends Context.Tag("D1")<D1, D1Service>() {}

// =============================================================================
// D1 Service Implementation
// =============================================================================

/**
 * Create a D1 service layer from a D1 database binding
 */
export const makeD1Service = (db: D1Database): D1Service => ({
  query: <T>(sql: string, ...params: unknown[]) =>
    Effect.tryPromise({
      try: async () => {
        const stmt = params.length > 0 
          ? db.prepare(sql).bind(...params)
          : db.prepare(sql)
        const result = await stmt.all<T>()
        return result.results || []
      },
      catch: (error) => DbError.fromUnknown(error, "query")
    }),
  
  queryOne: <T>(sql: string, ...params: unknown[]) =>
    Effect.tryPromise({
      try: async () => {
        const stmt = params.length > 0 
          ? db.prepare(sql).bind(...params)
          : db.prepare(sql)
        return await stmt.first<T>()
      },
      catch: (error) => DbError.fromUnknown(error, "queryOne")
    }),
  
  execute: (sql: string, ...params: unknown[]) =>
    Effect.tryPromise({
      try: async () => {
        const stmt = params.length > 0 
          ? db.prepare(sql).bind(...params)
          : db.prepare(sql)
        const result = await stmt.run()
        return {
          changes: result.meta.changes,
          lastRowId: result.meta.last_row_id
        }
      },
      catch: (error) => DbError.fromUnknown(error, "execute")
    }),
  
  batch: <T>(statements: Array<{ sql: string; params: unknown[] }>) =>
    Effect.tryPromise({
      try: async () => {
        const prepared = statements.map(({ sql, params }) =>
          params.length > 0 
            ? db.prepare(sql).bind(...params)
            : db.prepare(sql)
        )
        const results = await db.batch<T>(prepared)
        return results.map(r => r.results || [])
      },
      catch: (error) => DbError.fromUnknown(error, "batch")
    })
})

/**
 * Create a D1 service layer
 */
export const D1Live = (db: D1Database) => 
  Layer.succeed(D1, makeD1Service(db))

// =============================================================================
// Helper Effects
// =============================================================================

/**
 * Query multiple rows from the database
 */
export const query = <T>(
  sql: string,
  ...params: unknown[]
): Effect.Effect<T[], DbError, D1> =>
  Effect.gen(function* () {
    const db = yield* D1
    return yield* db.query<T>(sql, ...params)
  })

/**
 * Query a single row from the database
 */
export const queryOne = <T>(
  sql: string,
  ...params: unknown[]
): Effect.Effect<T | null, DbError, D1> =>
  Effect.gen(function* () {
    const db = yield* D1
    return yield* db.queryOne<T>(sql, ...params)
  })

/**
 * Execute a statement (INSERT, UPDATE, DELETE)
 */
export const execute = (
  sql: string,
  ...params: unknown[]
): Effect.Effect<{ changes: number; lastRowId: number }, DbError, D1> =>
  Effect.gen(function* () {
    const db = yield* D1
    return yield* db.execute(sql, ...params)
  })

/**
 * Execute multiple statements in a batch
 */
export const batch = <T>(
  statements: Array<{ sql: string; params: unknown[] }>
): Effect.Effect<T[][], DbError, D1> =>
  Effect.gen(function* () {
    const db = yield* D1
    return yield* db.batch<T>(statements)
  })
