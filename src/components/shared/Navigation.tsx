import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useTeamContext } from '../../hooks/useTeamContext';
import { getTeamColor } from '../../utils/color';

interface NavigationItem {
  name: string;
  href: string;
}

const navigationItems: NavigationItem[] = [
  { name: 'Robots', href: '/robots' },
  { name: 'Sponsors', href: '/sponsors' },
  { name: 'Schedule', href: '/schedule' },
  { name: 'Scouting', href: '/scouting' },
  { name: 'FTC', href: '/ftc' },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated, user, logout } = useAuth();
  const { isTeamPage, teamNumber } = useTeamContext();
  const location = useLocation();
  const navigate = useNavigate();

  // Get the accent color for team pages, fallback to orange
  const accentColor = isTeamPage && teamNumber ? getTeamColor(teamNumber) || '#f97316' : '#f97316';

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      
      // Only show navbar when at the top of the page
      if (currentScroll === 0) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // If the query is only digits, treat as team number
    if (/^\d+$/.test(query)) {
      navigate(`/team?team=${query}`);
      return;
    }

    // If the query matches typical event code pattern like 2024miket
    if (/^\d{4}[a-z0-9]+$/i.test(query)) {
      navigate(`/event?event=${query}`);
      return;
    }

    // If the query does not contain any spaces, treat it as an event code without a year and prepend the current year
    if (!/\s/.test(query)) {
      const currentYear = new Date().getFullYear();
      const eventCodeWithYear = currentYear + query;
      navigate(`/event?event=${eventCodeWithYear}`);
      return;
    }

    // Otherwise navigate to search results
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 transform ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Link
            to="/"
            className="flex items-center space-x-2 transition-all duration-300 hover:scale-105"
          >
            <img
              src="/assets/images/logo.svg"
              alt="Baywatch Robotics Logo"
              className="w-16 h-16 sm:w-20 sm:h-20"
            />
          </Link>
        </div>

        {/* Search Bar (Desktop) */}
        <div 
          className="hidden md:flex items-center bg-black/30 rounded-lg border border-gray-700 transition-all duration-300 px-3 py-1 mx-4 flex-grow max-w-md"
          style={{
            borderColor: '#374151'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = `${accentColor}50`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#374151';
          }}
        >
          <form onSubmit={handleSearch} className="flex items-center w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team or event..."
              className="bg-transparent border-none focus:outline-none text-white w-full"
              aria-label="Search for team or event"
            />
            <button
              type="submit"
              className="text-gray-400 transition-colors"
              style={{ color: '#9ca3af' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = accentColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9ca3af';
              }}
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </form>
        </div>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-8">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.href}
                className="transition-all duration-300 hover:scale-110 inline-block"
                style={{
                  color: location.pathname === item.href ? accentColor : 'white'
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== item.href) {
                    e.currentTarget.style.color = accentColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== item.href) {
                    e.currentTarget.style.color = 'white';
                  }
                }}
              >
                {item.name}
              </Link>
            </li>
          ))}
          {isAuthenticated ? (
            <>
              <li>
                <Link
                  to="/dashboard"
                  className="transition-all duration-300 hover:scale-110 inline-block"
                  style={{
                    color: location.pathname === '/dashboard' ? accentColor : 'white'
                  }}
                  onMouseEnter={(e) => {
                    if (location.pathname !== '/dashboard') {
                      e.currentTarget.style.color = accentColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (location.pathname !== '/dashboard') {
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                >
                  Dashboard
                </Link>
              </li>
            </>
          ) : (
            <li>
              <Link
                to="/login"
                className="transition-all duration-300 hover:scale-110 inline-block"
                style={{
                  color: location.pathname === '/login' ? accentColor : 'white'
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== '/login') {
                    e.currentTarget.style.color = accentColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== '/login') {
                    e.currentTarget.style.color = 'white';
                  }
                }}
              >
                Login
              </Link>
            </li>
          )}
        </ul>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white transition-colors"
          style={{ color: 'white' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = accentColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'white';
          }}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle mobile menu"
        >
          {isOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden backdrop-blur-sm h-screen border-t border-gray-700/30">
          <div className="px-4 py-6 space-y-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="flex items-center bg-black/30 rounded-lg border border-gray-700 px-3 py-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search team # or event..."
                className="bg-transparent border-none focus:outline-none text-white w-full"
              />
              <button 
                type="submit" 
                className="text-gray-400 transition-colors"
                style={{ color: '#9ca3af' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = accentColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#9ca3af';
                }}
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </form>

            {/* Mobile Navigation Links */}
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="block py-2 text-lg transition-colors"
                style={{
                  color: location.pathname === item.href ? accentColor : 'white'
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== item.href) {
                    e.currentTarget.style.color = accentColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== item.href) {
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="block py-2 text-lg transition-colors"
                  style={{
                    color: location.pathname === '/dashboard' ? accentColor : 'white'
                  }}
                  onMouseEnter={(e) => {
                    if (location.pathname !== '/dashboard') {
                      e.currentTarget.style.color = accentColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (location.pathname !== '/dashboard') {
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/calendar"
                  className="block py-2 text-lg transition-colors"
                  style={{
                    color: location.pathname === '/calendar' ? accentColor : 'white'
                  }}
                  onMouseEnter={(e) => {
                    if (location.pathname !== '/calendar') {
                      e.currentTarget.style.color = accentColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (location.pathname !== '/calendar') {
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onClick={() => setIsOpen(false)}
                >
                  Calendar
                </Link>
                <Link
                  to="/tasks"
                  className="block py-2 text-lg transition-colors"
                  style={{
                    color: location.pathname === '/tasks' ? accentColor : 'white'
                  }}
                  onMouseEnter={(e) => {
                    if (location.pathname !== '/tasks') {
                      e.currentTarget.style.color = accentColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (location.pathname !== '/tasks') {
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onClick={() => setIsOpen(false)}
                >
                  Tasks
                </Link>
                <Link
                  to="/profile"
                  className="block py-2 text-lg transition-colors"
                  style={{
                    color: location.pathname === '/profile' ? accentColor : 'white'
                  }}
                  onMouseEnter={(e) => {
                    if (location.pathname !== '/profile') {
                      e.currentTarget.style.color = accentColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (location.pathname !== '/profile') {
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
                {user?.isAdmin && (
                  <Link
                    to="/admin/users"
                    className="block py-2 text-lg transition-colors"
                    style={{
                      color: location.pathname === '/admin/users' ? accentColor : 'white'
                    }}
                    onMouseEnter={(e) => {
                      if (location.pathname !== '/admin/users') {
                        e.currentTarget.style.color = accentColor;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (location.pathname !== '/admin/users') {
                        e.currentTarget.style.color = 'white';
                      }
                    }}
                    onClick={() => setIsOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="block py-2 text-lg transition-colors"
                  style={{ color: 'white' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = accentColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'white';
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block py-2 text-lg transition-colors"
                style={{
                  color: location.pathname === '/login' ? accentColor : 'white'
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== '/login') {
                    e.currentTarget.style.color = accentColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== '/login') {
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
