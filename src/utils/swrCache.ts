/**
 * SWR Cache Provider with localStorage persistence
 * 
 * This cache provider persists SWR cache to localStorage for:
 * - Instant loading on return visits
 * - Offline-first capabilities
 * - Separate handling for permanent (historical) vs ephemeral data
 */

import { CACHE_CONFIG } from '../config';

const CACHE_VERSION = 'v1';
const CACHE_KEY_PREFIX = `swr_cache_${CACHE_VERSION}:`;
const PERMANENT_CACHE_KEY = `swr_permanent_${CACHE_VERSION}`;

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number; // TTL in ms, Infinity for permanent
}

// Keys that should be cached permanently (historical data)
function isPermanentKey(key: string): boolean {
  // Historical team events (past years)
  if (key.includes('/team/frc') && key.includes('/events')) {
    const yearMatch = key.match(/\/events\/(\d{4})/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      const currentYear = new Date().getFullYear();
      return year < currentYear;
    }
    // All-time events endpoint (no year) - treated as historical
    if (key.match(/\/events$/)) return true;
  }
  
  // Historical awards
  if (key.includes('/awards') && !key.includes(new Date().getFullYear().toString())) {
    return true;
  }
  
  // Team basic info
  if (key.match(/\/team\/frc\d+$/) && !key.includes('/event')) {
    return true;
  }
  
  return false;
}

// Get TTL for a cache key
function getTTLForKey(key: string): number {
  if (isPermanentKey(key)) {
    return CACHE_CONFIG.HISTORICAL_TTL;
  }
  
  // Current year events
  if (key.includes('/events/') && key.includes(new Date().getFullYear().toString())) {
    return CACHE_CONFIG.CURRENT_EVENTS_TTL;
  }
  
  // Rankings and matches (live data)
  if (key.includes('/rankings') || key.includes('/matches')) {
    return CACHE_CONFIG.LIVE_DATA_TTL;
  }
  
  // Team status at event
  if (key.includes('/status')) {
    return CACHE_CONFIG.LIVE_DATA_TTL;
  }
  
  return CACHE_CONFIG.DEFAULT_TTL;
}

// Load permanent cache from localStorage
function loadPermanentCache(): Map<string, CacheEntry> {
  try {
    const stored = localStorage.getItem(PERMANENT_CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Map(Object.entries(parsed));
    }
  } catch (e) {
    console.warn('Failed to load permanent cache:', e);
  }
  return new Map();
}

// Save permanent cache to localStorage
function savePermanentCache(cache: Map<string, CacheEntry>): void {
  try {
    const obj: Record<string, CacheEntry> = {};
    cache.forEach((value, key) => {
      if (value.ttl === Infinity || value.ttl > CACHE_CONFIG.TEAM_INFO_TTL) {
        obj[key] = value;
      }
    });
    localStorage.setItem(PERMANENT_CACHE_KEY, JSON.stringify(obj));
  } catch (e) {
    console.warn('Failed to save permanent cache:', e);
    // Try to clear old cache if storage is full
    try {
      cleanupOldCache();
    } catch {}
  }
}

// Load ephemeral cache from sessionStorage
function loadEphemeralCache(): Map<string, CacheEntry> {
  try {
    const stored = sessionStorage.getItem(CACHE_KEY_PREFIX + 'ephemeral');
    if (stored) {
      const parsed = JSON.parse(stored);
      const map = new Map<string, CacheEntry>(Object.entries(parsed));
      
      // Filter out expired entries
      const now = Date.now();
      const filtered = new Map<string, CacheEntry>();
      map.forEach((entry, key) => {
        if (entry.ttl === Infinity || now - entry.timestamp < entry.ttl) {
          filtered.set(key, entry);
        }
      });
      return filtered;
    }
  } catch (e) {
    console.warn('Failed to load ephemeral cache:', e);
  }
  return new Map();
}

// Save ephemeral cache to sessionStorage
function saveEphemeralCache(cache: Map<string, CacheEntry>): void {
  try {
    const obj: Record<string, CacheEntry> = {};
    const now = Date.now();
    cache.forEach((value, key) => {
      // Only save non-permanent, non-expired entries
      if (value.ttl !== Infinity && value.ttl <= CACHE_CONFIG.TEAM_INFO_TTL) {
        if (now - value.timestamp < value.ttl) {
          obj[key] = value;
        }
      }
    });
    sessionStorage.setItem(CACHE_KEY_PREFIX + 'ephemeral', JSON.stringify(obj));
  } catch (e) {
    console.warn('Failed to save ephemeral cache:', e);
  }
}

// Cleanup old cache versions
function cleanupOldCache(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('swr_cache_') || key.startsWith('swr_permanent_')) && !key.includes(CACHE_VERSION)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * Creates an SWR cache provider with localStorage/sessionStorage persistence
 */
export function createSWRCacheProvider() {
  // Clean up old versions on startup
  cleanupOldCache();
  
  // Initialize cache from storage
  const permanentCache = loadPermanentCache();
  const ephemeralCache = loadEphemeralCache();
  
  // Merge into a single Map for SWR
  const cache = new Map<string, unknown>();
  
  // Load permanent entries first
  permanentCache.forEach((entry, key) => {
    cache.set(key, entry.data);
  });
  
  // Load ephemeral entries (may override permanent if more recent)
  const now = Date.now();
  ephemeralCache.forEach((entry, key) => {
    if (entry.ttl === Infinity || now - entry.timestamp < entry.ttl) {
      cache.set(key, entry.data);
    }
  });
  
  // Track entries with metadata
  const metadata = new Map<string, CacheEntry>();
  permanentCache.forEach((entry, key) => metadata.set(key, entry));
  ephemeralCache.forEach((entry, key) => metadata.set(key, entry));
  
  // Save initial state
  savePermanentCache(metadata);
  saveEphemeralCache(metadata);
  
  return () => cache;
}

/**
 * Wrapper to set cache entry with proper TTL tracking
 */
export function setCacheEntry(key: string, data: unknown): CacheEntry {
  const ttl = getTTLForKey(key);
  return {
    data,
    timestamp: Date.now(),
    ttl,
  };
}

/**
 * Check if a cache entry is still valid
 */
export function isCacheValid(entry: CacheEntry | undefined): boolean {
  if (!entry) return false;
  if (entry.ttl === Infinity) return true;
  return Date.now() - entry.timestamp < entry.ttl;
}

/**
 * Get the revalidation interval for a key (for SWR refreshInterval)
 */
export function getRevalidateInterval(key: string): number {
  const ttl = getTTLForKey(key);
  if (ttl === Infinity) return 0; // Never auto-revalidate
  return ttl;
}

/**
 * Manual cache utilities for components that need direct access
 */
export const cacheUtils = {
  /**
   * Get cached data directly from localStorage
   */
  get<T>(key: string): T | null {
    try {
      // Check permanent cache first
      const permanent = localStorage.getItem(PERMANENT_CACHE_KEY);
      if (permanent) {
        const parsed = JSON.parse(permanent);
        if (parsed[key]) {
          const entry = parsed[key] as CacheEntry<T>;
          if (isCacheValid(entry)) {
            return entry.data;
          }
        }
      }
      
      // Check ephemeral cache
      const ephemeral = sessionStorage.getItem(CACHE_KEY_PREFIX + 'ephemeral');
      if (ephemeral) {
        const parsed = JSON.parse(ephemeral);
        if (parsed[key]) {
          const entry = parsed[key] as CacheEntry<T>;
          if (isCacheValid(entry)) {
            return entry.data;
          }
        }
      }
    } catch (e) {
      console.warn('Cache get error:', e);
    }
    return null;
  },
  
  /**
   * Set cached data directly to localStorage
   */
  set<T>(key: string, data: T): void {
    try {
      const entry = setCacheEntry(key, data);
      
      if (entry.ttl === Infinity || entry.ttl > CACHE_CONFIG.TEAM_INFO_TTL) {
        // Save to permanent cache
        const permanent = localStorage.getItem(PERMANENT_CACHE_KEY);
        const parsed = permanent ? JSON.parse(permanent) : {};
        parsed[key] = entry;
        localStorage.setItem(PERMANENT_CACHE_KEY, JSON.stringify(parsed));
      } else {
        // Save to ephemeral cache
        const ephemeral = sessionStorage.getItem(CACHE_KEY_PREFIX + 'ephemeral');
        const parsed = ephemeral ? JSON.parse(ephemeral) : {};
        parsed[key] = entry;
        sessionStorage.setItem(CACHE_KEY_PREFIX + 'ephemeral', JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn('Cache set error:', e);
    }
  },
  
  /**
   * Clear all SWR cache
   */
  clear(): void {
    try {
      localStorage.removeItem(PERMANENT_CACHE_KEY);
      sessionStorage.removeItem(CACHE_KEY_PREFIX + 'ephemeral');
    } catch (e) {
      console.warn('Cache clear error:', e);
    }
  },
};
