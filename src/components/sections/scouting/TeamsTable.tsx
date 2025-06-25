import type { SortKey } from '../../pages/Scouting';
import type { StatTeam } from '../../../utils/statbotics';
import { Link } from 'react-router-dom';

interface Props {
  teams: StatTeam[];
  picked: Record<number, true>;
  togglePicked: (team: number) => void;
  sortKey: SortKey;
}

export default function TeamsTable({ teams, picked, togglePicked }: Props) {
  return (
    <section className="container mx-auto px-6 mt-6 overflow-x-auto animate__animated animate__fadeInUp" style={{ animationDelay: '0.7s' }}>
      <table className="min-w-full text-sm text-left">
        <thead className="bg-black/60 border-b border-gray-700 text-gray-300 text-center">
          <tr>
            <th className="p-2">Rank</th>
            <th className="p-2">Team</th>
            <th className="p-2">Name</th>
            <th className="p-2">Total</th>
            <th className="p-2">Auto</th>
            <th className="p-2">Teleop</th>
            <th className="p-2">Endgame</th>
            <th className="p-2">OPR</th>
            <th className="p-2">DPR</th>
            <th className="p-2">CCWM</th>
            <th className="p-2">Picked</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t, idx) => {
            const isPicked = Boolean(picked[t.team]);
            return (
              <tr
                key={t.team}
                className={
                  idx % 2 === 0 ? 'bg-black/30' : 'bg-black/10' + ' hover:bg-baywatch-orange/10'
                }
              >
                <td className="p-2 text-center">{idx + 1}</td>
                <td className="p-2 text-center">
                  <Link to={`/team?team=${t.team}`} className="text-baywatch-orange">
                    {t.team}
                  </Link>
                </td>
                <td className="p-2 text-center">{t.nickname}</td>
                <td className={`p-2 text-center`}>{t.epa.toFixed(1)}</td>
                <td className={`p-2 text-center`}>{t.epa_auto.toFixed(1)}</td>
                <td className={`p-2 text-center`}>{t.epa_teleop.toFixed(1)}</td>
                <td className={`p-2 text-center`}>{t.epa_endgame.toFixed(1)}</td>
                <td className="p-2 text-center">{t.opr.toFixed(1)}</td>
                <td className="p-2 text-center">{t.dpr.toFixed(1)}</td>
                <td className="p-2 text-center">{t.ccwm.toFixed(1)}</td>
                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={isPicked}
                    onChange={() => togglePicked(t.team)}
                    className="team-status-checkbox"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
