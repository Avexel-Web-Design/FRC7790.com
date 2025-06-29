import NebulaLoader from '../../common/NebulaLoader';

interface Props {
  loading: boolean;
  error: string | null;
  hasTeams: boolean;
}

export default function StatusBanners({ loading, error }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center mt-8 mb-4">
        <NebulaLoader size={50} />
        <span className="ml-3 text-gray-300">Fetching event data…</span>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-center text-red-400 mt-6">{error}</p>
    );
  }

  return null;
}
