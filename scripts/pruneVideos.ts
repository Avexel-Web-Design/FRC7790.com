#!/usr/bin/env bun
/**
 * Prune video files from dist/ for Cloudflare Pages deployment.
 * Cloudflare Pages has a 25MB per-file limit.
 * This script removes all video files since they're now embedded via YouTube.
 */

import { existsSync, readdirSync, statSync, unlinkSync, rmSync } from 'fs'
import { join, dirname, extname, relative } from 'path'

const root = join(dirname(import.meta.dir), '')
const distDir = join(root, 'dist')

if (!existsSync(distDir)) {
  console.error('dist/ not found. Run build first.')
  process.exit(1)
}

const videoExts = new Set(['.mp4', '.webm', '.mov', '.avi'])
let removedFiles = 0
let removedBytes = 0

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
      // Remove entire videos directory
      if (entry.name === 'videos') {
        const dirSize = getDirSize(full)
        rmSync(full, { recursive: true, force: true })
        removedFiles++
        removedBytes += dirSize
        console.log(`Removed directory ${relative(distDir, full)} (${formatBytes(dirSize)})`)
        continue
      }
      walk(full)
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase()
      if (videoExts.has(ext)) {
        const stat = statSync(full)
        unlinkSync(full)
        removedFiles++
        removedBytes += stat.size
        console.log(`Removed ${relative(distDir, full)} (${formatBytes(stat.size)})`)
      }
    }
  }
}

walk(distDir)

if (removedFiles > 0) {
  console.log('--- Video Prune Summary ---')
  console.log(`Removed: ${removedFiles} file(s)`)
  console.log(`Freed: ${formatBytes(removedBytes)}`)
} else {
  console.log('No videos to remove.')
}
