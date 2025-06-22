export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex space-x-4 mb-4 md:mb-0">
            <a
              href="https://youtube.com/@frc7790"
              target="_blank"
              rel="noopener noreferrer"
              className="text-baywatch-orange hover:text-orange-700 text-2xl social-icon youtube"
            >
              <i className="fab fa-youtube"></i>
            </a>
            <a
              href="https://instagram.com/frc7790"
              target="_blank"
              rel="noopener noreferrer"
              className="text-baywatch-orange hover:text-orange-700 text-2xl social-icon instagram"
            >
              <i className="fab fa-instagram"></i>
            </a>
          </div>
          <div className="text-gray-400 text-sm">
            © {currentYear} Baywatch Robotics. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
