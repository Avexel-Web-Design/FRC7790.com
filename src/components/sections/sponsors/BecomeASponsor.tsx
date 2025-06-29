export default function BecomeASponsor() {
  const sponsorshipBenefits = [
    {
      level: "Platinum ($5,000+)",
      benefits: [
        "Large logo on robot and team materials",
        "Team presentation at your business",
        "Social media recognition throughout season",
        "Invitation to exclusive sponsor events",
        "Custom team merchandise package"
      ],
      color: "from-gray-300 to-gray-500"
    },
    {
      level: "Gold ($2,500+)",
      benefits: [
        "Medium logo on robot and materials",
        "Social media recognition",
        "Invitation to competitions",
        "Team merchandise package"
      ],
      color: "from-yellow-400 to-yellow-600"
    },
    {
      level: "Silver ($1,000+)",
      benefits: [
        "Small logo on robot",
        "Recognition on website",
        "Competition updates",
        "Team photo"
      ],
      color: "from-gray-400 to-gray-600"
    },
    {
      level: "Bronze ($500+)",
      benefits: [
        "Name recognition on materials",
        "Website acknowledgment",
        "Season summary report"
      ],
      color: "from-amber-600 to-amber-800"
    }
  ];

  return (
    <section id="become-sponsor" className="py-20 bg-gradient-to-b from-black to-baywatch-dark/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Become a Sponsor</h2>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Your support helps us compete at the highest level while inspiring the next generation of STEM leaders. 
            Join our mission to build robots, develop skills, and strengthen our community.
          </p>
        </div>

        {/* Why Sponsor Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="card-gradient rounded-xl p-6 text-center">
            <i className="fas fa-graduation-cap text-3xl text-baywatch-orange mb-4"></i>
            <h3 className="text-xl font-bold mb-2">Inspire Students</h3>
            <p className="text-gray-400">Support STEM education and help students develop real-world engineering skills</p>
          </div>
          <div className="card-gradient rounded-xl p-6 text-center">
            <i className="fas fa-users text-3xl text-baywatch-orange mb-4"></i>
            <h3 className="text-xl font-bold mb-2">Build Community</h3>
            <p className="text-gray-400">Connect with local families and demonstrate your commitment to education</p>
          </div>
          <div className="card-gradient rounded-xl p-6 text-center">
            <i className="fas fa-rocket text-3xl text-baywatch-orange mb-4"></i>
            <h3 className="text-xl font-bold mb-2">Drive Innovation</h3>
            <p className="text-gray-400">Be part of cutting-edge robotics and technology development</p>
          </div>
        </div>        {/* Sponsorship Levels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {sponsorshipBenefits.map((level) => (
            <div key={level.level} className="card-gradient rounded-xl p-8">
              <h3 className={`text-2xl font-bold mb-4 bg-gradient-to-r ${level.color} bg-clip-text text-transparent`}>
                {level.level}
              </h3>
              <ul className="space-y-2">
                {level.benefits.map((benefit, benefitIndex) => (
                  <li key={benefitIndex} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-baywatch-orange rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Information */}
        <div className="card-gradient rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Support Our Team?</h3>
          <p className="text-gray-400 mb-6">
            Contact us to discuss sponsorship opportunities and learn more about how your support makes a difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:frc@harborps.org"
              className="bg-baywatch-orange hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
            >
              <i className="fas fa-envelope mr-2"></i>
              Email Us
            </a>
            <a
              href="tel:+1234567890"
              className="border border-baywatch-orange text-baywatch-orange hover:bg-baywatch-orange hover:text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
            >
              <i className="fas fa-phone mr-2"></i>
              Call Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
