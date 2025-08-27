#!/usr/bin/env node
// Prune large static assets from the built dist/ folder to shrink Android AAB size.
// Intended for remote (server.url) mode where the app loads live assets over HTTPS.
// Keeps small essentials (favicon/logo) but removes:
//   - All .mp4, .webm, .mp3, .wav
//   - Large images (png/jpg/webp/avif) above threshold (default 750 KB)
//   - "hi-res" and "videos" subdirectories entirely
// Usage:
//   node scripts/pruneDist.mjs          # uses defaults
// Env:
//   PRUNE_IMAGE_THRESHOLD_KB=500        # adjust threshold
//   DRY_RUN=1                           # only report, do not delete

import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// scripts/ is at projectRoot/scripts, so root is one level up from __dirname
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
if (!fs.existsSync(distDir)) {
  console.error('dist/ not found. Run build first.');
  process.exit(1);
}

const dryRun = process.env.DRY_RUN === '1';
const imgThresholdKB = parseInt(process.env.PRUNE_IMAGE_THRESHOLD_KB || '750', 10); // ~0.75MB default

const extsRemoveAlways = new Set(['.mp4', '.webm', '.mp3', '.wav']);
const imgExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif']);
const dirNamesRemove = ['videos', 'hi-res'];

let removedFiles = 0;
let removedBytes = 0;
let keptLarge = 0;

function formatBytes(bytes) {
  const units = ['B','KB','MB','GB'];
  let i=0; let v=bytes;
  while (v>1024 && i<units.length-1){ v/=1024; i++; }
  return v.toFixed(1)+' '+units[i];
}

function shouldRemove(filePath, stat){
  const rel = path.relative(distDir, filePath);
  const base = path.basename(filePath);
  const dirParts = rel.split(/[/\\]/);
  if (dirParts.some(p => dirNamesRemove.includes(p))) return true;
  const ext = path.extname(base).toLowerCase();
  if (extsRemoveAlways.has(ext)) return true;
  if (imgExts.has(ext)) {
    if (stat.size > imgThresholdKB * 1024) return true;
  }
  return false;
}

function walk(dir){
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (dirNamesRemove.includes(entry.name)) {
        // remove whole directory
        const dirSize = getDirSize(full);
        if (!dryRun) fs.rmSync(full, { recursive: true, force: true });
        removedFiles++;
        removedBytes += dirSize;
        console.log(`Removed directory ${path.relative(distDir, full)} (${formatBytes(dirSize)})`);
        continue;
      }
      walk(full);
    } else if (entry.isFile()) {
      const stat = fs.statSync(full);
      if (shouldRemove(full, stat)) {
        if (!dryRun) fs.unlinkSync(full);
        removedFiles++;
        removedBytes += stat.size;
        console.log(`Removed ${path.relative(distDir, full)} (${formatBytes(stat.size)})`);
      } else {
        // track large kept files for awareness
        if (stat.size > imgThresholdKB * 1024 && imgExts.has(path.extname(entry.name).toLowerCase())) {
          keptLarge++;
        }
      }
    }
  }
}

function getDirSize(dir){
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += getDirSize(full); else if (entry.isFile()) total += fs.statSync(full).size;
  }
  return total;
}

function computeTotal(){
  let total=0; walkSize(distDir); return total;
  function walkSize(d){
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) walkSize(f); else if (e.isFile()) total += fs.statSync(f).size;
    }
  }
}

const beforeBytes = computeTotal();
walk(distDir);
const afterBytes = computeTotal();

console.log('--- Summary ---');
console.log(`Removed files/dirs: ${removedFiles}`);
console.log(`Removed size: ${formatBytes(removedBytes)}`);
console.log(`Remaining dist size: ${formatBytes(afterBytes)} (was ${formatBytes(beforeBytes)})`);
if (keptLarge) console.log(`Note: ${keptLarge} large images kept below threshold.`);
if (dryRun) console.log('Dry run mode: no deletions actually performed.');
