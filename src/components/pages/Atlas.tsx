import { useMemo, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useAtlasData } from '../../hooks/useAtlasData';
import { formatEventDate } from '../../utils/frcAPI';

const MIN_YEAR = 1992;

// TBA event_type values
const DISTRICT_CMP_TYPES = [2, 5]; // District Championship, District Championship Division
const FIRST_CMP_TYPES = [3, 4]; // Championship Division, Championship Finals

type AtlasTab = 'districts' | 'events';

function getWeekLabel(weekId: number): string {
  return `Week ${weekId + 1}`;
}

export default function Atlas() {
  const currentYear = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState<AtlasTab>('events');
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedWeek, setSelectedWeek] = useState<string>('all');
  const [yearOpen, setYearOpen] = useState(false);
  const [weekOpen, setWeekOpen] = useState(false);
  const yearRef = useRef<HTMLDivElement | null>(null);
  const weekRef = useRef<HTMLDivElement | null>(null);

  const { districts, events, isLoading, error, refetch } = useAtlasData(selectedYear);

  // Reset week filter when year changes
  useEffect(() => {
    setSelectedWeek('all');
  }, [selectedYear]);

  const yearOptions = useMemo(() => {
    const years: string[] = [];
    for (let year = currentYear; year >= MIN_YEAR; year -= 1) {
      years.push(year.toString());
    }
    return years;
  }, [currentYear]);

  const yearDropdownOptions = useMemo(() => {
    return yearOptions.map((year) => ({ value: year, label: year }));
  }, [yearOptions]);

  const weekDropdownOptions = useMemo(() => {
    const weekIds = new Set<number>();
    let hasDistrictCmp = false;
    let hasFirstCmp = false;

    events.forEach((event) => {
      if (
        typeof event.week === 'number' &&
        !DISTRICT_CMP_TYPES.includes(event.event_type) &&
        !FIRST_CMP_TYPES.includes(event.event_type)
      ) {
        weekIds.add(event.week);
      }
      if (DISTRICT_CMP_TYPES.includes(event.event_type)) {
        hasDistrictCmp = true;
      }
      if (FIRST_CMP_TYPES.includes(event.event_type)) {
        hasFirstCmp = true;
      }
    });

    const weekEntries = Array.from(weekIds)
      .sort((a, b) => a - b)
      .map((weekId) => ({
        value: String(weekId),
        label: getWeekLabel(weekId),
      }));

    return [
      { value: 'all', label: 'All Weeks' },
      ...weekEntries,
      ...(hasDistrictCmp
        ? [{ value: 'district-cmp', label: 'District Championships' }]
        : []),
      ...(hasFirstCmp
        ? [{ value: 'first-cmp', label: 'FIRST Championship' }]
        : []),
      { value: 'other', label: 'Other / Offseason' },
    ];
  }, [events]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (yearRef.current && !yearRef.current.contains(target)) {
        setYearOpen(false);
      }
      if (weekRef.current && !weekRef.current.contains(target)) {
        setWeekOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setYearOpen(false);
        setWeekOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const filteredEvents = useMemo(() => {
    if (selectedWeek === 'all') return events;
    if (selectedWeek === 'district-cmp') {
      return events.filter((event) => DISTRICT_CMP_TYPES.includes(event.event_type));
    }
    if (selectedWeek === 'first-cmp') {
      return events.filter((event) => FIRST_CMP_TYPES.includes(event.event_type));
    }
    if (selectedWeek === 'other') {
      return events.filter(
        (event) =>
          (event.week === null || event.week === undefined) &&
          !DISTRICT_CMP_TYPES.includes(event.event_type) &&
          !FIRST_CMP_TYPES.includes(event.event_type)
      );
    }
    const weekNumber = Number(selectedWeek);
    return events.filter((event) => event.week === weekNumber);
  }, [events, selectedWeek]);

  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort(
      (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
  }, [filteredEvents]);

  const sortedDistricts = useMemo(() => {
    return [...districts].sort((a, b) => a.display_name.localeCompare(b.display_name));
  }, [districts]);

  const tabs: { id: AtlasTab; label: string; icon: string }[] = [
    { id: 'events', label: 'Events', icon: 'fas fa-calendar-days' },
    { id: 'districts', label: 'Districts', icon: 'fas fa-map' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="pt-32 pb-6 text-center">
        <h1
          className="text-5xl md:text-7xl font-bold text-baywatch-orange animate__animated animate__fadeInUp"
          style={{ animationDelay: '0.15s' }}
        >
          Atlas
        </h1>
        <p
          className="mt-4 text-gray-400 animate__animated animate__fadeInUp"
          style={{ animationDelay: '0.3s' }}
        >
          Explore every district and event without searching.
        </p>
        <div
          className="mt-6 animate__animated animate__fadeInUp"
          style={{ animationDelay: '0.35s' }}
        >
          <Link
            to="/login"
            className="inline-block px-6 py-2 border border-baywatch-orange text-baywatch-orange rounded-lg hover:bg-baywatch-orange hover:text-black transition-all duration-300"
          >
            Login
          </Link>
        </div>
      </section>

      {/* Tabs */}
      <div
        className="animate__animated animate__fadeInUp"
        style={{ animationDelay: '0.4s' }}
      >
        <div className="container mx-auto px-6 mb-2">
          <div className="border-b border-gray-700 grid grid-cols-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-center py-3 px-3 sm:px-6 font-medium transition-all duration-300 relative
                  ${activeTab === tab.id ? 'text-baywatch-orange border-b-2 border-baywatch-orange' : 'text-gray-400 hover:text-white border-b-2 border-transparent hover:border-gray-600'}`}
              >
                <i className={`${tab.icon} mr-0 sm:mr-2`}></i>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="absolute inset-0 rounded-lg bg-baywatch-orange/20 opacity-0 transform scale-75 transition-all duration-300 pointer-events-none"></span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <section
        className="relative z-30 pb-6 animate__animated animate__fadeInUp"
        style={{ animationDelay: '0.5s' }}
      >
        <div className="container mx-auto px-6">
          <div className={`grid gap-4 items-end ${activeTab === 'events' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {/* Season dropdown */}
            <div className={activeTab === 'events' ? 'lg:col-span-2' : ''}>
              <label className="block text-sm text-gray-400 mb-2">Season</label>
              <div ref={yearRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setYearOpen((prev) => !prev);
                    setWeekOpen(false);
                  }}
                  className="w-full bg-black border border-gray-700 text-white rounded-lg px-4 py-3 flex items-center justify-between focus:outline-none focus:border-baywatch-orange"
                  aria-haspopup="listbox"
                  aria-expanded={yearOpen}
                >
                  <span>{selectedYear}</span>
                  <ChevronDownIcon
                    className={`h-4 w-4 text-gray-400 transition-transform ${yearOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {yearOpen && (
                  <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-700 bg-black shadow-lg max-h-64 overflow-y-auto">
                    <ul role="listbox" className="py-1">
                      {yearDropdownOptions.map((option) => (
                        <li key={option.value}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedYear(option.value);
                              setYearOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                              option.value === selectedYear
                                ? 'text-baywatch-orange bg-gray-900'
                                : 'text-gray-200 hover:text-white hover:bg-gray-900'
                            }`}
                            role="option"
                            aria-selected={option.value === selectedYear}
                          >
                            {option.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Week dropdown - only shown on events tab */}
            {activeTab === 'events' && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Week Filter</label>
                <div ref={weekRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setWeekOpen((prev) => !prev);
                      setYearOpen(false);
                    }}
                    className="w-full bg-black border border-gray-700 text-white rounded-lg px-4 py-3 flex items-center justify-between focus:outline-none focus:border-baywatch-orange"
                    aria-haspopup="listbox"
                    aria-expanded={weekOpen}
                  >
                    <span>
                      {weekDropdownOptions.find((option) => option.value === selectedWeek)?.label ??
                        'All Weeks'}
                    </span>
                    <ChevronDownIcon
                      className={`h-4 w-4 text-gray-400 transition-transform ${weekOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {weekOpen && (
                    <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-700 bg-black shadow-lg max-h-64 overflow-y-auto">
                      <ul role="listbox" className="py-1">
                        {weekDropdownOptions.map((option) => (
                          <li key={option.value}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedWeek(option.value);
                                setWeekOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                option.value === selectedWeek
                                  ? 'text-baywatch-orange bg-gray-900'
                                  : 'text-gray-200 hover:text-white hover:bg-gray-900'
                              }`}
                              role="option"
                              aria-selected={option.value === selectedWeek}
                            >
                              {option.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {error && (
            <div className="mt-6 text-red-400 text-sm">
              {error}{' '}
              <button onClick={refetch} className="underline">
                retry
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Districts tab content */}
      {activeTab === 'districts' && (
        <section
          className="relative z-0 pb-20 animate__animated animate__fadeInUp"
          style={{ animationDelay: '0.6s' }}
        >
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Districts</h2>
              <span className="text-sm text-gray-400">{sortedDistricts.length} total</span>
            </div>
            {isLoading ? (
              <div className="text-center text-gray-400">Loading districts...</div>
            ) : sortedDistricts.length === 0 ? (
              <div className="text-center text-gray-500">No districts available for this season.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedDistricts.map((district) => (
                  <Link
                    key={district.key}
                    to={`/district?district=${district.key}`}
                    className="block card-gradient p-5 rounded-lg border border-gray-700 hover:border-baywatch-orange transition transform hover:-translate-y-1"
                  >
                    <h3 className="text-lg font-semibold text-baywatch-orange">
                      {district.display_name}
                    </h3>
                    <p className="text-gray-400 mt-1">{district.key.toUpperCase()}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Events tab content */}
      {activeTab === 'events' && (
        <section
          className="relative z-0 pb-20 animate__animated animate__fadeInUp"
          style={{ animationDelay: '0.6s' }}
        >
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Events</h2>
              <span className="text-sm text-gray-400">{sortedEvents.length} total</span>
            </div>
            {isLoading ? (
              <div className="text-center text-gray-400">Loading events...</div>
            ) : sortedEvents.length === 0 ? (
              <div className="text-center text-gray-500">No events available for this season.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedEvents.map((event) => (
                  <Link
                    key={event.key}
                    to={`/event?event=${event.key}`}
                    className="block card-gradient p-5 rounded-lg border border-gray-700 hover:border-baywatch-orange transition transform hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold text-baywatch-orange">{event.name}</h3>
                      <span className="text-xs text-gray-400 shrink-0">
                        {DISTRICT_CMP_TYPES.includes(event.event_type)
                          ? 'DCMP'
                          : FIRST_CMP_TYPES.includes(event.event_type)
                            ? 'CMP'
                            : event.week !== null && event.week !== undefined
                              ? getWeekLabel(event.week)
                              : ''}
                      </span>
                    </div>
                    <p className="text-gray-400 mt-2 text-sm">
                      {formatEventDate(event.start_date, event.end_date)}
                    </p>
                    {(event.city || event.state_prov || event.country) && (
                      <p className="text-gray-500 text-xs mt-2">
                        {[event.city, event.state_prov, event.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                    <p className="text-gray-500 text-xs mt-2">{event.key}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
