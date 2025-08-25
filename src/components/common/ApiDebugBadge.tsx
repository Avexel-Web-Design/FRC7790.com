import { useEffect, useState } from 'react';

export default function ApiDebugBadge() {
  const [info, setInfo] = useState<{ host: string | null; status: number | 'error' | null }>({ host: null, status: null });
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const check = () => {
      try {
        const on = typeof localStorage !== 'undefined' && localStorage.getItem('apiDebug') === '1';
        setEnabled(on);
      } catch { setEnabled(false); }
    };
    check();
    const t = setInterval(() => {
      check();
      try {
        // @ts-ignore
        const dbg = (window as any).__API_DEBUG__ as { lastHost?: string; lastStatus?: number | 'error' } | undefined;
        if (dbg) {
          setInfo({ host: dbg.lastHost ?? null, status: dbg.lastStatus ?? null });
        }
      } catch {}
    }, 1000);
    return () => clearInterval(t);
  }, []);

  if (!enabled || !info.host) return null;
  const statusOk = typeof info.status === 'number' ? info.status >= 200 && info.status < 300 : false;
  return (
    <div style={{ position: 'fixed', bottom: 8, right: 8, zIndex: 9999 }}>
      <div className={`px-2 py-1 rounded text-xs font-mono border ${statusOk ? 'bg-green-900/40 border-green-600 text-green-200' : 'bg-red-900/40 border-red-600 text-red-200'}`}>
        {info.host?.replace('https://', '')} · {String(info.status)}
      </div>
    </div>
  );
}
