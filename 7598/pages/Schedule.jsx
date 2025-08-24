import React from "react";
import Hero from "../components/schedule/Hero";
import Event1 from "../components/schedule/Event1";
import Event2 from "../components/schedule/Event2";
import States from "../components/schedule/States";
import Worlds from "../components/schedule/Worlds";

const Schedule = () => {
  return <div className="relative w-full overflow-hidden" style={{ margin: 0, padding: 0 }}>
    <Hero />
    
    {/* Add spacer div between components */}
    <div className="h-16"></div>
    
    <Event1 />
    
    {/* Add spacer div between components */}
    <div className="h-20"></div>
    
    <Event2 />
    
    {/* Add spacer div between components */}
    <div className="h-20"></div>
    
    <States />
    
    {/* Add spacer div between components */}
    <div className="h-20"></div>
    
    <Worlds />
  </div>;
};

export default Schedule;