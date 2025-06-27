import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { HomeIcon, CalendarIcon, CheckCircleIcon, UserCircleIcon, ArrowRightOnRectangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function DashboardSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
    { name: 'Tasks', href: '/tasks', icon: CheckCircleIcon },
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
  ];

  const adminNavigation = [
    { name: 'Users', href: '/admin/users', icon: ShieldCheckIcon },
  ];

  return (
    <div className="flex flex-col w-64 bg-gray-800 text-white">
      <div className="flex items-center justify-center h-20 border-b border-gray-700">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/assets/images/logo.svg" alt="Baywatch Robotics Logo" className="w-12 h-12" />
          <span className="text-xl font-bold">Baywatch</span>
        </Link>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-700 ${
              location.pathname === item.href ? 'bg-gray-900' : ''
            }`}
          >
            <item.icon className="w-6 h-6 mr-3" />
            {item.name}
          </Link>
        ))}
        {user?.isAdmin && (
          <div className="pt-4 mt-4 space-y-2 border-t border-gray-700">
            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</h3>
            {adminNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-700 ${
                  location.pathname === item.href ? 'bg-gray-900' : ''
                }`}
              >
                <item.icon className="w-6 h-6 mr-3" />
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </nav>
      <div className="border-t border-gray-700 p-4">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-700"
        >
          <ArrowRightOnRectangleIcon className="w-6 h-6 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
}
