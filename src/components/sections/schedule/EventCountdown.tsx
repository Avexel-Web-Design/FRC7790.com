import { useState, useEffect } from 'react';

interface EventCountdownProps {
  targetDate: string;
}

export default function EventCountdown({ targetDate }: EventCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const updateTimer = () => {
      const target = new Date(targetDate);
      const now = new Date().getTime();
      const distance = target.getTime() - now;

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
        return true; // Continue updating
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return false; // Stop updating
      }
    };

    // Initial update
    const shouldContinue = updateTimer();
    
    if (!shouldContinue) {
      return; // Don't set interval if countdown is already finished
    }

    // Update every second
    const interval = setInterval(() => {
      const shouldContinue = updateTimer();
      if (!shouldContinue) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="mt-6">
      <div className="p-6 bg-black/30 rounded-lg">
        <h4 className="text-lg font-semibold mb-4 text-center">Event Begins In</h4>
        <div className="flex justify-center gap-4">
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-baywatch-orange">
              {formatTime(timeLeft.days)}
            </div>
            <div className="text-gray-400 text-xs">Days</div>
          </div>
          <div className="text-2xl text-gray-500 self-center">:</div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-baywatch-orange">
              {formatTime(timeLeft.hours)}
            </div>
            <div className="text-gray-400 text-xs">Hours</div>
          </div>
          <div className="text-2xl text-gray-500 self-center">:</div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-baywatch-orange">
              {formatTime(timeLeft.minutes)}
            </div>
            <div className="text-gray-400 text-xs">Minutes</div>
          </div>
          <div className="text-2xl text-gray-500 self-center">:</div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-baywatch-orange">
              {formatTime(timeLeft.seconds)}
            </div>
            <div className="text-gray-400 text-xs">Seconds</div>
          </div>
        </div>
      </div>
    </div>
  );
}
