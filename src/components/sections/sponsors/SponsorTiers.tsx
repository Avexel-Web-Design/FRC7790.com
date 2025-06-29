export default function SponsorTiers() {
  const sponsorTiers = [
    {
      tier: "Platinum Sponsors",
      level: "$5,000+",
      color: "from-gray-300 to-gray-500",
      sponsors: [
        { name: "Harbor Springs High School", description: "Our home base and primary supporter" },
        { name: "Harbor Springs Public Schools", description: "Educational partner and facility provider" }
      ]
    },
    {
      tier: "Gold Sponsors",
      level: "$2,500+",
      color: "from-yellow-400 to-yellow-600",
      sponsors: [
        { name: "Local Business Partner", description: "Community supporter" }
      ]
    },
    {
      tier: "Silver Sponsors",
      level: "$1,000+",
      color: "from-gray-400 to-gray-600",
      sponsors: [
        { name: "Community Sponsor", description: "Supporting local STEM education" }
      ]
    },
    {
      tier: "Bronze Sponsors",
      level: "$500+",
      color: "from-amber-600 to-amber-800",
      sponsors: [
        { name: "Local Supporter", description: "Grassroots community support" }
      ]
    }
  ];

  return (
    <section id="sponsor-tiers" className="py-20 bg-black">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold mb-16 text-center">Thank You to Our Sponsors</h2>
        
        <div className="space-y-16">
          {sponsorTiers.map((tier, index) => (
            <div key={tier.tier} className="animate__animated animate__fadeInUp" style={{ animationDelay: `${0.2 * index}s` }}>
              {/* Tier Header */}
              <div className="text-center mb-8">
                <h3 className={`text-3xl font-bold bg-gradient-to-r ${tier.color} bg-clip-text text-transparent mb-2`}>
                  {tier.tier}
                </h3>
                <p className="text-gray-400">{tier.level}</p>
              </div>
              
              {/* Sponsors Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tier.sponsors.map((sponsor, sponsorIndex) => (
                  <div key={sponsorIndex} className="card-gradient rounded-xl p-6 text-center hover:scale-105 transition-all duration-300">
                    <div className="mb-4">
                      {/* Placeholder for sponsor logo */}
                      <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-r ${tier.color} flex items-center justify-center mb-4`}>
                        <i className="fas fa-handshake text-2xl text-white"></i>
                      </div>
                    </div>
                    <h4 className="text-xl font-bold mb-2">{sponsor.name}</h4>
                    <p className="text-gray-400 text-sm">{sponsor.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p className="text-gray-400 mb-6">Interested in supporting our team?</p>
          <a
            href="#become-sponsor"
            className="bg-baywatch-orange hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
          >
            Become a Sponsor
          </a>
        </div>
      </div>
    </section>
  );
}
