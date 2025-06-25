interface EventInfo {
  name: string;
  start_date: string;
  location: string;
  num_teams: number;
  tba_link: string;
  stat_link: string;
}

export default function EventInfoCard({ info }: { info: EventInfo }) {
  if (!info) return null;
  return (
    <section id="event-info" className="container mx-auto px-6 max-w-2xl animate__animated animate__fadeInUp" style={{ animationDelay: '0.5s' }}>
      <div className="card-gradient text-center border border-baywatch-orange/30 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-2 text-baywatch-orange">
          {info.name}
        </h2>
        <p className="text-gray-300 text-sm mb-1">
          {info.start_date} | {info.location}
        </p>
        <p className="text-gray-400 text-sm mb-3">
          {info.num_teams} teams
        </p>
        <div className="flex gap-4 justify-center text-sm">
          <a
            href={info.tba_link}
            className="text-baywatch-orange hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on TBA
          </a>
          <a
            href={info.stat_link}
            className="text-baywatch-orange hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Statbotics
          </a>
        </div>
      </div>
    </section>
  );
}
