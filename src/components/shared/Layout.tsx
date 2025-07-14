import type { ReactNode } from 'react';
import { useEffect } from 'react';
import Navigation from './Navigation';
import Footer from './Footer';
import { useTeamContext } from '../../hooks/useTeamContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isTeamPage, teamNumber, isSpecialTeam } = useTeamContext();

  // Apply team-specific classes to body for text selection styling
  useEffect(() => {
    const body = document.body;
    
    // Remove any existing team classes
    body.classList.remove('team-3767', 'team-7598', 'team-5560');
    
    // Add team-specific class if on a special team page
    if (isTeamPage && isSpecialTeam && teamNumber) {
      body.classList.add(`team-${teamNumber}`);
    }
    
    // Cleanup on unmount
    return () => {
      body.classList.remove('team-3767', 'team-7598', 'team-5560');
    };
  }, [isTeamPage, teamNumber, isSpecialTeam]);

  return (
    <div className="min-h-screen bg-baywatch-dark text-white overflow-x-hidden font-poppins">
      <Navigation />
      <main>
        {children}
      </main>
      <Footer />
    </div>
  );
}
