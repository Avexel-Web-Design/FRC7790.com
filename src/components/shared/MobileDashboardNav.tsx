import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { HashtagIcon, CalendarIcon, CheckCircleIcon, UserCircleIcon, ChatBubbleLeftRightIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import NotificationDot from '../common/NotificationDot';

export default function MobileDashboardNav() {
  const { user } = useAuth();
  const { channelsHaveUnread, messagesHaveUnread } = useNotifications();
  const location = useLocation();

  // Base navigation items
  const baseNavigation = [
    { name: 'Channels', href: '/dashboard', icon: HashtagIcon, showUnread: channelsHaveUnread },
    { name: 'Messages', href: '/messages', icon: ChatBubbleLeftRightIcon, showUnread: messagesHaveUnread },
    { name: 'Calendar', href: '/calendar', icon: CalendarIcon, showUnread: false },
    { name: 'Tasks', href: '/tasks', icon: CheckCircleIcon, showUnread: false },
  ];

  // Add profile and admin based on screen size and user role
  const navigation = [
    ...baseNavigation,
    ...(user?.isAdmin ? [
      { name: 'Admin', href: '/admin/users', icon: ShieldCheckIcon, showUnread: false }
    ] : [
      { name: 'Profile', href: '/profile', icon: UserCircleIcon, showUnread: false }
    ])
  ];

  return (
    <div className="bg-black border-t border-gray-700 px-1 py-2 sticky bottom-0 z-30">
      <nav className="flex items-center justify-around">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors min-w-0 ${
              location.pathname === item.href 
                ? 'bg-baywatch-orange text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="relative">
              <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              {item.showUnread && (
                <NotificationDot show={true} position="top-right" size="small" />
              )}
            </div>
            <span className="text-xs mt-0.5 font-medium truncate max-w-full">
              {item.name}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
