import { useEffect, useMemo, useState } from 'react';
import Hero from '../sections/scouting/Hero';
import EventInfoCard from '../sections/scouting/EventInfoCard';
import ControlPanel from '../sections/scouting/ControlPanel';
import TeamsTable from '../sections/scouting/TeamsTable';
import InfoCards from '../sections/scouting/InfoCards';
import StatusBanners from '../sections/scouting/StatusBanners';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { fetchEvent, fetchEventTeams } from '../../utils/statbotics';
import { fetchEventOPRs } from '../../utils/frcAPI';
import type { StatEvent, StatTeam } from '../../utils/statbotics';

export type SortKey = 'team' | 'epa' | 'epa_auto' | 'epa_teleop' | 'epa_endgame' | 'opr' | 'dpr' | 'ccwm';

// Only allow event codes that are alphanumeric, dashes, or underscores
function sanitizeEventCode(code: string): string {
  return (code || '').replace(/[^a-zA-Z0-9_-]/g, '');
}

export default function Scouting() {
  useScrollReveal();

  // Auto-load event from query param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('event');
    if (code) {
      loadEvent(code);
    }
     
  }, []);
  const [eventCode, setEventCode] = useState<string>('');
  const [eventInfo, setEventInfo] = useState<StatEvent | null>(null);
  const [teams, setTeams] = useState<StatTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('epa');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [picked, setPicked] = useState<Record<number, true>>({});

  // Keyed storage by event code
  useEffect(() => {
    if (!eventCode) return;
    localStorage.setItem(`pickedTeams_${eventCode}`, JSON.stringify(picked));
  }, [picked, eventCode]);

  const loadEvent = async (code: string) => {
    if (!code) return;
    setLoading(true);
    setError(null);
    setTeams([]);
    setEventInfo(null);
    // load picked map for this event
    let saved: Record<number, true> = {};
    try {
      saved = JSON.parse(localStorage.getItem(`pickedTeams_${code}`) || '{}');
    } catch {}
    setPicked(saved);
    try {
      const [evtResult, teamListResult, oprResult] = await Promise.allSettled([
        fetchEvent(code),
        fetchEventTeams(code),
        fetchEventOPRs(code),
      ]);

      // If both Statbotics calls failed, show error but still try to continue
      const evt = evtResult.status === 'fulfilled' ? evtResult.value : null;
      const teamList = teamListResult.status === 'fulfilled' ? teamListResult.value : [];
      const oprData = oprResult.status === 'fulfilled' ? oprResult.value : { oprs: {}, dprs: {}, ccwms: {} };

      // merge OPRs
      teamList.forEach((t) => {
        const key = `frc${t.team}`;
        t.opr = oprData.oprs[key] ?? 0;
        t.dpr = oprData.dprs[key] ?? 0;
        t.ccwm = oprData.ccwms[key] ?? 0;
      });

      // Warn if Statbotics data was unavailable
      const statboticsDown = evtResult.status === 'rejected' || teamListResult.status === 'rejected';
      if (statboticsDown) {
        console.warn('Statbotics data unavailable, showing partial results');
      }

      if (evt) setEventInfo(evt);
      setTeams(teamList);
      setEventCode(code);

      // push query param to URL
      const params = new URLSearchParams(window.location.search);
      params.set('event', code);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);

      // If we got no teams at all, show an error
      if (teamList.length === 0 && teamListResult.status === 'rejected') {
        setError('EPA data unavailable from Statbotics. Try again later or check the event code.');
      } else if (statboticsDown) {
        setError('Some Statbotics data was unavailable. EPA stats may be incomplete.');
      }
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const togglePicked = (team: number) => {
    setPicked((prev) => {
      const newMap = { ...prev };
      if (newMap[team]) delete newMap[team];
      else newMap[team] = true;
      return newMap;
    });
  };

  const clearPicked = () => setPicked({});

  const filteredTeams = useMemo(() => {
    let arr = [...teams];
    if (sortKey === 'team') arr.sort((a, b) => a.team - b.team);
    else arr.sort((a, b) => (b as any)[sortKey] - (a as any)[sortKey]);
    if (showAvailableOnly) arr = arr.filter((t) => !picked[t.team]);
    return arr;
  }, [teams, sortKey, showAvailableOnly, picked]);

  return (
    <main className="min-h-screen pb-16 bg-black">
      <Hero defaultEvent={eventCode} onLoadEvent={loadEvent} />

      <StatusBanners loading={loading} error={error} hasTeams={teams.length>0} />
      {eventInfo && <EventInfoCard info={{
        name: eventInfo.name,
        start_date: eventInfo.start_date,
        location: [eventInfo.city, eventInfo.state, eventInfo.country].filter(Boolean).join(', '),
        num_teams: eventInfo.team_count ?? teams.length,
        tba_link: `https://www.thebluealliance.com/event/${sanitizeEventCode(eventCode)}`,
        stat_link: `https://statbotics.io/event/${sanitizeEventCode(eventCode)}`,
      }} />}

      {teams.length > 0 && (
        <>
          <ControlPanel
            sortKey={sortKey}
            setSortKey={setSortKey}
            showAvailableOnly={showAvailableOnly}
            setShowAvailableOnly={setShowAvailableOnly}
            clearPicked={clearPicked}
          />
          <TeamsTable
            teams={filteredTeams}
            picked={picked}
            togglePicked={togglePicked}
            sortKey={sortKey}
          />
        </>
      )}

      <div
        className="animate__animated animate__fadeInUp"
        style={{ animationDelay: '0.5s' }}>
          <InfoCards />
      </div>
    </main>
  );
}
