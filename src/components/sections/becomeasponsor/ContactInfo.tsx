export default function ContactInfo() {
  return (
    <section className="pb-8 relative z-10">
      <div className="container mx-auto px-6">
        <div className="max-w-xl mx-auto card-gradient rounded-xl p-8 mb-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
            <div className="flex items-center justify-center space-x-3 text-baywatch-orange">
              <i className="fas fa-envelope"></i>
              <a 
                href="mailto:frc@harborps.org" 
                className="hover:text-orange-700 transition-all duration-300"
              >
                frc@harborps.org
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
