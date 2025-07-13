import React, { useState, useEffect } from 'react';
import type { EventData } from '../../../hooks/useEventData';

interface EventCountdownProps {
  eventData: EventData | null;
  isLoading: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const EventCountdown: React.FC<EventCountdownProps> = ({ eventData, isLoading }) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    if (!eventData) return;

    const updateCountdown = () => {
      const eventStart = new Date(eventData.start_date);
      const now = new Date();
      const difference = eventStart.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeRemaining({ days, hours, minutes, seconds });
      } else {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [eventData]);

  if (!eventData) return null;

  return (
    <section id="teams-section" className="py-16 relative z-10">
      <div className="container mx-auto px-6 mb-12">
        <div className="card-gradient backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <h2 className="text-2xl font-bold text-center mb-4">Event Begins In</h2>
          <div className="flex justify-center gap-4 md:gap-8">
            <div className="flex flex-col items-center">
              <div className="text-4xl md:text-6xl font-bold text-baywatch-orange">
                {isLoading ? '--' : timeRemaining.days.toString().padStart(2, '0')}
              </div>
              <div className="text-gray-400 text-sm md:text-base">Days</div>
            </div>
            <div className="text-2xl md:text-4xl text-gray-500 self-center">:</div>
            <div className="flex flex-col items-center">
              <div className="text-4xl md:text-6xl font-bold text-baywatch-orange">
                {isLoading ? '--' : timeRemaining.hours.toString().padStart(2, '0')}
              </div>
              <div className="text-gray-400 text-sm md:text-base">Hours</div>
            </div>
            <div className="text-2xl md:text-4xl text-gray-500 self-center">:</div>
            <div className="flex flex-col items-center">
              <div className="text-4xl md:text-6xl font-bold text-baywatch-orange">
                {isLoading ? '--' : timeRemaining.minutes.toString().padStart(2, '0')}
              </div>
              <div className="text-gray-400 text-sm md:text-base">Minutes</div>
            </div>
            <div className="text-2xl md:text-4xl text-gray-500 self-center">:</div>
            <div className="flex flex-col items-center">
              <div className="text-4xl md:text-6xl font-bold text-baywatch-orange">
                {isLoading ? '--' : timeRemaining.seconds.toString().padStart(2, '0')}
              </div>
              <div className="text-gray-400 text-sm md:text-base">Seconds</div>
            </div>
          </div>
          <p className="text-center text-gray-400 mt-4 text-sm">
            Live competition data will be available once the event begins
          </p>
        </div>
      </div>
    </section>
  );
};

export default EventCountdown;
