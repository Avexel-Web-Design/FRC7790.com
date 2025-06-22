export default function TeamCalendar() {
  const teamEvents = [
    {
      type: "Build Season",
      title: "Robot Build Continues",
      date: "January 2025",
      description: "Intensive build period leading up to competitions",
      icon: "fas fa-tools"
    },
    {
      type: "Competition",
      title: "Great Lakes Bay Regional",
      date: "March 14-16, 2025",
      description: "First district competition",
      icon: "fas fa-trophy"
    },
    {
      type: "Competition", 
      title: "Traverse City Regional",
      date: "March 28-30, 2025",
      description: "Second district competition",
      icon: "fas fa-trophy"
    },
    {
      type: "Championship",
      title: "FIM District Championship",
      date: "April 9-12, 2025",
      description: "State championship (pending qualification)",
      icon: "fas fa-crown"
    },
    {
      type: "World Championship",
      title: "FIRST Championship",
      date: "April 17-20, 2025", 
      description: "World championship in Houston (pending qualification)",
      icon: "fas fa-globe"
    },
    {
      type: "Outreach",
      title: "Community Demo Day",
      date: "May 2025",
      description: "Robot demonstrations and STEM outreach",
      icon: "fas fa-users"
    }
  ];

  const getEventColor = (type: string) => {
    switch(type) {
      case 'Build Season': return 'text-blue-400';
      case 'Competition': return 'text-baywatch-orange';
      case 'Championship': return 'text-yellow-400';
      case 'World Championship': return 'text-purple-400';
      case 'Outreach': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-black to-baywatch-dark/20">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold mb-16 text-center">Team Calendar</h2>
        
        <div className="max-w-4xl mx-auto">
          {/* Timeline */}
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-baywatch-orange to-transparent"></div>
            
            <div className="space-y-12">
              {teamEvents.map((event, index) => (
                <div key={event.title} className="relative flex items-start" style={{ animationDelay: `${0.1 * index}s` }}>
                  {/* Timeline Dot */}
                  <div className="absolute left-0 w-12 h-12 bg-baywatch-dark border-4 border-baywatch-orange rounded-full flex items-center justify-center">
                    <i className={`${event.icon} ${getEventColor(event.type)}`}></i>
                  </div>
                  
                  {/* Event Content */}
                  <div className="ml-20 card-gradient rounded-xl p-6 hover:scale-105 transition-all duration-300 flex-1">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1">
                        <div className={`text-sm font-medium mb-1 ${getEventColor(event.type)}`}>
                          {event.type}
                        </div>
                        <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                        <p className="text-gray-400 mb-2">{event.description}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <i className="fas fa-calendar text-baywatch-orange"></i>
                          <span>{event.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Meeting Schedule */}
        <div className="mt-20 card-gradient rounded-xl p-8">
          <h3 className="text-2xl font-bold mb-6 text-center">Team Meeting Schedule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-semibold mb-4 text-baywatch-orange">Regular Season</h4>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <i className="fas fa-clock text-baywatch-orange"></i>
                  <span>Mondays & Wednesdays: 3:30-6:00 PM</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-clock text-baywatch-orange"></i>
                  <span>Saturdays: 9:00 AM-3:00 PM</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-map-marker-alt text-baywatch-orange"></i>
                  <span>Harbor Springs High School</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-4 text-baywatch-orange">Build Season</h4>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <i className="fas fa-clock text-baywatch-orange"></i>
                  <span>Daily: 3:30-8:00 PM</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-clock text-baywatch-orange"></i>
                  <span>Saturdays: 8:00 AM-6:00 PM</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-exclamation-circle text-baywatch-orange"></i>
                  <span>Intensive build period</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
