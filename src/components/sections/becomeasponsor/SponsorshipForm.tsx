import { useState } from 'react';

export default function SponsorshipForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    try {
      const response = await fetch('https://formspree.io/f/xanepyzr', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        setSubmitStatus('success');
        form.reset();
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 relative z-10">
      <div className="container mx-auto px-6">
        <div className="max-w-xl mx-auto backdrop-blur-sm bg-black/40 rounded-2xl shadow-xl overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-baywatch-orange/20 to-orange-700/20 p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white text-center">Get in Touch</h2>
            <p className="text-gray-300 text-center text-sm mt-2">
              We're excited to hear from potential sponsors! Feel free to present any questions you may have about our team, ways you can support us and more.
            </p>
          </div>
          
          {/* Form Body */}
          <div className="p-8">
            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-600/20 border border-green-500/30 rounded-lg text-green-300 text-center">
                <i className="fas fa-check-circle mr-2"></i>
                Thank you! Your message has been sent successfully.
              </div>
            )}
            
            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-600/20 border border-red-500/30 rounded-lg text-red-300 text-center">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Sorry, there was an error sending your message. Please try again.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Hidden fields for Formspree configuration */}
              <input type="hidden" name="_subject" value="New Sponsorship Inquiry" />
              <input type="hidden" name="_next" value="https://frc7790.com/index.html" />
              
              {/* Name Field */}
              <div className="group">
                <label 
                  htmlFor="name" 
                  className="text-sm font-medium text-gray-300 block mb-3 transition-all duration-300 group-focus-within:text-baywatch-orange"
                >
                  Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 group-focus-within:text-baywatch-orange transition-colors duration-300">
                    <i className="fas fa-user transition-transform duration-300 group-focus-within:scale-110"></i>
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full py-3 px-12 rounded-lg bg-black/60 border border-gray-700 text-white focus:outline-none focus:border-baywatch-orange focus:ring-1 focus:ring-baywatch-orange/30 shadow-inner transition-all duration-300 hover:border-gray-600"
                    required
                  />
                </div>
              </div>
              
              {/* Email Field */}
              <div className="group">
                <label 
                  htmlFor="email" 
                  className="text-sm font-medium text-gray-300 block mb-3 transition-all duration-300 group-focus-within:text-baywatch-orange"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 group-focus-within:text-baywatch-orange transition-colors duration-300">
                    <i className="fas fa-envelope transition-transform duration-300 group-focus-within:scale-110"></i>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full py-3 px-12 rounded-lg bg-black/60 border border-gray-700 text-white focus:outline-none focus:border-baywatch-orange focus:ring-1 focus:ring-baywatch-orange/30 shadow-inner transition-all duration-300 hover:border-gray-600"
                    required
                  />
                </div>
              </div>
              
              {/* Organization Field */}
              <div className="group">
                <label 
                  htmlFor="organization" 
                  className="text-sm font-medium text-gray-300 block mb-3 transition-all duration-300 group-focus-within:text-baywatch-orange"
                >
                  Organization <span className="text-xs text-gray-500">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 group-focus-within:text-baywatch-orange transition-colors duration-300">
                    <i className="fas fa-building transition-transform duration-300 group-focus-within:scale-110"></i>
                  </div>
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    className="w-full py-3 px-12 rounded-lg bg-black/60 border border-gray-700 text-white focus:outline-none focus:border-baywatch-orange focus:ring-1 focus:ring-baywatch-orange/30 shadow-inner transition-all duration-300 hover:border-gray-600"
                  />
                </div>
              </div>
              
              {/* Message Field */}
              <div className="group">
                <label 
                  htmlFor="message" 
                  className="text-sm font-medium text-gray-300 block mb-3 transition-all duration-300 group-focus-within:text-baywatch-orange"
                >
                  Message
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-0 flex items-start pl-4 text-gray-500 group-focus-within:text-baywatch-orange transition-colors duration-300">
                    <i className="fas fa-message transition-transform duration-300 group-focus-within:scale-110"></i>
                  </div>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="w-full py-3 px-12 rounded-lg bg-black/60 border border-gray-700 text-white focus:outline-none focus:border-baywatch-orange focus:ring-1 focus:ring-baywatch-orange/30 shadow-inner transition-all duration-300 hover:border-gray-600"
                    required
                  />
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="pt-4">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="relative w-full py-4 bg-gradient-to-r from-baywatch-orange to-orange-700 rounded-lg text-white font-medium hover:scale-[1.02] transition-all duration-300 shadow-md group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-orange-600 to-red-600 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></span>
                    <span className="relative flex items-center justify-center">
                      {isSubmitting ? (
                        <>
                          <i className="fas fa-spinner animate-spin mr-2"></i>
                          Sending...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane mr-2 group-hover:translate-x-1 transition-transform duration-300"></i>
                          Submit
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
