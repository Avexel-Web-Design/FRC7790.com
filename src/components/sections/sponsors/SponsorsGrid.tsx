export default function SponsorsGrid() {
  const sponsors = [
    {
      name: "Brown Motors",
      logo: "/assets/images/Sponsors/BrownMotors.png",
      url: "https://brownmotors.com"
    },
    {
      name: "Harbor Springs Public Schools",
      logo: "/assets/images/Sponsors/HarborSpringsPublicSchools.png", 
      url: "https://harborps.org"
    },
    {
      name: "First Community Bank",
      logo: "/assets/images/Sponsors/FirstCommunityBank.svg",
      url: "https://firstcb.com"
    },
    {
      name: "North Central Michigan College",
      logo: "/assets/images/Sponsors/NCMC.png",
      url: "https://ncmich.edu"
    },
    {
      name: "Avexel",
      logo: "/assets/images/Sponsors/Avexel.png",
      url: "https://avexel.co"
    },
    {
      name: "Michigan Scientific",
      logo: "/assets/images/Sponsors/MichiganScientific.png",
      url: "https://michsci.com"
    },
    {
      name: "Evening Star Joinery",
      logo: "/assets/images/Sponsors/EveningStarJoinery.png",
      url: "https://eveningstarjoinery.com"
    },
    {
      name: "Mastercam", 
      logo: "/assets/images/Sponsors/Mastercam.svg",
      url: "https://mastercam.com"
    },
    {
      name: "Burns & McDonnell",
      logo: "/assets/images/Sponsors/Burns-&McDonnell_logo.png",
      url: "#"
    },
    {
      name: "Lyric",
      logo: "/assets/images/Sponsors/lyric.png",
      url: "#"
    },
    {
      name: "Surf Internet",
      logo: "/assets/images/Sponsors/SURF_Horiz_Navy_Blue_PMS_logo_Logo.png",
      url: "#"
    },
    {
      name: "Rocking Horse",
      logo: "/assets/images/Sponsors/Rocking+Horse+background+and+logo+Red-02.webp",
      url: "#"
    },
    {
      name: "Sunrise",
      logo: "/assets/images/Sponsors/Sunrise.avif",
      url: "#"
    },
    {
      name: "Petoskey Plastics",
      logo: "/assets/images/Sponsors/PetoskeyPlastics.png",
      url: "#"
    },
    {
      name: "Harbor Barber",
      logo: "/assets/images/Sponsors/Harbor-Barber.svg",
      url: "#"
    },
    {
      name: "Dave Kring",
      logo: "/assets/images/Sponsors/Dave-Kring.png",
      url: "#"
    },
    {
      name: "Johnston Engineering",
      logo: "/assets/images/Sponsors/JohnstonEngineering.png",
      url: "#"
    }
  ];

  return (
    <section className="py-20 sm:py-16 relative z-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sponsors.map((sponsor) => (
            <a
              key={sponsor.name}
              href={sponsor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-gradient rounded-xl p-8 flex flex-col items-center justify-center group hover:scale-105 transition-all duration-300"
            >
              <div className="bg-white/10 rounded-xl p-6 w-full aspect-square flex items-center justify-center">
                <img
                  src={sponsor.logo}
                  alt={`${sponsor.name} Logo`}
                  className="w-full h-full object-contain filter brightness-100 group-hover:brightness-110 transition-all duration-300"
                />
              </div>
              <h3 className="text-xl font-bold mt-4 text-baywatch-orange">
                {sponsor.name}
              </h3>
            </a>
          ))}

          {/* Become a Sponsor Card */}
          <a
            href="/become-a-sponsor"
            className="card-gradient rounded-xl p-8 flex flex-col items-center justify-center group hover:scale-105 transition-all duration-300"
          >
            <div className="bg-white/10 rounded-xl p-6 w-full aspect-square flex items-center justify-center">
              <i className="fas fa-handshake text-5xl text-baywatch-orange"></i>
            </div>
            <h3 className="text-xl font-bold mt-4 text-baywatch-orange">
              Become a Sponsor
            </h3>
          </a>
        </div>
      </div>
    </section>
  );
}
