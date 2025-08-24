import React, { useState } from "react";
import useScrollReveal from "../../hooks/useScrollReveal";

const Contact = () => {
  useScrollReveal();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically handle the form submission to your backend
    console.log("Form submitted:", formData);
    
    // For demonstration, we'll just show a success message
    setFormSubmitted(true);
    setFormData({ name: "", email: "", subject: "", message: "" });
    
    // Reset the form status after some time
    setTimeout(() => {
      setFormSubmitted(false);
    }, 5000);
  };

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText("kbrandt@saintcatherineacademy.org");
    setEmailCopied(true);
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setEmailCopied(false);
    }, 2000);
  };

  return (
    <section
      id="contact"
      className="relative py-20 md:py-28 bg-gradient-to-b from-[#471a67]/30 via-[#471a67]/20 to-black"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute top-0 left-0 w-full h-64 bg-[#471a67]/20 blur-3xl -z-10"></div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Section header with staggered reveal */}
          <div className="text-center mb-16 stagger-reveal">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-[#471a67] to-[#d3b840] bg-clip-text text-transparent">
                Contact Us
              </span>
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Have questions about our team? Interested in sponsoring us or requesting a demonstration?
              We'd love to hear from you!
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 mb-16">
            {/* Contact form with modern card styling */}
            <div className="lg:col-span-3 reveal">
              <div className="modern-card p-4 sm:p-6 md:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gradient mb-6">Get in Touch</h3>
                
                {formSubmitted ? (
                  <div className="glass-panel border border-[#d3b840]/30 rounded-lg p-6 text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#471a67]/40 to-[#d3b840]/40 rounded-full blur-xl opacity-70 animate-pulse-slow"></div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-[#d3b840] relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">Thank You!</h4>
                    <p className="text-gray-300">Your message has been sent. We'll get back to you as soon as possible.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="contact-form">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                          Your Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full bg-[#471a67]/10 border border-[#d3b840]/20 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-[#d3b840]/60 focus:bg-[#471a67]/20 transition-colors"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full bg-[#471a67]/10 border border-[#d3b840]/20 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-[#d3b840]/60 focus:bg-[#471a67]/20 transition-colors"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#471a67]/10 border border-[#d3b840]/20 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-[#d3b840]/60 focus:bg-[#471a67]/20 transition-colors"
                        placeholder="How can we help?"
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows="8"
                        className="w-full h-32 sm:h-40 lg:h-48 bg-[#471a67]/10 border border-[#d3b840]/20 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-[#d3b840]/60 focus:bg-[#471a67]/20 transition-colors resize-none"
                        placeholder="Tell us about your inquiry..."
                      ></textarea>
                    </div>
                    
                    <button
                      type="submit"
                      className="btn-modern w-full py-3 px-6 text-white font-semibold transition-all duration-300"
                    >
                      <span>Send Message</span>
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Contact info with modern styling */}
            <div className="lg:col-span-2 reveal">
              <div className="modern-card p-4 sm:p-6 md:p-8 h-full">
                <h3 className="text-xl sm:text-2xl font-bold text-gradient mb-6">Team Information</h3>
                
                <div className="space-y-6 lg:space-y-8">
                  <div className="flex items-start group">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-sca-purple-light to-sca-purple-dark flex items-center justify-center shadow-neon z-10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(211,184,64,0.7)] group-hover:rotate-12 mr-3 sm:mr-4 mt-1">
                      <i className="fas fa-envelope text-[#d3b840] transition-colors duration-300 text-sm sm:text-base"></i>
                    </div>
                    <div className="min-w-0 flex-1 transform hover:-translate-y-1 transition-transform duration-300">
                      <h4 className="text-base sm:text-lg font-medium text-white mb-1">Email Us</h4>
                      <button 
                        onClick={copyEmailToClipboard}
                        className="hover:text-[#e4ce67] transition-colors flex items-center text-sm sm:text-base contact-email"
                      >
                        kbrandt@saintcatherineacademy.org
                        <i className={`ml-2 ${emailCopied ? 'fas fa-check text-green-400' : 'fas fa-copy text-[#d3b840]'} flex-shrink-0`}></i>
                        {emailCopied && <span className="text-xs text-green-400 ml-2 flex-shrink-0">Copied!</span>}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-start group">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-sca-purple-light to-sca-purple-dark flex items-center justify-center shadow-neon z-10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(211,184,64,0.7)] group-hover:rotate-12 mr-3 sm:mr-4 mt-1">
                      <i className="fas fa-location-dot text-[#d3b840] transition-colors duration-300 text-sm sm:text-base"></i>
                    </div>
                    <div className="min-w-0 flex-1 transform hover:-translate-y-1 transition-transform duration-300">
                      <h4 className="text-base sm:text-lg font-medium text-white mb-1">Our Location</h4>
                      <a 
                        href="https://maps.google.com/?q=St.+Catherine+of+Siena+Academy,+28200+Napier+Road,+Wixom,+MI+48393" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-[#d3b840] transition-colors text-sm sm:text-base"
                      >
                        St. Catherine of Siena Academy<br />
                        28200 Napier Road<br />
                        Wixom, MI 48393
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start group">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-sca-purple-light to-sca-purple-dark flex items-center justify-center shadow-neon z-10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(211,184,64,0.7)] group-hover:rotate-12 mr-3 sm:mr-4 mt-1">
                      <i className="fas fa-calendar-days text-[#d3b840] transition-colors duration-300 text-sm sm:text-base"></i>
                    </div>
                    <div className="min-w-0 flex-1 transform hover:-translate-y-1 transition-transform duration-300">
                      <h4 className="text-base sm:text-lg font-medium text-white mb-1">Meeting Times</h4>
                      <p className="text-gray-300 text-sm sm:text-base">
                        Tuesday, Thursday<br />
                        4:30 PM - 8:30 PM
                      </p>
                      <p className="text-gray-300 text-sm sm:text-base">
                        Saturday<br />
                        10:00 AM - 4:00 PM
                      </p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h4 className="text-base sm:text-lg font-medium text-white mb-3">Follow Us</h4>
                    <div className="flex flex-wrap gap-3 sm:gap-4">
                      <a href="https://www.instagram.com/scaconstellations/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full glass-panel border border-[#d3b840]/20 flex items-center justify-center text-[#d3b840] hover:border-[#d3b840]/60 hover:scale-110 transition-all">
                        <i className="fab fa-instagram text-sm sm:text-base"></i>
                      </a>
                      <a href="https://www.facebook.com/scaconstellations7598" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full glass-panel border border-[#d3b840]/20 flex items-center justify-center text-[#d3b840] hover:border-[#d3b840]/60 hover:scale-110 transition-all">
                        <i className="fab fa-facebook text-sm sm:text-base"></i>
                      </a>
                      <a href="https://github.com/SCAconstellations" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full glass-panel border border-[#d3b840]/20 flex items-center justify-center text-[#d3b840] hover:border-[#d3b840]/60 hover:scale-110 transition-all">
                        <i className="fab fa-github text-sm sm:text-base"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern decorative elements */}
      <div 
        className="absolute top-1/4 left-0 w-64 h-64 bg-gradient-radial from-[#471a67]/20 to-transparent rounded-full filter blur-3xl animate-pulse-slow" 
        aria-hidden="true"
      ></div>
      <div 
        className="absolute bottom-1/4 right-0 w-96 h-96 bg-gradient-radial from-[#d3b840]/10 to-transparent rounded-full filter blur-3xl animate-pulse-slow" 
        aria-hidden="true" 
        style={{animationDelay: '2s'}}
      ></div>
    </section>
  );
};

export default Contact;
