import { useState, useEffect } from 'react';
import { useFRCCurrentEvent } from '../../../hooks/useFRCData';

// 2026 Season Events Schedule
const EVENTS_2026 = [
  {
    name: 'Lake City District Event',
    code: '2026milac',
    startDate: new Date('2026-03-13T08:00:00'),
    endDate: new Date('2026-03-15T23:59:59'),
    location: 'Lake City, MI'
  },
  {
    name: 'Traverse City District Event',
    code: '2026mitvc',
    startDate: new Date('2026-03-19T08:00:00'),
    endDate: new Date('2026-03-21T23:59:59'),
    location: 'Traverse City, MI'
  },
  {
    name: 'FIM District Championship',
    code: '2026micmp',
    startDate: new Date('2026-04-15T08:00:00'),
    endDate: new Date('2026-04-17T23:59:59'),
    location: 'Saginaw, MI'
  },
  {
    name: 'FIRST Championship',
    code: '2026cmptx',
    startDate: new Date('2026-04-28T08:00:00'),
    endDate: new Date('2026-05-01T23:59:59'),
    location: 'Houston, TX'
  }
];

interface ScheduledEvent {
  name: string;
  code: string;
  startDate: Date;
  endDate: Date;
  location: string;
}

function getNextEvent(): { event: ScheduledEvent | null; isLive: boolean } {
  const now = new Date();
  
  // Check if any event is currently happening
  for (const event of EVENTS_2026) {
    if (now >= event.startDate && now <= event.endDate) {
      return { event, isLive: true };
    }
  }
  
  // Find the next upcoming event
  for (const event of EVENTS_2026) {
    if (now < event.startDate) {
      return { event, isLive: false };
    }
  }
  
  // All events have passed
  return { event: null, isLive: false };
}

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [nextEvent, setNextEvent] = useState<{ event: ScheduledEvent | null; isLive: boolean }>({ event: null, isLive: false });
  
  // Get live event data when an event is happening
  const { event: liveEventData, isLoading: isLiveLoading } = useFRCCurrentEvent();

  useEffect(() => {
    const updateTimer = () => {
      const eventInfo = getNextEvent();
      setNextEvent(eventInfo);
      
      if (!eventInfo.event || eventInfo.isLive) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const now = new Date().getTime();
      const distance = eventInfo.event.startDate.getTime() - now;

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  // If an event is currently live, show live event card
  if (nextEvent.isLive && nextEvent.event) {
    return (
      <section id="countdown-section" className="py-20 sm:py-20 bg-black scroll-mt-24">
        <div className="container mx-auto px-4 sm:px-6">
          <a 
            href={`/event?event=${nextEvent.event.code}`}
            className="block max-w-4xl mx-auto p-4 sm:p-8 card-gradient rounded-xl transition-all duration-300 glow-orange hover:scale-105"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-red-500 font-semibold uppercase tracking-wider text-sm">Live Now</span>
            </div>
            <h2 className="text-4xl font-bold mb-2 text-center text-baywatch-orange">{nextEvent.event.name}</h2>
            <p className="text-gray-400 text-center mb-4">
              {nextEvent.event.location}
            </p>
            {!isLiveLoading && liveEventData && (
              <div className="text-center">
                <p className="text-gray-300 mb-2">Team 7790 Status</p>
                <div className="flex justify-center gap-4 flex-wrap">
                  {liveEventData.rank && (
                    <div className="bg-black/50 rounded-lg px-4 py-2">
                      <span className="text-gray-400 text-sm">Rank</span>
                      <div className="text-2xl font-bold text-baywatch-orange">#{liveEventData.rank}</div>
                    </div>
                  )}
                  {liveEventData.record && (
                    <div className="bg-black/50 rounded-lg px-4 py-2">
                      <span className="text-gray-400 text-sm">Record</span>
                      <div className="text-2xl font-bold text-baywatch-orange">{liveEventData.record}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <p className="text-center text-baywatch-orange mt-4 text-sm">
              <i className="fas fa-external-link-alt mr-2"></i>View Live Event Details
            </p>
          </a>
        </div>
      </section>
    );
  }

  // If no more events this season
  if (!nextEvent.event) {
    return (
      <section id="countdown-section" className="py-20 sm:py-20 bg-black scroll-mt-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto p-4 sm:p-8 card-gradient rounded-xl transition-all duration-300 glow-orange hover:scale-105">
            <h2 className="text-4xl font-bold mb-4 text-center">2026 Season Complete</h2>
            <p className="text-gray-400 text-center mb-4">
              Thanks for an amazing season! See you next year.
            </p>
            <div className="text-center">
              <a href="/schedule" className="text-baywatch-orange hover:underline">
                View Season Results <i className="fas fa-arrow-right ml-2"></i>
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Default: countdown to next event
  return (
    <section id="countdown-section" className="py-20 sm:py-20 bg-black scroll-mt-24">
      <div className="container mx-auto px-4 sm:px-6">
        <a 
          href={`/event?event=${nextEvent.event.code}`}
          className="block max-w-4xl mx-auto p-4 sm:p-8 card-gradient rounded-xl transition-all duration-300 glow-orange hover:scale-105"
        >
          <h2 className="text-4xl font-bold mb-2 text-center">Next Event</h2>
          <p className="text-2xl text-baywatch-orange text-center mb-1">{nextEvent.event.name}</p>
          <p className="text-gray-400 text-center mb-4">
            {nextEvent.event.location}
          </p>
          <div className="text-center">
            <div className="text-3xl sm:text-5xl font-bold text-baywatch-orange">
              {formatTime(timeLeft.days)}d {formatTime(timeLeft.hours)}h {formatTime(timeLeft.minutes)}m {formatTime(timeLeft.seconds)}s
            </div>
          </div>
          <p className="text-center text-gray-500 mt-4 text-sm">
            <i className="fas fa-external-link-alt mr-2"></i>Click for event details
          </p>
        </a>
      </div>
    </section>
  );
}
