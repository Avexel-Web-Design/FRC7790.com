interface TeamLinksProps {
  teamNumber: string;
  teamData: any;
}

export default function TeamLinks({ teamNumber }: TeamLinksProps) {
  // Common social media links for FRC teams
  const getTeamLinks = () => {
    const links = [];
    
    // Default links that most teams have
    links.push({
      name: 'The Blue Alliance',
      url: `https://www.thebluealliance.com/team/${teamNumber}`,
      icon: 'fas fa-chart-line',
      description: 'Team statistics and match history'
    });

    // Team 7790 specific links
    if (teamNumber === '7790') {
      links.push({
        name: 'YouTube',
        url: 'https://youtube.com/@frc7790',
        icon: 'fab fa-youtube',
        description: 'Team videos and robot reveals'
      });
      
      links.push({
        name: 'Instagram',
        url: 'https://instagram.com/frc7790',
        icon: 'fab fa-instagram',
        description: 'Behind the scenes content'
      });
    } else {
    }

    // FIRST Inspires link
    links.push({
      name: 'FIRST Inspires',
      url: `https://frc-events.firstinspires.org/team/${teamNumber}`,
      icon: 'fas fa-robot',
      description: 'Official FIRST team profile'
    });

    return links;
  };

  const teamLinks = getTeamLinks();

  return (
    <div className="card-gradient rounded-xl p-6 animate__animated animate__fadeIn border border-gray-800" style={{animationDelay: '0.4s'}}>
      <h2 className="text-2xl font-bold mb-6 text-center">Team Links</h2>
      <div className="space-y-4">
        {teamLinks.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-black/30 rounded-lg hover:bg-black/50 transition-all duration-300 hover:scale-105 group"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <i className={`${link.icon} text-orange-500 text-xl group-hover:text-orange-400 transition-colors`}></i>
              </div>
              <div className="flex-grow">
                <div className="font-medium text-white group-hover:text-orange-500 transition-colors">
                  {link.name}
                  <i className="fas fa-external-link-alt ml-2 text-xs opacity-60"></i>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {link.description}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
