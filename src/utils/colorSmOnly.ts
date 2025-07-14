// Utility to return team card gradient classes with sm: prefix for each class
import { getTeamCardGradientClass } from './color';

export function getTeamCardGradientClassSmOnly(teamNumber: string): string {
  const base = getTeamCardGradientClass(teamNumber);
  // Split classes and prefix each with sm:
  return base
    .split(' ')
    .map(cls => `sm:${cls}`)
    .join(' ');
}
