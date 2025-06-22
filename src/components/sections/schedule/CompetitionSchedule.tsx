export default function CompetitionSchedule() {
  const competitions = [
    {
      name: "FIM District - Great Lakes Bay Regional",
      date: "March 14-16, 2025",
      location: "Bay City, MI",
      status: "upcoming",
      description: "Our first district event of the 2025 season"
    },
    {
      name: "FIM District - Traverse City Regional", 
      date: "March 28-30, 2025",
      location: "Traverse City, MI",
      status: "upcoming",
      description: "Second district event, closer to home"
    },
    {
      name: "FIM District Championship",
      date: "April 9-12, 2025", 
      location: "Eastern Michigan University",
      status: "pending",
      description: "State championship - qualification pending"
    },
    {
      name: "FIRST Championship",
      date: "April 17-20, 2025",
      location: "Houston, TX",
      status: "pending", 
      description: "World championship - qualification pending"
    }
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'upcoming': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-baywatch-orange';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'upcoming': return 'Confirmed';
      case 'pending': return 'Pending Qualification';
      case 'completed': return 'Completed';
      default: return 'TBD';
    }
  };

  return (
    <section id="competitions" className="py-20 bg-black">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold mb-16 text-center">2025 Competition Season</h2>
          <div className="max-w-4xl mx-auto space-y-8">
          {competitions.map((competition) => (
            <div key={competition.name} className="card-gradient rounded-xl p-8 hover:scale-105 transition-all duration-300">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(competition.status)}`}></div>
                    <span className={`text-sm font-medium ${getStatusColor(competition.status).replace('bg-', 'text-')}`}>
                      {getStatusText(competition.status)}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{competition.name}</h3>
                  <p className="text-gray-400 mb-2">{competition.description}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-calendar text-baywatch-orange"></i>
                      <span>{competition.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="fas fa-map-marker-alt text-baywatch-orange"></i>
                      <span>{competition.location}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 lg:mt-0 lg:ml-6">
                  <button className="border border-baywatch-orange text-baywatch-orange hover:bg-baywatch-orange hover:text-white px-4 py-2 rounded-lg transition-all duration-300">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Season Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card-gradient rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-baywatch-orange mb-2">4</div>
            <div className="text-gray-400">Competitions</div>
          </div>
          <div className="card-gradient rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-baywatch-orange mb-2">12</div>
            <div className="text-gray-400">Weeks</div>
          </div>
          <div className="card-gradient rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-baywatch-orange mb-2">50+</div>
            <div className="text-gray-400">Teams Expected</div>
          </div>
          <div className="card-gradient rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-baywatch-orange mb-2">Goal</div>
            <div className="text-gray-400">Worlds Qualification</div>
          </div>
        </div>
      </div>
    </section>
  );
}
