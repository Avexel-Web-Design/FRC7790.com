import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Hero from "../components/photos/Hero";
import DeepSpace from "../components/photos/DeepSpace";
import InfiniteRecharge from "../components/photos/InfiniteRecharge";
import AtHome from "../components/photos/AtHome";
import RapidReact from "../components/photos/RapidReact";
import ChargedUp from "../components/photos/ChargedUp";
import Crescendo from "../components/photos/Crescendo";
import Reefscape from "../components/photos/Reefscape";

const Photos = () => {
  const location = useLocation();
  const [activeGallery, setActiveGallery] = useState("reefscape"); // Default to most recent
  
  // Check for hash in URL on initial load and when URL changes
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash && isValidGallery(hash)) {
      setActiveGallery(hash);
      // Smooth scroll to the gallery
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 300);
    }
  }, [location]);

  // Helper function to check if the provided hash is a valid gallery
  const isValidGallery = (gallery) => {
    return [
      "deepspace",
      "infiniterecharge",
      "athome",
      "rapidreact",
      "chargedup",
      "crescendo",
      "reefscape"
    ].includes(gallery);
  };

  return (
    <div className="relative w-full overflow-hidden" style={{ margin: 0, padding: 0 }}>
      <Hero />
      
      {/* Only render the active gallery */}
      {activeGallery === "deepspace" && <DeepSpace />}
      {activeGallery === "infiniterecharge" && <InfiniteRecharge />}
      {activeGallery === "athome" && <AtHome />}
      {activeGallery === "rapidreact" && <RapidReact />}
      {activeGallery === "chargedup" && <ChargedUp />}
      {activeGallery === "crescendo" && <Crescendo />}
      {activeGallery === "reefscape" && <Reefscape />}
    </div>
  );
};

export default Photos;