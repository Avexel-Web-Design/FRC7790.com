export default function FTCTeam() {
  const teamInfo = {
    teamNumber: "15814",
    teamName: "Metal Makers",
    school: "Harbor Springs Middle School",
    mentors: ["John Smith", "Jane Doe"],
    students: 8,
    yearsActive: 3
  };

  const achievements = [
    "Regional Qualifier 2024",
    "Design Award Winner",
    "Think Award Nominee",
    "Community Partnership"
  ];

  return (
    <section id="ftc-team" className="py-20 bg-black">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">FTC Team #{teamInfo.teamNumber}</h2>
          <h3 className="text-3xl font-bold text-baywatch-orange mb-4 font-anurati glow-orange">
            {teamInfo.teamName}
          </h3>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Our middle school FTC team serves as a feeder program for our high school FRC team, 
            introducing younger students to the exciting world of competitive robotics.
          </p>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="card-gradient rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-baywatch-orange mb-2">{teamInfo.students}</div>
            <div className="text-gray-400">Active Students</div>
          </div>
          <div className="card-gradient rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-baywatch-orange mb-2">{teamInfo.yearsActive}</div>
            <div className="text-gray-400">Years Active</div>
          </div>
          <div className="card-gradient rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-baywatch-orange mb-2">2</div>
            <div className="text-gray-400">Mentors</div>
          </div>
          <div className="card-gradient rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-baywatch-orange mb-2">4+</div>
            <div className="text-gray-400">Awards</div>
          </div>
        </div>

        {/* What is FTC */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h3 className="text-2xl font-bold mb-6">What is FIRST Tech Challenge?</h3>
            <div className="space-y-4 text-gray-300">
              <p>
                FIRST Tech Challenge (FTC) is a robotics competition for middle and high school students. 
                Teams design, build, and program robots to compete in an alliance format against other teams.
              </p>
              <p>
                The robot kit contains modern Android-based communication and control modules, 
                along with a variety of sensors, servos, and building components.
              </p>
              <ul className="space-y-2 list-disc list-inside text-gray-400">
                <li>12-week build season</li>
                <li>30cm x 30cm x 45cm size limit</li>
                <li>Android-based control system</li>
                <li>Java/Blocks programming</li>
                <li>Team size: 3-15 students</li>
              </ul>
            </div>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold mb-6">Our Achievements</h3>
            <div className="space-y-3">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-baywatch-orange rounded-full"></div>
                  <span className="text-gray-300">{achievement}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-8 card-gradient rounded-lg p-6">
              <h4 className="text-lg font-semibold text-baywatch-orange mb-3">Team Leadership</h4>
              <div className="space-y-2">
                <div>
                  <strong>School:</strong> <span className="text-gray-400">{teamInfo.school}</span>
                </div>
                <div>
                  <strong>Mentors:</strong> <span className="text-gray-400">{teamInfo.mentors.join(", ")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Join FTC */}
        <div className="card-gradient rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Interested in Joining FTC?</h3>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Our FTC team is open to middle school students who are interested in robotics, programming, 
            and engineering. No prior experience required - just enthusiasm to learn!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:frc@harborps.org"
              className="bg-baywatch-orange hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
            >
              <i className="fas fa-envelope mr-2"></i>
              Contact Us
            </a>
            <a
              href="#ftc-robots"
              className="border border-baywatch-orange text-baywatch-orange hover:bg-baywatch-orange hover:text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
            >
              See Our Robots
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
