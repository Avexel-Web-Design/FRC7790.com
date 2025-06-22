import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-baywatch-dark border-t border-gray-800">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Team Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-4 mb-4">
              <img
                src="/assets/images/logo.svg"
                alt="Baywatch Robotics Logo"
                className="w-12 h-12"
              />
              <div>
                <h3 className="text-xl font-bold text-white">Baywatch Robotics</h3>
                <p className="text-gray-400">FRC Team 7790</p>
              </div>
            </div>
            <p className="text-gray-400 mb-4">
              Harbor Springs High School's FIRST Robotics Competition Team, inspiring STEM innovation through competitive robotics.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://youtube.com/@frc7790"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-baywatch-orange transition-colors"
                aria-label="YouTube"
              >
                <i className="fab fa-youtube text-2xl"></i>
              </a>
              <a
                href="https://instagram.com/frc7790"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-baywatch-orange transition-colors"
                aria-label="Instagram"
              >
                <i className="fab fa-instagram text-2xl"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/robots" className="text-gray-400 hover:text-baywatch-orange transition-colors">
                  Our Robots
                </Link>
              </li>
              <li>
                <Link to="/team" className="text-gray-400 hover:text-baywatch-orange transition-colors">
                  Team Members
                </Link>
              </li>
              <li>
                <Link to="/schedule" className="text-gray-400 hover:text-baywatch-orange transition-colors">
                  Competition Schedule
                </Link>
              </li>
              <li>
                <Link to="/sponsors" className="text-gray-400 hover:text-baywatch-orange transition-colors">
                  Our Sponsors
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Harbor Springs High School</li>
              <li>Harbor Springs, MI</li>
              <li>
                <a
                  href="mailto:frc@harborps.org"
                  className="hover:text-baywatch-orange transition-colors"
                >
                  frc@harborps.org
                </a>
              </li>
              <li>
                <Link
                  to="/become-a-sponsor"
                  className="text-baywatch-orange hover:text-orange-400 transition-colors"
                >
                  Become a Sponsor →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} Baywatch Robotics - FRC Team 7790. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-gray-400 hover:text-baywatch-orange text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-400 hover:text-baywatch-orange text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
