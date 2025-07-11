import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { HashtagIcon, CalendarIcon, CheckCircleIcon, UserCircleIcon, ShieldCheckIcon, ChatBubbleLeftRightIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';
import NotificationDot from '../common/NotificationDot';

interface DashboardSidebarProps {
  isMobile?: boolean;
  onNavigate?: () => void;
}

export default function DashboardSidebar({ isMobile = false, onNavigate }: DashboardSidebarProps) {
  const { user, logout } = useAuth();
  const { channelsHaveUnread, messagesHaveUnread } = useNotifications();
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

  const navigation = [
    { name: 'Channels', href: '/dashboard', icon: HashtagIcon },
    { name: 'Messages', href: '/messages', icon: ChatBubbleLeftRightIcon },
    { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
    { name: 'Tasks', href: '/tasks', icon: CheckCircleIcon },
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
  ];

  const adminNavigation = [
    { name: 'Users', href: '/admin/users', icon: ShieldCheckIcon },
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
              {/* Show notification dot for channels */}
              {item.name === 'Channels' && channelsHaveUnread && (
                <NotificationDot show={true} position="absolute-right" size="small" />
              )}
              {/* Show notification dot for messages */}
              {item.name === 'Messages' && messagesHaveUnread && (
                <NotificationDot show={true} position="absolute-right" size="small" />
              )}
            </Link>
          ))}
          
          {user?.isAdmin && (
            <>
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
            </>
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
    <div className="flex flex-col w-16 bg-black text-white">
      {/* Header with inset divider */}
      <div className="flex items-center justify-center h-16 px-2">
        <div className="flex-1 flex items-center justify-center border-b border-gray-700">
          <Link to="/" className="flex items-center mb-2 space-x-2">
            <img src="/assets/images/logo.svg" alt="Baywatch Robotics Logo" className="w-12 h-12" />
          </Link>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`relative flex items-center justify-center py-2 text-sm font-medium rounded-xl hover:text-baywatch-orange ${
              location.pathname === item.href ? 'bg-baywatch-orange text-white hover:text-white' : ''
            }`}
          >
            <item.icon className="w-6 h-6" />
            {/* Show notification dot for channels */}
            {item.name === 'Channels' && channelsHaveUnread && (
              <NotificationDot show={true} position="top-right" size="small" />
            )}
            {/* Show notification dot for messages */}
            {item.name === 'Messages' && messagesHaveUnread && (
              <NotificationDot show={true} position="top-right" size="small" />
            )}
          </Link>
        ))}
        {user?.isAdmin && (
          <div className="pt-4 mt-4 space-y-2 border-t border-gray-700">
            {adminNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center justify-center py-2 text-sm font-medium rounded-xl hover:text-baywatch-orange ${
                  location.pathname === item.href ? 'bg-baywatch-orange text-white hover:text-white' : ''
                }`}
              >
                <item.icon className="w-6 h-6" />
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
            className="flex items-center w-full justify-center py-2 text-sm font-medium rounded-xl hover:text-baywatch-orange"
          >
            <ArrowRightStartOnRectangleIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
