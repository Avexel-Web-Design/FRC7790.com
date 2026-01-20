import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Contact() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('frc@harborps.org');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy email: ', err);
    }
  };

  return (
    <section className="py-16 sm:py-20 bg-black relative z-10">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Two-column layout on desktop */}
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            
            {/* Left: Our Team */}
            <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-baywatch-orange/10 to-transparent border border-baywatch-orange/20 group hover:border-baywatch-orange/40 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-baywatch-orange/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-baywatch-orange to-orange-400 bg-clip-text text-transparent">
                Our Team
              </h2>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                We are Baywatch Robotics, a passionate team from Harbor Springs High School committed to driving innovation and excellence in robotics, furthering creativity, problem solving and ingenuity.
              </p>
              
              <Link
                to="/become-a-sponsor"
                onClick={() => window.scrollTo(0, 0)}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-baywatch-orange to-orange-600 rounded-lg text-white font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-baywatch-orange/30"
              >
                Become a Sponsor
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
            
            {/* Right: Get in Touch */}
            <div className="relative p-6 sm:p-8 rounded-2xl bg-black/60 border border-gray-800 hover:border-gray-700 transition-all duration-300">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
                Get in <span className="text-baywatch-orange">Touch</span>
              </h2>
              
              <p className="text-gray-400 mb-6">
                Have questions or want to reach out about a sponsorship? We'd love to hear from you.
              </p>
              
              <div className="space-y-3">
                {/* Email with copy functionality */}
                <div className="relative">
                  <button 
                    onClick={copyEmail}
                    className="w-full flex items-center justify-between px-4 py-3 bg-black/40 hover:bg-black/60 rounded-lg border border-gray-700 hover:border-baywatch-orange/50 transition-all duration-300 group"
                    aria-label="Copy email to clipboard"
                  >
                    <div className="flex items-center">
                      <i className="fas fa-envelope text-baywatch-orange mr-3"></i>
                      <span>frc@harborps.org</span>
                    </div>
                    <i className={`fas ${copied ? 'fa-check text-green-400' : 'fa-copy text-gray-400 group-hover:text-white'} transition-colors`}></i>
                  </button>
                  {copied && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      Copied!
                    </span>
                  )}
                </div>
                
                {/* Contact form button */}
                <Link 
                  to="/become-a-sponsor"
                  onClick={() => window.scrollTo(0, 0)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-black/40 hover:bg-black/60 rounded-lg border border-gray-700 hover:border-baywatch-orange/50 transition-all duration-300 group"
                >
                  <div className="flex items-center">
                    <i className="fas fa-paper-plane text-baywatch-orange mr-3"></i>
                    <span>Contact Form</span>
                  </div>
                  <i className="fas fa-arrow-right text-gray-400 group-hover:text-baywatch-orange transition-colors"></i>
                </Link>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
}
