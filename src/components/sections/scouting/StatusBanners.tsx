interface Props {
  loading: boolean;
  error: string | null;
  hasTeams: boolean;
}

export default function StatusBanners({ loading, error }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center mt-8">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-baywatch-orange" />
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
