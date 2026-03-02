import { useState, useEffect, useMemo } from 'react';
import { useScoutingQueue } from '../../../hooks/useScoutingQueue';
import { useActiveEvent } from '../../../hooks/useActiveEvent';
import { submitPitEntry, uploadPitImage, fetchEventTeams } from '../../../utils/scoutingApi';
import type { EventTeam } from '../../../utils/scoutingApi';
import SearchableSelect from '../../common/SearchableSelect';
import type { SearchableOption } from '../../common/SearchableSelect';

export default function PitScouting() {
  const { enqueue, syncQueue, stats, syncing } = useScoutingQueue();
  const { activeEvent, loading } = useActiveEvent();
  const [teamNumber, setTeamNumber] = useState('');
  const [drivetrain, setDrivetrain] = useState('');
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [activeFuelCapability, setActiveFuelCapability] = useState('');
  const [climbCapability, setClimbCapability] = useState('');
  const [notes, setNotes] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' });
  const [uploading, setUploading] = useState(false);
  const [teams, setTeams] = useState<EventTeam[]>([]);

  useEffect(() => {
    if (!activeEvent) return;
    fetchEventTeams().then(setTeams);
  }, [activeEvent]);

  const teamOptions: SearchableOption[] = useMemo(
    () =>
      teams.map((t) => ({
        value: String(t.team_number),
        label: String(t.team_number),
        sublabel: t.nickname || undefined,
      })),
    [teams],
  );

  const handleUpload = async () => {
    if (!imageFile) return;
    setUploading(true);
    try {
      const url = await uploadPitImage(imageFile);
      setImageUrl(url);
      setStatus({ type: 'success', message: 'Image uploaded.' });
    } catch {
      setStatus({ type: 'error', message: 'Image upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const teamNum = Number(teamNumber);
    if (!teamNum) {
      setStatus({ type: 'error', message: 'Team number is required.' });
      return;
    }

    const payload = {
      team_number: teamNum,
      drivetrain: drivetrain || undefined,
      weight: weight || undefined,
      dimensions: dimensions || undefined,
      active_fuel_capability: activeFuelCapability || undefined,
      climb_capability: climbCapability || undefined,
      notes: notes || undefined,
      image_url: imageUrl || undefined
    };

    if (!navigator.onLine) {
      enqueue({ type: 'pit', payload });
      setStatus({ type: 'success', message: 'Saved offline. Will sync when online.' });
      return;
    }

    try {
      await submitPitEntry(payload);
      setStatus({ type: 'success', message: 'Pit entry submitted.' });
    } catch {
      enqueue({ type: 'pit', payload });
      setStatus({ type: 'success', message: 'Saved offline. Will sync when online.' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Pit Scouting</h1>
            <p className="mt-1 text-sm text-gray-400">Capture robot details and upload a photo.</p>
          </div>
          <button
            type="button"
            onClick={syncQueue}
            className="inline-flex items-center justify-center rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-200 hover:border-baywatch-orange"
          >
            Sync queue ({stats.count}){syncing ? '...' : ''}
          </button>
        </div>

        {!loading && !activeEvent && (
          <div className="mt-6 rounded-2xl border border-gray-800 bg-black/50 p-6 text-sm text-gray-400">
            No active event. Start one from the dashboard.
          </div>
        )}

        {activeEvent && (
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <section className="rounded-2xl border border-gray-800 bg-black/50 p-6">
            <h2 className="text-lg font-semibold text-white">Team Info</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <SearchableSelect
                options={teamOptions}
                value={teamNumber}
                onChange={setTeamNumber}
                placeholder="Team number"
                required
              />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-800 bg-black/50 p-6">
            <h2 className="text-lg font-semibold text-white">Robot Details</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                type="text"
                value={drivetrain}
                onChange={(e) => setDrivetrain(e.target.value)}
                placeholder="Drivetrain"
                className="rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white"
              />
              <input
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Weight"
                className="rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white"
              />
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="Dimensions"
                className="rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white"
              />
              <input
                type="text"
                value={activeFuelCapability}
                onChange={(e) => setActiveFuelCapability(e.target.value)}
                placeholder="Active Fuel capability"
                className="rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white"
              />
              <input
                type="text"
                value={climbCapability}
                onChange={(e) => setClimbCapability(e.target.value)}
                placeholder="Climb capability"
                className="rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-800 bg-black/50 p-6">
            <h2 className="text-lg font-semibold text-white">Robot Photo</h2>
            <div className="mt-4 flex flex-col gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="text-sm text-gray-300"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!imageFile || uploading}
                  className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-200 disabled:opacity-60"
                >
                  {uploading ? 'Uploading...' : 'Upload to R2'}
                </button>
                {imageUrl && (
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-baywatch-orange"
                  >
                    View uploaded image
                  </a>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-800 bg-black/50 p-6">
            <h2 className="text-lg font-semibold text-white">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes"
              className="mt-3 w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white"
              rows={4}
            />
          </section>

          <div className="flex flex-col items-start gap-3">
            <button
              type="submit"
              className="rounded-lg bg-baywatch-orange px-4 py-2 text-sm font-semibold text-black"
            >
              Submit Pit Entry
            </button>
            {status.type !== 'idle' && (
              <p className={`text-sm ${status.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                {status.message}
              </p>
            )}
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
