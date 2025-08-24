import React from "react";
import Hero from "../components/home/Hero";
import About from "../components/home/About";
import Contact from "../components/home/Contact";

const Home = () => {
  return (
    <div className="relative w-full overflow-hidden" style={{ margin: 0, padding: 0 }}>
      <Hero />
      <About />
      <div className="h-20"></div>
      <Contact />
    </div>
  );
};

export default Home;