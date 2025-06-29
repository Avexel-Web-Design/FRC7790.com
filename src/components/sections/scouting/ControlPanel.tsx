import type { SortKey } from '../../pages/Scouting';

interface Props {
  sortKey: SortKey;
  setSortKey: (key: SortKey) => void;
  showAvailableOnly: boolean;
  setShowAvailableOnly: (v: boolean) => void;
  clearPicked: () => void;
}

export default function ControlPanel({
  sortKey,
  setSortKey,
  showAvailableOnly,
  setShowAvailableOnly,
  clearPicked,
}: Props) {
  return (
    <section className="container mx-auto px-6 mt-6 max-w-3xl flex flex-wrap gap-4 items-center justify-center animate__animated animate__fadeInUp" style={{ animationDelay: '0.7s' }}>
      <div>
        <label className="mr-2">Sort by:</label>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="bg-black/40 border border-gray-700 px-3 py-1 rounded"
        >
          <option value="team">Team # (asc)</option>
          <option value="epa">Total EPA</option>
          <option value="epa_auto">Auto EPA</option>
          <option value="epa_teleop">Teleop EPA</option>
          <option value="epa_endgame">Endgame EPA</option>
          <option value="opr">OPR</option>
          <option value="dpr">DPR</option>
          <option value="ccwm">CCWM</option>
        </select>
      </div>

      <button
        onClick={() => setShowAvailableOnly(!showAvailableOnly)}
        className="px-3 py-1 border border-gray-700 rounded hover:bg-baywatch-orange/20"
      >
        {showAvailableOnly ? 'Show All Teams' : 'Show Available Only'}
      </button>

      <button
        onClick={clearPicked}
        className="px-3 py-1 border border-gray-700 rounded hover:bg-red-500/30"
      >
        Clear All Picked
      </button>
    </section>
  );
}
