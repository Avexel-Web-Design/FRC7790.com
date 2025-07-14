import { useTeamContext } from '../../hooks/useTeamContext';
import { getTeamColor } from '../../utils/color';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { isTeamPage, teamNumber } = useTeamContext();
  
  // Get the accent color for team pages, fallback to orange
  const accentColor = isTeamPage && teamNumber ? getTeamColor(teamNumber) || '#f97316' : '#f97316';

  return (
    <footer className="bg-black py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex space-x-4 mb-4 md:mb-0">
            <a
              href="https://youtube.com/@frc7790"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl social-icon youtube transition-colors"
              style={{ color: accentColor }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#dc2626'; // YouTube red
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = accentColor;
              }}
            >
              <i className="fab fa-youtube"></i>
            </a>
            <a
              href="https://instagram.com/frc7790"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl social-icon instagram transition-colors"
              style={{ color: accentColor }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ec4899'; // Instagram pink
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = accentColor;
              }}
            >
              <i className="fab fa-instagram"></i>
            </a>
          </div>
          <div className="text-gray-400 text-sm">
            © {currentYear} Baywatch Robotics. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
