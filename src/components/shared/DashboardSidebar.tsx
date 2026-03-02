import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { HomeIcon, ClipboardDocumentCheckIcon, ClipboardIcon, PresentationChartLineIcon, UsersIcon, Squares2X2Icon, PencilSquareIcon, ArchiveBoxIcon, UserCircleIcon, ShieldCheckIcon, ArrowRightStartOnRectangleIcon, UserGroupIcon, TrophyIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import NotificationDot from '../common/NotificationDot';

interface DashboardSidebarProps {
  isMobile?: boolean;
  onNavigate?: () => void;
}

export default function DashboardSidebar({ isMobile = false, onNavigate }: DashboardSidebarProps) {
  const { user, logout } = useAuth();
  const channelsHaveUnread = false;
  const messagesHaveUnread = false;
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    if (onNavigate) onNavigate();
  };

  const handleNavigation = () => {
    if (onNavigate) onNavigate();
  };
  // Navigation
  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: HomeIcon },
    { name: 'Match', href: '/dashboard/match', icon: ClipboardDocumentCheckIcon },
    { name: 'Pit', href: '/dashboard/pit', icon: ClipboardIcon },
    { name: 'Teams', href: '/dashboard/teams', icon: UserGroupIcon },
    { name: 'Rankings', href: '/dashboard/rankings', icon: TrophyIcon },
    { name: 'Schedule', href: '/dashboard/schedule', icon: CalendarDaysIcon },
    { name: 'Archive', href: '/dashboard/archive', icon: ArchiveBoxIcon },
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
  ];

  const scoutingAdminNavigation = [
    { name: 'Analytics', href: '/dashboard/analytics', icon: PresentationChartLineIcon },
    { name: 'Alliances', href: '/dashboard/alliances', icon: UsersIcon },
    { name: 'Simulations', href: '/dashboard/simulations', icon: Squares2X2Icon },
    { name: 'Strategy', href: '/dashboard/strategy', icon: PencilSquareIcon },
  ];

  const adminNavigation = [
    { name: 'Users', href: '/admin/users', icon: ShieldCheckIcon },
    { name: 'Public Users', href: '/admin/public-users', icon: UsersIcon },
  ];

  if (isMobile) {
    return (
      <div className="text-white">
        {/* Mobile Menu Content */}
        <div className="space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={handleNavigation}
              className={`relative flex items-center px-3 py-3 text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors ${
                location.pathname === item.href ? 'bg-baywatch-orange text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span>{item.name}</span>
              {item.name === 'Overview' && channelsHaveUnread && (
                <NotificationDot show={true} position="absolute-right" size="small" />
              )}
              {item.name === 'Match' && messagesHaveUnread && (
                <NotificationDot show={true} position="absolute-right" size="small" />
              )}
            </Link>
          ))}

          {user?.isAdmin && (
            <>
              <div className="pt-4 mt-4 border-t border-gray-700">
                <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Strategy
                </h3>
                {scoutingAdminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={handleNavigation}
                    className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors ${
                      location.pathname === item.href ? 'bg-baywatch-orange text-white' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
          
          {user?.isAdmin && (
              <div className="pt-4 mt-4 border-t border-gray-700">
                <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Admin
                </h3>
                {adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={handleNavigation}
                    className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors ${
                      location.pathname === item.href ? 'bg-baywatch-orange text-white' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
          )}
          
          <div className="pt-4 mt-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-3 text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors text-gray-300 hover:text-white"
            >
              <ArrowRightStartOnRectangleIcon className="w-5 h-5 mr-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col w-16 hover:w-56 bg-black text-white transition-all duration-200 overflow-hidden">
      {/* Header with inset divider */}
      <div className="flex items-center h-16 px-2">
        <div className="flex-1 flex items-center border-b border-gray-700">
          <Link to="/" className="flex items-center mb-2 px-2 gap-3">
            <img src="/assets/images/logo.svg" alt="Baywatch Robotics Logo" className="w-12 h-12 shrink-0" />
            <span className="text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">FRC 7790</span>
          </Link>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`relative flex items-center py-2 px-2.5 text-sm font-medium rounded-xl hover:text-baywatch-orange ${
              location.pathname === item.href ? 'bg-baywatch-orange text-white hover:text-white' : ''
            }`}
          >
            <item.icon className="w-6 h-6 shrink-0" />
            <span className="ml-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">{item.name}</span>
            {item.name === 'Overview' && channelsHaveUnread && (
              <NotificationDot show={true} position="top-right" size="small" />
            )}
            {item.name === 'Match' && messagesHaveUnread && (
              <NotificationDot show={true} position="top-right" size="small" />
            )}
          </Link>
        ))}
        {user?.isAdmin && (
          <div className="pt-4 mt-4 space-y-2 border-t border-gray-700">
            <span className="px-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">Strategy</span>
            {scoutingAdminNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center py-2 px-2.5 text-sm font-medium rounded-xl hover:text-baywatch-orange ${
                  location.pathname === item.href ? 'bg-baywatch-orange text-white hover:text-white' : ''
                }`}
              >
                <item.icon className="w-6 h-6 shrink-0" />
                <span className="ml-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">{item.name}</span>
              </Link>
            ))}
            <span className="px-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">Admin</span>
            {adminNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center py-2 px-2.5 text-sm font-medium rounded-xl hover:text-baywatch-orange ${
                  location.pathname === item.href ? 'bg-baywatch-orange text-white hover:text-white' : ''
                }`}
              >
                <item.icon className="w-6 h-6 shrink-0" />
                <span className="ml-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">{item.name}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>
      {/* Footer with inset divider */}
      <div className="px-2">
        <div className="border-t border-gray-700 p-4">
          <button
            onClick={handleLogout}
            className="flex items-center w-full py-2 px-2.5 text-sm font-medium rounded-xl hover:text-baywatch-orange"
          >
            <ArrowRightStartOnRectangleIcon className="w-6 h-6 shrink-0" />
            <span className="ml-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
