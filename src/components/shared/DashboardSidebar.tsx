import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { HashtagIcon, CalendarIcon, CheckCircleIcon, UserCircleIcon, ShieldCheckIcon, ChatBubbleLeftRightIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';
import NotificationDot from '../common/NotificationDot';
import NotificationStatus from '../common/NotificationStatus';

export default function DashboardSidebar() {
  const { user, logout } = useAuth();
  const { 
    channelsHaveUnread, 
    messagesHaveUnread, 
    calendarHasUpdates, 
    tasksHaveUpdates, 
    notificationCounts, 
    markCalendarAsViewed,
    markTasksAsViewed
  } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
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

  return (
    <div className="flex flex-col w-16 bg-black text-white">
      {/* Header with inset divider */}
      <div className="flex items-center justify-center h-16 px-2">
        <div className="flex-1 flex items-center justify-center border-b border-gray-700">
          <Link to="/" className="flex items-center mb-2 space-x-2">
            <img src="/assets/images/logo.svg" alt="Baywatch Robotics  Logo" className="w-12 h-12" />
          </Link>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`relative flex items-center justify-center py-2 text-sm font-medium rounded-xl hover:text-baywatch-orange transition-all duration-200 ${
              location.pathname === item.href ? 'bg-baywatch-orange text-white hover:text-white' : ''
            }`}
            onClick={() => {
              // Mark sections as viewed when clicked
              if (item.name === 'Calendar' && calendarHasUpdates) {
                markCalendarAsViewed();
              } else if (item.name === 'Tasks' && tasksHaveUpdates) {
                markTasksAsViewed();
              }
            }}
          >
            <item.icon className="w-6 h-6" />
            {/* Show notification dot for channels */}
            {item.name === 'Channels' && channelsHaveUnread && (
              <NotificationDot 
                show={true} 
                position="top-right" 
                size="small" 
                showCount={notificationCounts.channels > 1}
                count={notificationCounts.channels}
              />
            )}
            {/* Show notification dot for messages */}
            {item.name === 'Messages' && messagesHaveUnread && (
              <NotificationDot 
                show={true} 
                position="top-right" 
                size="small"
                showCount={notificationCounts.messages > 1}
                count={notificationCounts.messages}
              />
            )}
            {/* Show notification dot for calendar */}
            {item.name === 'Calendar' && calendarHasUpdates && (
              <NotificationDot 
                show={true} 
                position="top-right" 
                size="small"
                showCount={false}
                color="blue"
                animate={true}
              />
            )}
            {/* Show notification dot for tasks */}
            {item.name === 'Tasks' && tasksHaveUpdates && (
              <NotificationDot 
                show={true} 
                position="top-right" 
                size="small"
                showCount={false}
                color="green"
                animate={true}
              />
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
        <div className="border-t border-gray-700 p-4 space-y-3">
          {/* Notification Status */}
          <div className="text-center">
            <NotificationStatus />
          </div>
          
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
