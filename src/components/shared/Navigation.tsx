import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

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
  const location = useLocation();
  const navigate = useNavigate();

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
        <div className="hidden md:flex items-center bg-black/30 rounded-lg border border-gray-700 hover:border-baywatch-orange/50 transition-all duration-300 px-3 py-1 mx-4 flex-grow max-w-md">
          <form onSubmit={handleSearch} className="flex items-center w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team # or event..."
              className="bg-transparent border-none focus:outline-none text-white w-full"
              aria-label="Search for team or event"
            />
            <button
              type="submit"
              className="text-gray-400 hover:text-baywatch-orange transition-colors"
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
                className={`hover:text-baywatch-orange transition-all duration-300 hover:scale-110 inline-block ${
                  location.pathname === item.href ? 'text-baywatch-orange' : ''
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white hover:text-baywatch-orange transition-colors"
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
        <div className="md:hidden border-t border-gray-700/30">
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
              <button type="submit" className="text-gray-400 hover:text-baywatch-orange transition-colors">
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </form>

            {/* Mobile Navigation Links */}
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block py-2 text-lg hover:text-baywatch-orange transition-colors ${
                  location.pathname === item.href ? 'text-baywatch-orange' : ''
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
