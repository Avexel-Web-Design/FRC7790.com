import React from "react";
import Hero from "../components/team/Hero";
import Coaches from "../components/team/Coaches";
import Mentors from "../components/team/Mentors";
import Captains from "../components/team/Captains";
import Subteams from "../components/team/Subteams";

const Team = () => {
  return <div className="relative w-full overflow-hidden" style={{ margin: 0, padding: 0 }}>
    <Hero />
    <Coaches />
    <Mentors />
    <Captains />
    <Subteams />
  </div>;
};

export default Team;