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
    <section className="py-10 sm:py-16 bg-black relative z-10">
      <div className="container mx-auto px-3 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="p-4 sm:p-8 card-gradient rounded-xl border border-baywatch-orange/30 shadow-lg hover:shadow-baywatch-orange/20 transition-all duration-300">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6 text-center">
              <span className="text-white">Get In</span>
              <span className="text-baywatch-orange glow-orange ml-2">Touch</span>
            </h2>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-8 mt-6 sm:mt-8">
              {/* Email with copy functionality */}
              <div className="relative group w-full sm:w-auto">
                <button 
                  onClick={copyEmail}
                  className="w-full sm:w-auto flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-black/40 hover:bg-black/60 rounded-lg border border-gray-700 hover:border-baywatch-orange/50 transition-all duration-300"
                  aria-label="Copy email to clipboard"
                >
                  <i className="fas fa-envelope text-baywatch-orange mr-2 sm:mr-3"></i>
                  <span className="text-sm sm:text-base">frc@harborps.org</span>
                  <i className="fas fa-copy ml-2 sm:ml-3 text-gray-400 group-hover:text-white"></i>
                </button>
                {copied && (
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-baywatch-orange text-white text-sm px-3 py-1 rounded opacity-100 transition-opacity duration-300">
                    Copied!
                  </span>
                )}
              </div>
              
              {/* Contact form button */}
              <Link 
                to="/become-a-sponsor"
                className="w-full sm:w-auto text-center inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-baywatch-orange to-orange-700 rounded-lg text-white font-semibold hover:scale-105 transition-all duration-300 shadow-[0_0_15px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)]"
              >
                <i className="fas fa-paper-plane mr-2"></i>
                <span className="text-sm sm:text-base">Contact Form</span>
              </Link>
            </div>
            
            <p className="text-gray-400 text-center mt-6 sm:mt-8 text-xs sm:text-sm md:text-base">
              Have questions or want to reach out about a sponsorship. You can reach us at frc@harborps.org or through{' '}
              <Link to="/become-a-sponsor" className="text-baywatch-orange hover:underline">
                this contact form.
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
