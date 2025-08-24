import React, { useState, useEffect } from 'react';
import useScrollReveal from '../../hooks/useScrollReveal';
import { getGalleryImages } from '../../utils/assetUtils';

const Gallery = ({ id, title, subtitle, year, description }) => {
  useScrollReveal();
  const [activePhoto, setActivePhoto] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    setIsVisible(true);
    loadPhotos();
    
    const galleryElements = document.querySelectorAll('.gallery-animate');
    setTimeout(() => {
      galleryElements.forEach((element, index) => {
        setTimeout(() => {
          element.classList.add('animation-ready');
        }, index * 150);
      });
    }, 200);
  }, [id]);

  const loadPhotos = async () => {
    const images = await getGalleryImages(id);
    setPhotos(images);
  };

  const openModal = (index) => {
    setActivePhoto(index);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setActivePhoto(null);
    document.body.style.overflow = 'unset';
  };

  const nextPhoto = () => {
    setActivePhoto((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setActivePhoto((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <section 
      id={id} 
      className={`relative py-16 md:py-24 transition-opacity duration-1000 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 gallery-animate">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-[hsl(275,60%,20%)] to-[hsl(275,60%,80%)] bg-clip-text text-transparent">
                {title}
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-[#d3b840] font-semibold mb-3">{subtitle} ({year})</p>
            <p className="text-gray-300 max-w-3xl mx-auto">{description}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo, index) => (
              <div 
                key={index} 
                className="group relative overflow-hidden rounded-xl bg-[#471a67]/20 border border-[#d3b840]/20 hover:border-[#d3b840]/60 transition-all duration-500 hover:shadow-lg hover:shadow-[#d3b840]/20 cursor-pointer gallery-animate h-64"
                onClick={() => openModal(index)}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <img 
                  src={photo.src} 
                  alt={photo.alt} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button 
                    className="bg-[#d3b840]/80 hover:bg-[#d3b840] text-black px-4 py-2 rounded-full font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(index);
                    }}
                  >
                    View Photo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Photo Modal */}
      {activePhoto !== null && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="relative max-w-7xl w-full max-h-[90vh] flex flex-col animate-scale-in">
            <button 
              className="absolute top-4 right-4 bg-[#471a67]/50 hover:bg-[#471a67] rounded-full p-2 z-10"
              onClick={closeModal}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="overflow-hidden rounded-xl relative flex-1 flex items-center justify-center">
              <img 
                src={photos[activePhoto].src} 
                alt={photos[activePhoto].alt}
                className="max-h-[80vh] max-w-full object-contain" 
              />
              
              <button 
                className="absolute left-4 bg-[#471a67]/50 hover:bg-[#471a67] rounded-full p-2"
                onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button 
                className="absolute right-4 bg-[#471a67]/50 hover:bg-[#471a67] rounded-full p-2"
                onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-radial from-[#471a67]/20 to-transparent rounded-full filter blur-3xl -z-10" aria-hidden="true"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-radial from-[#d3b840]/10 to-transparent rounded-full filter blur-3xl -z-10" aria-hidden="true"></div>
    </section>
  );
};

export default Gallery;