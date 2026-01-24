#!/usr/bin/env bun
/**
 * Prune large static assets from the built dist/ folder to shrink Android AAB size.
 * Intended for remote (server.url) mode where the app loads live assets over HTTPS.
 * Keeps small essentials (favicon/logo) but removes:
 *   - All .mp4, .webm, .mp3, .wav
 *   - Large images (png/jpg/webp/avif) above threshold (default 750 KB)
 *   - "hi-res" and "videos" subdirectories entirely
 * Usage:
 *   bun run scripts/pruneDist.ts          # uses defaults
 * Env:
 *   PRUNE_IMAGE_THRESHOLD_KB=500        # adjust threshold
 *   DRY_RUN=1                           # only report, do not delete
 */

import { existsSync, readdirSync, statSync, unlinkSync, rmSync, type Stats } from 'fs'
import { join, dirname, extname, relative, basename } from 'path'

const root = join(dirname(import.meta.dir), '')
const distDir = join(root, 'dist')

if (!existsSync(distDir)) {
  console.error('dist/ not found. Run build first.')
  process.exit(1)
}

const dryRun = process.env.DRY_RUN === '1'
const imgThresholdKB = parseInt(process.env.PRUNE_IMAGE_THRESHOLD_KB || '750', 10) // ~0.75MB default

const extsRemoveAlways = new Set(['.mp4', '.webm', '.mp3', '.wav'])
const imgExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif'])
const dirNamesRemove = ['videos', 'hi-res']

let removedFiles = 0
let removedBytes = 0
let keptLarge = 0

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let v = bytes
  while (v > 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return v.toFixed(1) + ' ' + units[i]
}

function shouldRemove(filePath: string, stat: Stats): boolean {
  const rel = relative(distDir, filePath)
  const base = basename(filePath)
  const dirParts = rel.split(/[/\\]/)
  if (dirParts.some(p => dirNamesRemove.includes(p))) return true
  const ext = extname(base).toLowerCase()
  if (extsRemoveAlways.has(ext)) return true
  if (imgExts.has(ext)) {
    if (stat.size > imgThresholdKB * 1024) return true
  }
  return false
}

function getDirSize(dir: string): number {
  let total = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      total += getDirSize(full)
    } else if (entry.isFile()) {
      total += statSync(full).size
    }
  }
  return total
}

function walk(dir: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (dirNamesRemove.includes(entry.name)) {
        // remove whole directory
        const dirSize = getDirSize(full)
        if (!dryRun) rmSync(full, { recursive: true, force: true })
        removedFiles++
        removedBytes += dirSize
        console.log(`Removed directory ${relative(distDir, full)} (${formatBytes(dirSize)})`)
        continue
      }
      walk(full)
    } else if (entry.isFile()) {
      const stat = statSync(full)
      if (shouldRemove(full, stat)) {
        if (!dryRun) unlinkSync(full)
        removedFiles++
        removedBytes += stat.size
        console.log(`Removed ${relative(distDir, full)} (${formatBytes(stat.size)})`)
      } else {
        // track large kept files for awareness
        if (stat.size > imgThresholdKB * 1024 && imgExts.has(extname(entry.name).toLowerCase())) {
          keptLarge++
        }
      }
    }
  }
}

function computeTotal(): number {
  let total = 0
  function walkSize(d: string): void {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const f = join(d, e.name)
      if (e.isDirectory()) walkSize(f)
      else if (e.isFile()) total += statSync(f).size
    }
  }
  walkSize(distDir)
  return total
}

const beforeBytes = computeTotal()
walk(distDir)
const afterBytes = computeTotal()

console.log('--- Summary ---')
console.log(`Removed files/dirs: ${removedFiles}`)
console.log(`Removed size: ${formatBytes(removedBytes)}`)
console.log(`Remaining dist size: ${formatBytes(afterBytes)} (was ${formatBytes(beforeBytes)})`)
if (keptLarge) console.log(`Note: ${keptLarge} large images kept below threshold.`)
if (dryRun) console.log('Dry run mode: no deletions actually performed.')
