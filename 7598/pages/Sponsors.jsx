import React from "react";
import Hero from "../components/sponsors/Hero";
import SponsorList from "../components/sponsors/SponsorList";
import BecomeSponsor from "../components/sponsors/BecomeSponsor";

const Sponsors = () => {
  return <div className="relative w-full overflow-hidden" style={{ margin: 0, padding: 0 }}>
    <Hero />
    <SponsorList />
    <BecomeSponsor />
  </div>;
};

export default Sponsors;