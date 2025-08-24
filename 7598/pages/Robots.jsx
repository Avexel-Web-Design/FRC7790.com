import React from "react";
import Hero from "../components/robots/Hero";
import Lune from "../components/robots/Lune";

const Robots = () => {
  return <div className="relative w-full overflow-hidden" style={{ margin: 0, padding: 0 }}>
    <Hero />
    <Lune />
  </div>;
};

export default Robots;