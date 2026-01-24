#!/usr/bin/env bun
/**
 * Create an ultra-lean dist/ for remote mode: keeps only a minimal index.html
 * that redirects (or loads) the live site. Removes JS/CSS bundles to shrink
 * packaged assets in Android AAB.
 * Use only when server.url (remote mode) is active. Not for offline usage.
 */

import { existsSync, readdirSync, rmSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'

const root = join(dirname(import.meta.dir), '')
const dist = join(root, 'dist')

if (!existsSync(dist)) {
  console.error('dist/ not found; run build first.')
  process.exit(1)
}

// Remove everything except we will recreate a minimal index.html and offline-landing.html placeholder
for (const entry of readdirSync(dist)) {
  const full = join(dist, entry)
  rmSync(full, { recursive: true, force: true })
}

const remoteUrl = 'https://frc7790.com'
const indexHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Loading...</title><style>html,body{height:100%;margin:0;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#fff;color:#222} .msg{max-width:480px;text-align:center;font-size:16px;line-height:1.4} .spinner{width:40px;height:40px;border:4px solid #eee;border-top-color:#ff6b00;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class="msg"><div class="spinner"></div><div>Loading live FRC hub...</div><noscript>Please enable JavaScript.</noscript></div><script>location.replace('${remoteUrl}'+location.pathname+location.search+location.hash);</script></body></html>`

writeFileSync(join(dist, 'index.html'), indexHtml)
writeFileSync(join(dist, 'offline-landing.html'), '<!doctype html><meta charset="utf-8"><title>Offline</title><body>Offline – reconnect to load live content.</body>')

console.log('✅ Ultra-lean dist generated (remote shell).')
