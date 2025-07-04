import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generateColor } from '../utils/color';

export const useAvatarColor = (username: string, customColor?: string | null) => {
  const { user } = useAuth();
  const [color, setColor] = useState<string>(() => generateColor(username, customColor));

  useEffect(() => {
    // If this is the current user, use their stored avatar color
    if (user && user.username === username) {
      setColor(generateColor(username, user.avatarColor));
    } else {
      setColor(generateColor(username, customColor));
    }
  }, [username, customColor, user]);

  return color;
};
