import { useState, useEffect } from 'react';

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // Set target date for FRC Kickoff (typically first Saturday in January)
    const targetDate = new Date('2026-01-04T10:30:00-05:00'); // Adjust as needed

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

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

  return (
    <section id="countdown-section" className="py-12 sm:py-20 bg-black scroll-mt-24">
      <div className="container mx-auto px-3 sm:px-6">
        <div className="p-6 card-gradient rounded-xl transition-all duration-300 glow-orange hover:scale-105">
          <h2 className="text-4xl font-bold mb-4 text-center">Countdown to Kickoff</h2>
          <p className="text-gray-400 text-center mb-4">
            FRC Game Reveal - REBUILT
          </p>
          <div className="text-center">
            <div className="text-3xl sm:text-5xl font-bold text-baywatch-orange">
              {formatTime(timeLeft.days)}d {formatTime(timeLeft.hours)}h {formatTime(timeLeft.minutes)}m {formatTime(timeLeft.seconds)}s
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
