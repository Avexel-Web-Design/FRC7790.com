// Simple API debug logger to help diagnose native/emulator routing
// Enable by setting localStorage.setItem('apiDebug', '1')

export type ApiRequestLog = {
  time: string;
  method: string;
  path: string;
  host: string;
  status: number | 'error';
  ok: boolean;
  error?: string;
};

const logs: ApiRequestLog[] = [];
let lastHost: string | null = null;
let lastStatus: number | 'error' | null = null;

export function isApiDebugEnabled(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('apiDebug') === '1';
  } catch {
    return false;
  }
}

export function recordApiLog(entry: ApiRequestLog) {
  logs.push(entry);
  lastHost = entry.host;
  lastStatus = entry.status;
  // Keep only last 100
  if (logs.length > 100) logs.shift();
  if (isApiDebugEnabled()) {
    // eslint-disable-next-line no-console
    console.debug('[API]', entry.method, entry.path, '->', entry.host, entry.status, entry.ok ? 'OK' : 'FAIL');
  }
  // Expose on window for quick inspection
  try {
    // @ts-ignore
    if (typeof window !== 'undefined') window.__API_DEBUG__ = { logs, lastHost, lastStatus };
  } catch {}
}

export function getApiLogs(): ApiRequestLog[] {
  return [...logs];
}

export function getLastApiHost(): string | null {
  return lastHost;
}

export function getLastApiStatus(): number | 'error' | null {
  return lastStatus;
}
