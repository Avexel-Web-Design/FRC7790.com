import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export default function ApiDebugBadge() {
  const [info, setInfo] = useState<{ host: string | null; status: number | 'error' | null; error?: string | null }>({ host: null, status: null, error: null });
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const check = () => {
      try {
        const onFlag = typeof localStorage !== 'undefined' && localStorage.getItem('apiDebug') === '1';
        const onNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform();
        setEnabled(Boolean(onFlag || onNative));
      } catch { setEnabled(false); }
    };
    check();
    const t = setInterval(() => {
      check();
      try {
        // @ts-ignore
        const dbg = (window as any).__API_DEBUG__ as { lastHost?: string; lastStatus?: number | 'error'; lastError?: string | null } | undefined;
        if (dbg) {
          setInfo({ host: dbg.lastHost ?? null, status: dbg.lastStatus ?? null, error: dbg.lastError ?? null });
        }
      } catch {}
    }, 1000);
    return () => clearInterval(t);
  }, []);

  if (!enabled) return null;
  const statusOk = typeof info.status === 'number' ? info.status >= 200 && info.status < 300 : false;
  const textHost = info.host ? info.host.replace('https://', '') : 'waiting…';
  const textStatus = info.status != null ? String(info.status) : '…';
  return (
    <div style={{ position: 'fixed', bottom: 8, right: 8, zIndex: 2147483647 }}>
      <div className={`px-2 py-1 rounded text-xs font-mono border ${statusOk ? 'bg-green-900/40 border-green-600 text-green-200' : 'bg-red-900/40 border-red-600 text-red-200'}`}>
        {textHost} · {textStatus}{info.status === 'error' && info.error ? ` · ${info.error}` : ''}
      </div>
    </div>
  );
}
