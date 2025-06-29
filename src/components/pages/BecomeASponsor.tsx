import { Hero, ContactInfo, SponsorshipForm } from '../sections/becomeasponsor';

export default function BecomeASponsor() {
  return (
      <div className="relative min-h-screen">
        <div className="absolute inset-0 bg-black"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-baywatch-dark to-black opacity-50"></div>
        <div className="relative z-10">
          <Hero />
          <ContactInfo />
          <SponsorshipForm />
        </div>
      </div>
  );
}
