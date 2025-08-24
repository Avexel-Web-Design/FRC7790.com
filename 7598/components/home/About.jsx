import React from "react";
import useScrollReveal from "../../hooks/useScrollReveal";

const About = () => {
  useScrollReveal();

  return (
    <section
      id="about"
      className="relative py-20 md:py-28 bg-gradient-to-b from-[#471a67]/20 via-[#471a67]/30 to-[#471a67]/10"
    >
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Section header with staggered reveal animation */}
          <div className="text-center mb-16 stagger-reveal">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-[#471a67] to-[#d3b840] bg-clip-text text-transparent">
                About Our Team
              </span>
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Team 7598, the SCA Constellations, is an all-girls robotics team from St. Catherine of Siena Academy in Wixom, Michigan - 
              we're a community of future innovators, engineers, and leaders.
            </p>
          </div>

          {/* Content grid with modernized cards - ensure equal heights */}
          <div className="grid md:grid-cols-2 gap-12 items-stretch">
            {/* Left side - Mission with modern card styling */}
            <div className="reveal h-full flex flex-col">
              <div className="modern-card p-8 md:p-10 h-full flex flex-col">
                <h3 className="text-2xl font-bold mb-4 text-gradient">Our Mission</h3>
                
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <p className="mb-4 text-gray-300">
                      The SCA Constellations aim to inspire girls of all ages in science, technology, 
                      engineering, art, and mathematics while building essential skills like 
                      teamwork, leadership, and problem-solving. We strive to create a welcoming community
                      for people of all backgrounds and identities, where everyone can feel empowered to pursue their passions.
                    </p>
                    
                    <p className="text-gray-300">
                      As a team are dedicated to spreading the values of the feminine genius
                      through integrity in creation, unity in our fields, and involvement in our community,
                      while promoting growth in our distinct S.T.E.M. identity, innovative abilities, 
                      and inspirational experience.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - History with modern timeline */}
            <div className="reveal h-full flex flex-col">
              <div className="modern-card p-8 md:p-10 h-full flex flex-col">
                <h3 className="text-2xl font-bold mb-4 text-gradient">Our Journey</h3>
                
                <div className="space-y-6 relative flex-grow">
                  {/* Timeline connecting line */}
                  <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-[#d3b840] via-[#d3b840]/50 to-[#d3b840]/20"></div>
                  
                  <div className="flex group">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-sca-purple-light to-sca-purple-dark flex items-center justify-center shadow-neon z-10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(211,184,64,0.7)] group-hover:rotate-12">
                      <span className="font-bold text-[#d3b840] transition-colors duration-300">2018</span>
                    </div>
                    <div className="ml-6 transform hover:-translate-y-1 transition-transform duration-300">
                      <h4 className="text-lg font-medium text-white">Team Founding</h4>
                      <p className="text-sm text-gray-400">Established as the first FRC team at our school</p>
                    </div>
                  </div>

                  <div className="flex group">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-sca-purple-light to-sca-purple-dark flex items-center justify-center shadow-neon z-10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(211,184,64,0.7)] group-hover:rotate-12">
                      <span className="font-bold text-[#d3b840] transition-colors duration-300">2019</span>
                    </div>
                    <div className="ml-6 transform hover:-translate-y-1 transition-transform duration-300">
                      <h4 className="text-lg font-medium text-white">Rookie Season</h4>
                      <p className="text-sm text-gray-400">Went to the World Championship in our first season</p>
                    </div>
                  </div>

                  <div className="flex group">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-sca-purple-light to-sca-purple-dark flex items-center justify-center shadow-neon z-10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(211,184,64,0.7)] group-hover:rotate-12">
                      <span className="font-bold text-[#d3b840] transition-colors duration-300">2024</span>
                    </div>
                    <div className="ml-6 transform hover:-translate-y-1 transition-transform duration-300">
                      <h4 className="text-lg font-medium text-white">Community Inspiration</h4>
                      <p className="text-sm text-gray-400">Won our first Engineering Inspiration Award</p>
                    </div>
                  </div>

                  <div className="flex group">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-sca-purple-light to-sca-purple-dark flex items-center justify-center shadow-neon z-10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(211,184,64,0.7)] group-hover:rotate-12">
                      <span className="font-bold text-[#d3b840] transition-colors duration-300">2025</span>
                    </div>
                    <div className="ml-6 transform hover:-translate-y-1 transition-transform duration-300">
                      <h4 className="text-lg font-medium text-white">First Blue Banner</h4>
                      <p className="text-sm text-gray-400">Won a competition for the first time</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern decorative elements */}
      <div 
        className="absolute top-1/4 left-0 w-64 h-64 bg-gradient-radial from-[#471a67]/20 to-transparent rounded-full filter blur-3xl animate-pulse-slow" 
        aria-hidden="true"
      ></div>
      <div 
        className="absolute bottom-1/4 right-0 w-96 h-96 bg-gradient-radial from-[#d3b840]/10 to-transparent rounded-full filter blur-3xl animate-pulse-slow" 
        aria-hidden="true" 
        style={{animationDelay: '2s'}}
      ></div>
      <div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl max-h-4xl bg-gradient-radial from-[#471a67]/5 to-transparent rounded-full filter blur-3xl animate-pulse-slow" 
        aria-hidden="true"
        style={{animationDelay: '3s'}}
      ></div>
    </section>
  );
};

const ValueCard = ({ title, description, icon }) => (
  <div className="glass-panel p-6 rounded-xl hover:shadow-neon transition-all duration-300 hover:transform hover:scale-105">
    <div className="text-[#d3b840] mb-4">{icon}</div>
    <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
    <p className="text-gray-400">{description}</p>
  </div>
);

export default About;
