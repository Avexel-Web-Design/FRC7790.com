import React from "react";
import useScrollReveal from "../../hooks/useScrollReveal";

// Placeholder image for team members - replace with actual team photos
const placeholderImage = "/Logo-nobg-sm.png";

const Team = () => {
  useScrollReveal();

  const teamMembers = {
    subteams: [
      {
        name: "Mechanical Team",
        description: "Designs and builds the physical robot structure and mechanisms.",
        members: ["Elizabeth C", "Jenna B", "Brooke W"]
      },
      {
        name: "Drive Team",
        description: "Controls the robot at competitions.",
        members: ["Brooke W", "Beatrice D", "Jenna B", "November B", "Elizabeth C"]
      },
      {
        name: "Controls Team",
        description: "Creates and maintains the robot's power systems and electronic components.",
        members: ["Tori W", "Beatrice D", "Neha J", "November B"]
      },
      {
        name: "Spirit Team",
        description: "Brings on the image, spirit, and energy of the team.",
        members: ["Tori W", "Neha J"]
      }
    ]
  };

  return (
    <section
      id="team"
      className="relative py-20 md:py-28"
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IHgxPSIxMDAlIiB5MT0iMjEuMTgxJSIgeDI9IjUwJSIgeTI9IjEwMCUiIGlkPSJhIj48c3RvcCBzdG9wLWNvbG9yPSIjNkM2M0ZGIiBvZmZzZXQ9IjAlIi8+PHN0b3Agc3RvcC1jb2xvcj0iIzZDNjNGRiIgc3RvcC1vcGFjaXR5PSIwIiBvZmZzZXQ9IjEwMCUiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9InVybCgjYSkiIG9wYWNpdHk9Ii4wNSIgZD0iTTAgNDRoNDR2NDRIMHoiIHRyYW5zZm9ybT0icm90YXRlKC00NSA0NS4zNTUgNjcuNjQ1KSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Subteams */}
          <div>
            <h3 className="text-2xl font-bold mb-10 text-center text-white reveal-bottom">
              Subteams
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {teamMembers.subteams.map((team, index) => (
                <SubteamCard
                  key={index}
                  name={team.name}
                  description={team.description}
                  members={team.members}
                  revealDirection={
                    index % 2 === 0 ? "left" : "right"
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-purple-500/10 blur-3xl -z-10" aria-hidden="true"></div>
      <div className="absolute bottom-0 right-0 w-1/2 h-64 bg-blue-500/10 blur-3xl -z-10" aria-hidden="true"></div>
    </section>
  );
};

const SubteamCard = ({ name, description, members, revealDirection }) => (
  <div className={`bg-white/5 backdrop-blur-sm p-4 sm:p-6 rounded-xl hover:bg-white/10 transition-all duration-300 reveal-${revealDirection} team-card`}>
    <h4 className="text-lg sm:text-xl font-bold text-white mb-3">{name}</h4>
    <p className="text-gray-300 mb-4 text-sm sm:text-base leading-relaxed">{description}</p>
    <div className="flex flex-wrap gap-2">
      {members.map((member, index) => (
        <span
          key={index}
          className="px-3 py-1 bg-indigo-600/20 rounded-full text-sm text-indigo-200"
        >
          {member}
        </span>
      ))}
    </div>
  </div>
);

export default Team;