import { useState } from 'react';

interface HeroProps {
  defaultEvent?: string;
  onLoadEvent: (code: string) => void;
};

export default function Hero({ defaultEvent = '', onLoadEvent }: HeroProps) {
  const [code, setCode] = useState(defaultEvent);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    onLoadEvent(code.trim());
  };

  return (
    <section className="pt-32 pb-16 relative z-10">
      <div className="container mx-auto px-6">
      <h1 className="text-5xl md:text-7xl font-bold text-center">
          <span 
            className="text-white inline-block animate__animated animate__fadeInUp" 
            style={{ animationDelay: '0.1s' }}
          >
            FRC
          </span>
          {' '}
          <span 
            className="text-baywatch-orange glow-orange inline-block animate__animated animate__fadeInUp" 
            style={{ animationDelay: '0.2s' }}
          >
            Scouting
          </span>
        </h1>
        <p 
          className="text-gray-400 text-center mt-4 max-w-2xl mx-auto animate__animated animate__fadeInUp" 
          style={{ animationDelay: '0.3s' }}
        >
          Compare and rank teams at events using EPA (Expected Points Added) statistics from Statbotics and power ratings from The Blue Alliance. Track team selection during alliance selections.
        </p>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row items-center mt-4 justify-center gap-4 max-w-lg mx-auto animate__animated animate__fadeInUp"
          style={{ animationDelay: '0.4s' }}
        >
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter event code (e.g. 2025milac)"
            className="flex-1 px-4 py-2 rounded bg-black/40 border border-gray-700 focus:outline-none"
          />
          <button
            type="submit"
            className="btn-orange-glow px-4 py-2 rounded font-semibold hover:scale-105 transition-transform"
          >
            Search
          </button>
        </form>
      </div>
    </section>
  );
}
