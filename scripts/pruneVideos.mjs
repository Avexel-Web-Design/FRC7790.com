#!/usr/bin/env node
// Prune video files from dist/ for Cloudflare Pages deployment.
// Cloudflare Pages has a 25MB per-file limit.
// This script removes all video files since they're now embedded via YouTube.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');

if (!fs.existsSync(distDir)) {
  console.error('dist/ not found. Run build first.');
  process.exit(1);
}

const videoExts = new Set(['.mp4', '.webm', '.mov', '.avi']);
let removedFiles = 0;
let removedBytes = 0;

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = bytes;
  while (v > 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return v.toFixed(1) + ' ' + units[i];
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Remove entire videos directory
      if (entry.name === 'videos') {
        const dirSize = getDirSize(full);
        fs.rmSync(full, { recursive: true, force: true });
        removedFiles++;
        removedBytes += dirSize;
        console.log(`Removed directory ${path.relative(distDir, full)} (${formatBytes(dirSize)})`);
        continue;
      }
      walk(full);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (videoExts.has(ext)) {
        const stat = fs.statSync(full);
        fs.unlinkSync(full);
        removedFiles++;
        removedBytes += stat.size;
        console.log(`Removed ${path.relative(distDir, full)} (${formatBytes(stat.size)})`);
      }
    }
  }
}

function getDirSize(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += getDirSize(full);
    } else if (entry.isFile()) {
      total += fs.statSync(full).size;
    }
  }
  return total;
}

walk(distDir);

if (removedFiles > 0) {
  console.log('--- Video Prune Summary ---');
  console.log(`Removed: ${removedFiles} file(s)`);
  console.log(`Freed: ${formatBytes(removedBytes)}`);
} else {
  console.log('No videos to remove.');
}
