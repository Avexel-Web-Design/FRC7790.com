export default function FTCRobots() {
  const ftcRobots = [
    {
      year: "2024-25",
      game: "INTO THE DEEP",
      robotName: "Deep Diver",
      description: "Our current robot designed for the INTO THE DEEP challenge, featuring autonomous specimen collection and precise basket scoring.",
      image: "/assets/images/Into the Deep/15814.png",
      features: [
        "Specimen Collection Arm",
        "High/Low Basket Scoring", 
        "Submersible Climb",
        "Autonomous Navigation"
      ],
      keySpecs: {
        "Drive System": "Mecanum Wheels",
        "Programming": "Java with Road Runner",
        "Control System": "REV Control Hub",
        "Sensors": "IMU, Color, Distance"
      }
    },
    {
      year: "2023-24", 
      game: "CENTERSTAGE",
      robotName: "Stage Master",
      description: "Built for the CENTERSTAGE challenge, featuring pixel manipulation and backdrop scoring capabilities.",
      image: "/assets/images/logo.png", // Placeholder
      features: [
        "Pixel Intake System",
        "Backdrop Scoring",
        "Autonomous Pixel Placement",
        "Hanging Mechanism"
      ],
      keySpecs: {
        "Drive System": "Tank Drive",
        "Programming": "Blocks + Java",
        "Intake": "Active Roller System",
        "Lifting": "Linear Slide System"
      }
    }
  ];

  return (
    <section id="ftc-robots" className="py-20 bg-gradient-to-b from-black to-baywatch-dark/20">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold mb-16 text-center">FTC Robots</h2>
        
        <div className="space-y-20">
          {ftcRobots.map((robot, index) => (
            <div key={robot.year} className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12`}>
              {/* Robot Image */}
              <div className="lg:w-1/2">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-baywatch-orange/20 to-transparent rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <img
                    src={robot.image}
                    alt={`${robot.robotName} Robot`}
                    className="relative w-full max-w-lg mx-auto object-contain rounded-xl transform group-hover:scale-105 transition-all duration-300"
                  />
                </div>
              </div>
              
              {/* Robot Info */}
              <div className="lg:w-1/2 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-baywatch-orange mb-2">{robot.year} - {robot.game}</h3>
                  <h4 className="text-3xl font-bold text-white mb-4">{robot.robotName}</h4>
                  <p className="text-gray-400 leading-relaxed">{robot.description}</p>
                </div>
                
                {/* Features */}
                <div>
                  <h5 className="text-lg font-semibold text-baywatch-orange mb-3">Key Features</h5>
                  <div className="grid grid-cols-2 gap-3">
                    {robot.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-baywatch-orange rounded-full"></div>
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Technical Specs */}
                <div className="card-gradient rounded-lg p-6">
                  <h5 className="font-bold text-baywatch-orange mb-3">Technical Specifications</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(robot.keySpecs).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium text-white">{key}:</span>
                        <span className="text-gray-400 ml-2">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FTC vs FRC Comparison */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold mb-12 text-center">FTC vs FRC</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card-gradient rounded-xl p-8">
              <h4 className="text-2xl font-bold text-baywatch-orange mb-6">FTC (Tech Challenge)</h4>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start space-x-2">
                  <i className="fas fa-users text-baywatch-orange mt-1"></i>
                  <span>3-15 students per team</span>
                </li>
                <li className="flex items-start space-x-2">
                  <i className="fas fa-cube text-baywatch-orange mt-1"></i>
                  <span>30cm x 30cm x 45cm robot size</span>
                </li>
                <li className="flex items-start space-x-2">
                  <i className="fas fa-mobile-alt text-baywatch-orange mt-1"></i>
                  <span>Android-based control system</span>
                </li>
                <li className="flex items-start space-x-2">
                  <i className="fas fa-code text-baywatch-orange mt-1"></i>
                  <span>Java or Blocks programming</span>
                </li>
                <li className="flex items-start space-x-2">
                  <i className="fas fa-clock text-baywatch-orange mt-1"></i>
                  <span>12-week build season</span>
                </li>
                <li className="flex items-start space-x-2">
                  <i className="fas fa-dollar-sign text-baywatch-orange mt-1"></i>
                  <span>Lower cost of entry</span>
                </li>
              </ul>
            </div>
            
            <div className="card-gradient rounded-xl p-8">
              <h4 className="text-2xl font-bold text-baywatch-orange mb-6">FRC (Robotics Competition)</h4>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start space-x-2">
                  <i className="fas fa-users text-baywatch-orange mt-1"></i>
                  <span>6-120 students per team</span>
                </li>
                <li className="flex items-start space-x-2">
                  <i className="fas fa-expand text-baywatch-orange mt-1"></i>
                  <span>125 lb robot weight limit</span>
                </li>
                <li className="flex items-start space-x-2">
                  <i className="fas fa-microchip text-baywatch-orange mt-1"></i>
                  <span>RoboRIO control system</span>
                </li>
                <li className="flex items-start space-x-2">
                  <i className="fas fa-code text-baywatch-orange mt-1"></i>
                  <span>Java, C++, Python programming</span>
                </li>
                <li className="flex items-start space-x-2">
                  <i className="fas fa-clock text-baywatch-orange mt-1"></i>
                  <span>6-week build season</span>
                </li>
                <li className="flex items-start space-x-2">
                  <i className="fas fa-trophy text-baywatch-orange mt-1"></i>
                  <span>Higher competition level</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
