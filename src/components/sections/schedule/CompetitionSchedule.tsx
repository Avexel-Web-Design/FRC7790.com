import { useEffect, useMemo, useState } from 'react';
import { useTBA, useTeamEventStatus } from '../../../hooks/useTBA';

interface EventDateRange {
  start: Date;
  end: Date;
}

type EventStatus = 'upcoming' | 'live' | 'completed';
type AllianceColor = 'red' | 'blue';

const TEAM_NUMBER = '7790';
const TEAM_KEY = `frc${TEAM_NUMBER}`;

interface TeamEventMatch {
  key: string;
  comp_level: string;
  match_number: number;
  set_number?: number;
  predicted_time?: number;
  time?: number;
  actual_time?: number;
  alliances: {
    blue: {
      team_keys: string[];
      score: number | null;
    };
    red: {
      team_keys: string[];
      score: number | null;
    };
  };
}

interface CountdownProps {
  targetDate: Date;
}

interface EventCardData {
  key: string;
  name: string;
  dateLabel: string;
  locationLabel: string;
  range: EventDateRange;
  qualificationPending?: boolean;
}

function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="mt-6">
      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="rounded-lg bg-black/30 p-4">
          <div className="text-3xl font-bold text-baywatch-orange">{timeLeft.days}</div>
          <div className="text-sm text-gray-400">Days</div>
        </div>
        <div className="rounded-lg bg-black/30 p-4">
          <div className="text-3xl font-bold text-baywatch-orange">{timeLeft.hours}</div>
          <div className="text-sm text-gray-400">Hours</div>
        </div>
        <div className="rounded-lg bg-black/30 p-4">
          <div className="text-3xl font-bold text-baywatch-orange">{timeLeft.minutes}</div>
          <div className="text-sm text-gray-400">Minutes</div>
        </div>
        <div className="rounded-lg bg-black/30 p-4">
          <div className="text-3xl font-bold text-baywatch-orange">{timeLeft.seconds}</div>
          <div className="text-sm text-gray-400">Seconds</div>
        </div>
      </div>
    </div>
  );
}

function getEventStatus({ start, end }: EventDateRange, now: Date): EventStatus {
  const currentTime = now.getTime();

  if (currentTime < start.getTime()) {
    return 'upcoming';
  }

  if (currentTime > end.getTime()) {
    return 'completed';
  }

  return 'live';
}

function getTeamAlliance(match: TeamEventMatch): AllianceColor | null {
  if (match.alliances.blue.team_keys.includes(TEAM_KEY)) {
    return 'blue';
  }

  if (match.alliances.red.team_keys.includes(TEAM_KEY)) {
    return 'red';
  }

  return null;
}

function getMatchSortTime(match: TeamEventMatch): number {
  return match.predicted_time ?? match.time ?? 0;
}

function getNextMatch(matches: TeamEventMatch[]): TeamEventMatch | null {
  const unplayed = matches
    .filter((match) => !match.actual_time)
    .sort((a, b) => getMatchSortTime(a) - getMatchSortTime(b));

  return unplayed[0] ?? null;
}

function getLatestPlayedMatch(matches: TeamEventMatch[], eventKey?: string): TeamEventMatch | null {
  const played = matches
    .filter((match) => Boolean(match.actual_time))
    .sort((a, b) => (b.actual_time ?? 0) - (a.actual_time ?? 0));

  if (eventKey === '2026milac' && played.length > 1) {
    return played[1];
  }

  return played[0] ?? null;
}

function formatMatchLabel(match: TeamEventMatch): string {
  const typeMap: Record<string, string> = {
    qm: 'Q',
    ef: 'EF',
    qf: 'QF',
    sf: 'SF',
    f: 'F'
  };
  const type = typeMap[match.comp_level] ?? match.comp_level.toUpperCase();

  if (match.comp_level === 'qm' || match.comp_level === 'f') {
    return `${type}${match.match_number}`;
  }

  if (match.set_number) {
    return `${type}${match.set_number}`;
  }

  return `${type}${match.match_number}`;
}

function formatLastMatchResult(match: TeamEventMatch): string {
  const alliance = getTeamAlliance(match);
  const redScore = match.alliances.red.score;
  const blueScore = match.alliances.blue.score;

  if (alliance === null || redScore === null || blueScore === null || redScore < 0 || blueScore < 0) {
    return 'Result pending';
  }

  const ourScore = alliance === 'red' ? redScore : blueScore;
  const opponentScore = alliance === 'red' ? blueScore : redScore;
  const outcome = ourScore > opponentScore ? 'W' : ourScore < opponentScore ? 'L' : 'T';

  return `${outcome} ${ourScore}-${opponentScore}`;
}

function didTeamWinMatch(match: TeamEventMatch): boolean | null {
  const alliance = getTeamAlliance(match);
  const redScore = match.alliances.red.score;
  const blueScore = match.alliances.blue.score;

  if (alliance === null || redScore === null || blueScore === null || redScore < 0 || blueScore < 0) {
    return null;
  }

  if (redScore === blueScore) {
    return null;
  }

  if (alliance === 'red') {
    return redScore > blueScore;
  }

  return blueScore > redScore;
}

function getAlliancePlacement(matches: TeamEventMatch[]): string | null {
  const playoffPlayed = matches
    .filter((match) => match.comp_level !== 'qm' && Boolean(match.actual_time))
    .sort((a, b) => (b.actual_time ?? 0) - (a.actual_time ?? 0));

  if (playoffPlayed.length === 0) {
    return null;
  }

  const latestPlayoffMatch = playoffPlayed[0];
  const wonLatest = didTeamWinMatch(latestPlayoffMatch);

  if (latestPlayoffMatch.comp_level === 'f') {
    return wonLatest ? '1st' : '2nd';
  }

  if (wonLatest) {
    return '1st';
  }

  const bracketMatchNumber = latestPlayoffMatch.set_number ?? latestPlayoffMatch.match_number;

  switch (bracketMatchNumber) {
    case 13:
      return '3rd';
    case 12:
      return '4th';
    case 9:
    case 10:
      return '5th';
    case 5:
    case 6:
      return '7th';
    default:
      return null;
  }
}

function EventStatsPanel({ eventKey, mode }: { eventKey: string; mode: 'live' | 'completed' }) {
  const { data: statusData, isLoading: isStatusLoading, error: statusError } = useTeamEventStatus(TEAM_NUMBER, eventKey);
  const { data: matchesData, isLoading: isMatchesLoading, error: matchesError } = useTBA<TeamEventMatch[]>(
    `/team/${TEAM_KEY}/event/${eventKey}/matches`
  );

  const ranking = statusData?.qual?.ranking;
  const record = ranking?.record;
  const totalTeams = statusData?.qual?.num_teams;
  const playoff = statusData?.playoff;
  const allianceNumber = statusData?.alliance?.number;
  const madePlayoffs = Boolean(allianceNumber || playoff);

  const nextMatch = useMemo(() => getNextMatch(matchesData ?? []), [matchesData]);
  const latestPlayedMatch = useMemo(() => getLatestPlayedMatch(matchesData ?? [], eventKey), [matchesData, eventKey]);
  const alliancePlacement = useMemo(() => getAlliancePlacement(matchesData ?? []), [matchesData]);

  const hasErrors = Boolean(statusError || matchesError);
  const isLoading = isStatusLoading || isMatchesLoading;

  if (isLoading && !statusData && !matchesData) {
    return (
      <p className="mt-6 text-center text-gray-300">
        {mode === 'live' ? 'Loading live event data...' : 'Loading event results...'}
      </p>
    );
  }

  if (hasErrors) {
    return (
      <p className="mt-6 text-center text-gray-300">
        Live data is temporarily unavailable. Open the event page for the latest updates.
      </p>
    );
  }

  if (mode === 'live') {
    return (
      <div className="mt-6">
        <div className="grid grid-cols-1 gap-4 text-center md:grid-cols-3">
          <div className="rounded-lg bg-black/30 p-4">
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-300">Current Ranking</h4>
            <div className="text-3xl font-bold text-baywatch-orange">{ranking ? `#${ranking.rank}` : 'TBD'}</div>
            <div className="mt-1 text-sm text-gray-400">
              {ranking && totalTeams ? `of ${totalTeams} teams` : 'Waiting for ranking data'}
            </div>
          </div>

          <div className="rounded-lg bg-black/30 p-4">
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-300">Next Match</h4>
            <div className="text-3xl font-bold text-baywatch-orange">{nextMatch ? formatMatchLabel(nextMatch) : 'None'}</div>
            <div className="mt-1 text-sm text-gray-400">
              {nextMatch ? 'Unplayed team match' : 'No upcoming matches'}
            </div>
          </div>

          <div className="rounded-lg bg-black/30 p-4">
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-300">Record</h4>
            <div className="text-3xl font-bold text-baywatch-orange">
              {record ? `${record.wins}-${record.losses}-${record.ties}` : '0-0-0'}
            </div>
            <div className="mt-1 text-sm text-gray-400">Auto-refreshing every 30 seconds</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 gap-4 text-center md:grid-cols-3">
        <div className="rounded-lg bg-black/30 p-4">
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-300">Final Ranking</h4>
          <div className="text-3xl font-bold text-baywatch-orange">{ranking ? `#${ranking.rank}` : 'TBD'}</div>
          <div className="mt-1 text-sm text-gray-400">
            {madePlayoffs && record
              ? `${record.wins}-${record.losses}-${record.ties}`
              : ranking && totalTeams
                ? `of ${totalTeams} teams`
                : 'Waiting for ranking data'}
          </div>
        </div>

        <div className="rounded-lg bg-black/30 p-4">
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-300">
            {madePlayoffs ? 'Alliance Placement' : 'Latest Match'}
          </h4>
          <div className="text-3xl font-bold text-baywatch-orange">
            {madePlayoffs
              ? alliancePlacement ?? 'TBD'
              : latestPlayedMatch
                ? formatMatchLabel(latestPlayedMatch)
                : 'TBD'}
          </div>
          <div className="mt-1 text-sm text-gray-400">
            {madePlayoffs
              ? alliancePlacement ? 'Based on elimination finish' : 'Placement unavailable'
              : latestPlayedMatch
                ? formatLastMatchResult(latestPlayedMatch)
                : 'No played matches logged'}
          </div>
        </div>

        <div className="rounded-lg bg-black/30 p-4">
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-300">
            {madePlayoffs ? 'Alliance Number' : 'Record'}
          </h4>
          <div className="text-3xl font-bold text-baywatch-orange">
            {madePlayoffs
              ? allianceNumber ? `#${allianceNumber}` : 'TBD'
              : record
                ? `${record.wins}-${record.losses}-${record.ties}`
                : '0-0-0'}
          </div>
          <div className="mt-1 text-sm text-gray-400">
            {madePlayoffs
              ? statusData?.alliance?.pick ? `Pick ${statusData.alliance.pick}` : 'No alliance selection data'
              : 'Qualification record'}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, status }: { event: EventCardData; status: EventStatus }) {
  return (
    <div className="relative reveal">
      <a href={`/event?event=${event.key}`} className="block relative z-20">
        <div className="group rounded-xl border border-baywatch-orange/20 bg-black p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,102,0,0.5)]">
          {event.qualificationPending && (
            <div className="absolute -top-2 -right-2 rounded-full bg-baywatch-orange px-3 py-1 text-sm">
              Qualification Pending
            </div>
          )}

          <h3 className="mb-2 text-center text-2xl font-bold text-baywatch-orange glow-orange">{event.name}</h3>

          <div className="mb-4 flex flex-wrap justify-center gap-4">
            <span className="rounded-full bg-baywatch-orange/20 px-3 py-1 text-sm">
              <i className="far fa-calendar-alt mr-2"></i>
              {event.dateLabel}
            </span>
            <span className="rounded-full bg-baywatch-orange/20 px-3 py-1 text-sm">
              <i className="fas fa-map-marker-alt mr-2"></i>
              {event.locationLabel}
            </span>
          </div>

          {status === 'upcoming' && <Countdown targetDate={event.range.start} />}

          {status === 'live' && <EventStatsPanel eventKey={event.key} mode="live" />}

          {status === 'completed' && <EventStatsPanel eventKey={event.key} mode="completed" />}

          <div className="absolute bottom-4 right-4 text-baywatch-orange/50 transition-colors group-hover:text-baywatch-orange">
            <i className="fas fa-external-link-alt"></i>
          </div>
        </div>
      </a>
    </div>
  );
}

export default function CompetitionSchedule() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const events: EventCardData[] = [
    {
      key: '2026milac',
      name: 'Lake City District Event',
      dateLabel: 'March 13-15, 2026',
      locationLabel: '251 Russell Rd, Lake City, MI',
      range: {
        start: new Date('2026-03-13T08:00:00'),
        end: new Date('2026-03-15T23:59:59')
      }
    },
    {
      key: '2026mitvc',
      name: 'Traverse City District Event',
      dateLabel: 'March 19-21, 2026',
      locationLabel: '5376 N Long Lake Rd, Traverse City, MI',
      range: {
        start: new Date('2026-03-19T08:00:00'),
        end: new Date('2026-03-21T23:59:59')
      }
    },
    {
      key: '2026micmp',
      name: 'FIM District Championship',
      dateLabel: 'April 15-17, 2026',
      locationLabel: '7400 Bay Road, Saginaw, MI',
      qualificationPending: true,
      range: {
        start: new Date('2026-04-15T08:00:00'),
        end: new Date('2026-04-17T23:59:59')
      }
    },
    {
      key: '2026cmptx',
      name: 'FIRST Championship',
      dateLabel: 'April 28 - May 1, 2026',
      locationLabel: '1001 Avenida De Las Americas, Houston, TX',
      qualificationPending: true,
      range: {
        start: new Date('2026-04-28T08:00:00'),
        end: new Date('2026-05-01T23:59:59')
      }
    }
  ];

  const eventStatuses = useMemo(() => events.map((event) => getEventStatus(event.range, now)), [events, now]);
  const liveEventIndex = eventStatuses.findIndex((status) => status === 'live');

  const hasLiveEvent = liveEventIndex !== -1;
  const allUpcoming = eventStatuses.every((status) => status === 'upcoming');
  const allCompleted = eventStatuses.every((status) => status === 'completed');

  let pulsingBetweenIndex: number | null = null;
  if (!hasLiveEvent && !allUpcoming) {
    if (allCompleted) {
      pulsingBetweenIndex = events.length > 1 ? events.length - 2 : null;
    } else {
      const lastCompletedIndex = eventStatuses.reduce(
        (acc, status, index) => (status === 'completed' ? index : acc),
        -1
      );
      pulsingBetweenIndex = lastCompletedIndex >= 0 ? lastCompletedIndex : null;
    }
  }

  const pulseStartDot = !hasLiveEvent && allUpcoming;

  return (
    <section className="relative z-10 animate__animated animate__fadeInUp py-16" style={{ animationDelay: '1s' }}>
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-4xl">
          <div className="relative">
            <div className="absolute left-1/2 top-0 h-[calc(100%-2rem)] w-1 -translate-x-1/2 transform bg-gradient-to-b from-baywatch-orange/50 via-baywatch-orange/40 to-baywatch-orange/30"></div>

            <div className="mb-12 flex items-center justify-center">
              <div className={`relative z-10 h-8 w-8 rounded-full bg-baywatch-orange glow-orange ${pulseStartDot ? 'animate-pulse' : ''}`}></div>
            </div>

            {events.map((event, index) => {
              const status = eventStatuses[index];
              const isLast = index === events.length - 1;
              const pulseThisBetweenDot = !hasLiveEvent && pulsingBetweenIndex === index;

              return (
                <div key={event.key} className="mb-16 last:mb-0">
                  <EventCard event={event} status={status} />

                  {!isLast && (
                    <div className="my-10 flex items-center justify-center">
                      <div
                        className={`relative z-10 h-8 w-8 rounded-full bg-baywatch-orange glow-orange ${pulseThisBetweenDot ? 'animate-pulse' : ''}`}
                      ></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
