// TEMPORARY LiveTest page used to verify Capacitor remote live updates.
// Remove this component and its route/nav link once verification is complete.
export default function LiveTest() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
      <h1 className="text-4xl font-extrabold bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
        Live Update Test Page
      </h1>
      <p className="max-w-xl text-gray-300 leading-relaxed">
        If you can see this page inside the Capacitor app without rebuilding the native binary, remote live updates
        are working. You can now remove the <code>Live Test</code> link and this page. Try editing this text and
        refreshing in the app to confirm updates propagate.
      </p>
      <div className="rounded-lg border border-gray-700/60 bg-black/30 p-4 text-left w-full max-w-md">
        <p className="text-sm text-gray-400 mb-2">Environment Info</p>
        <ul className="text-sm space-y-1 text-gray-300">
          <li><strong>User Agent:</strong> {navigator.userAgent}</li>
          <li><strong>Timestamp (UTC):</strong> {new Date().toISOString()}</li>
          <li><strong>Build Check:</strong> If this timestamp updates after a browser refresh, you're loading fresh content.</li>
        </ul>
      </div>
      <p className="text-xs text-gray-500">
        (Temporary diagnostic page - safe to delete after validation.)
      </p>
    </div>
  );
}
