export const generateColor = (username: string, customColor?: string | null): string => {
  // Use custom color if available
  if (customColor) {
    return customColor;
  }

  // Fallback color when username is empty or undefined
  if (!username) {
    return "#cccccc";
  }

  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    // Simple hash based on character codes
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";
  // Convert hash to RGB hex
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }

  return color;
};

// Special team colors for specific teams
const TEAM_COLORS: Record<string, string> = {
  '7790': '#ff6b00', // baywatch-orange
  '3767': '#68be5c', // green
  '7598': '#7b00ff', // purple
  '5560': '#002aff', // light blue (skyblue)
};

export const getTeamColor = (teamNumber: string): string | null => {
  return TEAM_COLORS[teamNumber] || null;
};

export const getTeamTextClasses = (teamNumber: string): string => {
  const color = getTeamColor(teamNumber);
  if (!color) return '';
  
  // Return appropriate Tailwind classes or custom styles
  switch (teamNumber) {
    case '7790':
      return 'text-baywatch-orange font-bold';
    case '3767':
      return 'font-bold';
    case '7598':
      return 'font-bold';
    case '5590':
      return 'font-bold';
    default:
      return '';
  }
};

export const getTeamHoverClasses = (teamNumber: string): string => {
  switch (teamNumber) {
    case '7790':
      return 'hover:text-orange-600';
    case '3767':
      return 'hover:opacity-80';
    case '7598':
      return 'hover:opacity-80';
    case '5590':
      return 'hover:opacity-80';
    default:
      return '';
  }
};

export const getTeamCardGradientClass = (teamNumber: string): string => {
  switch (teamNumber) {
    case '3767':
      return 'card-gradient-3767';
    case '7598':
      return 'card-gradient-7598';
    case '5560':
      return 'card-gradient-5560';
    default:
      return 'card-gradient';
  }
};

export const getTeamPrimaryColorClass = (teamNumber: string): string => {
  switch (teamNumber) {
    case '3767':
      return 'text-green-500'; // Green for team 3767
    case '7598':
      return 'text-purple-500'; // Purple for team 7598  
    case '5560':
      return 'text-blue-500'; // Blue for team 5560
    default:
      return 'text-baywatch-orange'; // Default orange
  }
};

export const getTeamAccentStyle = (teamNumber: string): React.CSSProperties => {
  const color = getTeamColor(teamNumber);
  return color ? { color } : {};
};

export const getTeamGlowClass = (teamNumber: string): string => {
  switch (teamNumber) {
    case '3767':
      return 'glow-3767';
    case '7598':
      return 'glow-7598';
    case '5560':
      return 'glow-5560';
    default:
      return 'glow-orange';
  }
};