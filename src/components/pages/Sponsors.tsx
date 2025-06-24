import SponsorsHero from '../sections/sponsors/SponsorsHero';
import SponsorsGrid from '../sections/sponsors/SponsorsGrid';

export default function Sponsors() {
  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-black"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-baywatch-dark to-black opacity-50"></div>
      <div className="relative z-10">
        <SponsorsHero />
        <SponsorsGrid />
      </div>
    </div>
  );
}
