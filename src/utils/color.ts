export const generateColor = (username: string): string => {
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