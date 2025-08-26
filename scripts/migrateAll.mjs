#!/usr/bin/env node
// Simple migration runner for Cloudflare D1 using Wrangler.
// Tracks applied migrations inside the database so you can run it repeatedly.
// Usage:
//   node scripts/migrateAll.mjs            # defaults to dev DB
//   node scripts/migrateAll.mjs dev        # explicit dev
//   node scripts/migrateAll.mjs prod --remote  # production (with --remote)
//   npm run db:migrate:dev:all             # via package.json script
//
import { readdirSync } from 'fs';
import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const MIGRATIONS_DIR = 'migrations';
const DB_DEV = 'frc7790-com-dev';
const DB_PROD = 'frc7790-com';

const args = process.argv.slice(2);
const env = (args[0] && !args[0].startsWith('-')) ? args[0] : 'dev';
const remoteFlag = args.includes('--remote');

const dbName = env === 'prod' ? DB_PROD : DB_DEV;
console.log(`➡️  Applying migrations to ${dbName}${remoteFlag ? ' (remote)' : ' (local)'}...`);

// Use plain 'wrangler' relying on npm-run PATH injection (simpler + works cross-platform)
const wranglerBin = 'wrangler';

const run = (label, argsArray) => {
  let res = spawnSync(wranglerBin, argsArray, { encoding: 'utf8' });
  if (res.error && res.error.code === 'ENOENT') {
    // Fallback to npx
    res = spawnSync('npx', ['--yes', 'wrangler', ...argsArray], { encoding: 'utf8' });
  }
  if (res.error) {
    console.error(`✖ ${label} failed:`, res.error.message);
    process.exit(1);
  }
  if (res.status !== 0) {
    if (res.stdout) console.error(res.stdout.trim());
    if (res.stderr) console.error(res.stderr.trim());
    console.error(`✖ ${label} failed (${label})`);
    process.exit(res.status);
  }
  return res.stdout;
};

// Ensure tracking table exists
run('Create schema_migrations table', [
  'd1','execute', dbName, ...(remoteFlag?['--remote']:[]), '--command',
  'CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TEXT DEFAULT CURRENT_TIMESTAMP);'
]);

// Gather migrations (sorted lexicographically which matches numbering)
const migrations = readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort((a,b)=> a.localeCompare(b));

let appliedCount = 0;
for (const file of migrations) {
  // Check if already applied
  const checkOut = run(`Check ${file}`, [
    'd1','execute', dbName, ...(remoteFlag?['--remote']:[]), '--command',
    `SELECT filename FROM schema_migrations WHERE filename='${file}'`]);
  if (checkOut.includes(file)) {
    console.log(`↷ Skipping already applied: ${file}`);
    continue;
  }
  // Skip re-applying 001_initial_schema if core tables already exist (users)
  if (file.startsWith('001_')) {
    const tableCheck = run('Check existing users table', [
      'd1','execute', dbName, ...(remoteFlag?['--remote']:[]), '--command',
      'SELECT name FROM sqlite_master WHERE type="table" AND name="users"'
    ]);
    if (tableCheck.toLowerCase().includes('users')) {
      console.log('↷ Detected existing users table; skipping 001_initial_schema.sql');
      run('Record 001_initial_schema.sql', [
        'd1','execute', dbName, ...(remoteFlag?['--remote']:[]), '--command',
        `INSERT OR IGNORE INTO schema_migrations(filename) VALUES ('${file}')`
      ]);
      continue;
    }
  }
  console.log(`→ Applying ${file}`);
  run(`Apply ${file}`, [
    'd1','execute', dbName, ...(remoteFlag?['--remote']:[]), '--file', `${MIGRATIONS_DIR}/${file}`
  ]);
  run(`Record ${file}`, [
    'd1','execute', dbName, ...(remoteFlag?['--remote']:[]), '--command',
    `INSERT INTO schema_migrations(filename) VALUES ('${file}')`
  ]);
  appliedCount++;
}

console.log(`✅ Migrations complete. Newly applied: ${appliedCount}. Total files: ${migrations.length}.`);
