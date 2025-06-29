// Environment bindings for Cloudflare Workers
interface CloudflareEnv {
  DB: D1Database;
  JWT_SECRET: string;
}

declare global {
  namespace CloudflareBindings {
    const DB: D1Database;
    const JWT_SECRET: string;
  }
}

export {};
