#!/usr/bin/env node
/**
 * Automated Android release pipeline:
 * 1. Build web assets (remote mode by default)
 * 2. Prune large static media (keeps bundle lean)
 * 3. Copy & sync Capacitor Android project
 * 4. Run Gradle clean bundleRelease to produce AAB
 *
 * Usage:
 *   npm run android:release
 * Optional env:
 *   PRUNE_IMAGE_THRESHOLD_KB=600 npm run android:release
 *   SKIP_PRUNE=1 npm run android:release (keeps all assets)
 *   DRY_RUN=1 npm run android:release (build only + report)
 *   CAP_USE_BUNDLED=1 npm run android:release (forces bundled mode – expect larger AAB)
 */

import { spawnSync, type SpawnSyncReturns } from 'child_process'
import { existsSync } from 'fs'
import { join, dirname, isAbsolute } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const root = join(__dirname, '..')
const isWin = process.platform === 'win32'

function run(cmd: string, args: string[], opts: { cwd?: string } = {}): void {
  console.log(`\n> ${cmd} ${args.join(' ')}`)
  // Use shell on Windows for *.cmd / *.bat to avoid EINVAL
  const useShell = isWin && /\.(cmd|bat)$/i.test(cmd)
  let res: SpawnSyncReturns<string> = spawnSync(cmd, args, { 
    stdio: 'inherit', 
    cwd: opts.cwd || root, 
    shell: useShell,
    encoding: 'utf8'
  })
  
  if (res.error) {
    // Fallback: only try via cmd.exe /c for .cmd/.bat (NOT arbitrary paths like process.execPath)
    if (isWin && /\.(cmd|bat)$/i.test(cmd) && !isAbsolute(cmd)) {
      console.log(`↺ Retry via cmd.exe /c ${cmd}`)
      res = spawnSync('cmd.exe', ['/c', cmd, ...args], { 
        stdio: 'inherit', 
        cwd: opts.cwd || root, 
        shell: false,
        encoding: 'utf8'
      })
    } else if (isWin) {
      // Directly execute, avoid shell parsing of absolute paths
      console.log(`↺ Direct retry (no shell) for ${cmd}`)
      res = spawnSync(cmd, args, { 
        stdio: 'inherit', 
        cwd: opts.cwd || root, 
        shell: false,
        encoding: 'utf8'
      })
    }
  }
  
  if (res.error) {
    // Secondary fallback for npm/npx using npm_execpath
    if ((cmd === 'npm.cmd' || cmd === 'npx.cmd') && process.env.npm_execpath) {
      const cli = process.env.npm_execpath
      console.log(`↺ Fallback via bun ${cli}`)
      const nodeArgs = [cli, ...args]
      res = spawnSync(process.execPath, nodeArgs, { 
        stdio: 'inherit', 
        cwd: opts.cwd || root, 
        shell: false,
        encoding: 'utf8'
      })
    }
  }
  
  if (res.error) {
    console.error(`✖ Failed to start ${cmd}:`, res.error.message)
    console.error(' cwd:', opts.cwd || root)
    process.exit(1)
  }
  if (res.status !== 0) {
    console.error(`✖ Command exited with code ${res.status}`)
    process.exit(res.status || 1)
  }
}

console.log('=== Android Release Pipeline ===')
if (process.env.CAP_USE_BUNDLED === '1') {
  console.warn('⚠ CAP_USE_BUNDLED=1 set: large media will inflate AAB. Consider unsetting for slim build.')
}
if (process.env.DRY_RUN === '1') {
  console.warn('⚠ DRY_RUN enabled: pruning & Gradle bundle will be skipped after build.')
}
console.log(`Env flags: LEAN_DIST=${process.env.LEAN_DIST || ''} SKIP_PRUNE=${process.env.SKIP_PRUNE || ''} DRY_RUN=${process.env.DRY_RUN || ''}`)

// Resolve commands - use npm for cross-platform compatibility
const npmCmd = isWin ? 'npm.cmd' : 'npm'
const npxCmd = isWin ? 'npx.cmd' : 'npx'

// 1. Build web
run(npmCmd, ['run', 'build'])

// 2. Prune (unless skipped)
if (process.env.DRY_RUN !== '1') {
  if (process.env.LEAN_DIST === '1') {
    console.log('LEAN_DIST=1: Generating ultra-lean dist (remote shell)')
    run(npxCmd, ['tsx', 'scripts/minifyDistForRemote.ts'])
  }
  if (process.env.SKIP_PRUNE === '1') {
    console.log('Skipping prune (SKIP_PRUNE=1)')
  } else {
    run(npmCmd, ['run', 'prune:dist'])
  }
} else {
  console.log('Skipping pruning/minify (DRY_RUN)')
}

// 3. Copy & sync
run(npxCmd, ['cap', 'copy', 'android'])
run(npxCmd, ['cap', 'sync', 'android'])

if (process.env.DRY_RUN === '1') {
  console.log('DRY_RUN complete (no Gradle build).')
  process.exit(0)
}

// 4. Gradle bundleRelease
const androidDir = join(root, 'android')
if (!existsSync(androidDir)) {
  console.error('Android directory missing. Did you run bunx cap add android?')
  process.exit(1)
}
const gradleCmd = isWin ? 'gradlew.bat' : './gradlew'
run(gradleCmd, ['clean', 'bundleRelease'], { cwd: androidDir })

console.log('\n✅ Release build complete. AAB output should be under android/app/build/outputs/bundle/release/')
console.log('   Upload the .aab to Play Console.')
