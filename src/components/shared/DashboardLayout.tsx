import type { ReactNode } from 'react';
import { useState } from 'react';
import DashboardSidebar from './DashboardSidebar';
import MobileDashboardNav from './MobileDashboardNav';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        {/* Mobile Header */}
        <div className="bg-black border-b border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-3">
            <img src="/assets/images/logo.svg" alt="Baywatch Robotics Logo" className="w-8 h-8" />
            <h1 className="text-white font-semibold text-lg">Dashboard</h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-white hover:text-baywatch-orange p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-black pb-16">
          <div className="safe-area-inset">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileDashboardNav />
      </div>

      {/* Mobile Slide-out Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-75 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-black border-l border-gray-700 overflow-y-auto transform transition-transform">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <img src="/assets/images/logo.svg" alt="Baywatch Robotics Logo" className="w-8 h-8" />
                  <h2 className="text-white text-xl font-semibold">Menu</h2>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white hover:text-baywatch-orange p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <DashboardSidebar 
                isMobile={true} 
                onNavigate={() => setIsMobileMenuOpen(false)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
