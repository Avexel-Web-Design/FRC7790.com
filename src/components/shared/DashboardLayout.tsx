import type { ReactNode } from 'react';
import DashboardSidebar from './DashboardSidebar';
import MobileDashboardNav from './MobileDashboardNav';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="h-screen bg-gray-100">
      {/* Desktop Layout */}
      <div className="hidden md:flex h-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-black">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden h-full flex flex-col">
        {/* Mobile Content (fills screen, with safe area padding) */}
        <main 
          className="flex-1 overflow-x-hidden overflow-y-auto bg-black"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' // 56px is nav height
          }}
        >
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileDashboardNav />
      </div>
    </div>
  );
}
