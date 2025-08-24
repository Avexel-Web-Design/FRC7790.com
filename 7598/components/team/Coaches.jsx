import React from "react";
import useScrollReveal from "../../hooks/useScrollReveal";

// Function to get correct asset path
const getAssetPath = (path) => {
  return new URL(`/public/${path}`, import.meta.url).href;
};

// Placeholder image for team members - replace with actual team photos
const placeholderImage = getAssetPath("Logo-nobg-sm.png");

const Team = () => {
  useScrollReveal();

  const teamMembers = {
    coaches: [
      {
        name: "Katie B",
        role: "Head Coach/Business Mentor",
        image: placeholderImage,
        bio: "Leads the team's overall direction while specializing in business strategy, sponsorship development, and team organization. Helps students build professional skills and manage team resources."
      },
      {
        name: "Andrew G",
        role: "Head Coach/Mechanical Mentor",
        image: placeholderImage,
        bio: "Oversees team operations and provides expertise in mechanical design, fabrication techniques, and robot construction. Helps students translate engineering concepts into real-world applications."
      },
    ],
  };

  return (
    <section
      id="team"
      className="relative py-20 md:py-28"
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IHgxPSIxMDAlIiB5MT0iMjEuMTgxJSIgeDI9IjUwJSIgeTI9IjEwMCUiIGlkPSJhIj48c3RvcCBzdG9wLWNvbG9yPSIjNkM2M0ZGIiBvZmZzZXQ9IjAlIi8+PHN0b3Agc3RvcC1jb2xvcj0iIzZDNjNGRiIgc3RvcC1vcGFjaXR5PSIwIiBvZmZzZXQ9IjEwMCUiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9InVybCgjYSkiIG9wYWNpdHk9Ii4wNSIgZD0iTTAgNDRoNDR2NDRIMHoiIHRyYW5zZm9ybT0icm90YXRlKC00NSA0NS4zNTUgNjcuNjQ1KSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Coaches section */}
          <div className="mb-20">
            <h3 className="text-2xl font-bold mb-10 text-center text-white reveal-bottom">
              Coaches
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {teamMembers.coaches.map((coach, index) => (
                <TeamMemberCard
                  key={index}
                  name={coach.name}
                  role={coach.role}
                  image={coach.image}
                  bio={coach.bio}
                  revealDirection={index === 0 ? "left" : index === teamMembers.coaches.length - 1 ? "right" : "bottom"}
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

const TeamMemberCard = ({ name, role, image, bio, revealDirection }) => (
  <div className={`bg-white/5 backdrop-blur-sm p-4 sm:p-6 rounded-xl transition-all duration-300 hover:bg-white/10 reveal-${revealDirection} team-card`}>
    <div className="flex flex-col items-center text-center">
      <div className="w-20 h-20 sm:w-24 sm:h-24 mb-3 sm:mb-4 rounded-full overflow-hidden p-1 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
        <img src={image} alt={name} className="rounded-full w-full h-full object-cover" />
      </div>
      <h4 className="text-lg sm:text-xl font-bold text-white mb-1">{name}</h4>
      <p className="text-blue-300 text-sm mb-2 sm:mb-3">{role}</p>
      <p className="text-gray-400 text-sm sm:text-base text-center leading-relaxed">{bio}</p>
    </div>
  </div>
);

export default Team;