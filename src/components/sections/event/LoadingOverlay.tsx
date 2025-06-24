import React from 'react';

const LoadingOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center items-center gap-1 h-16 mb-6">
          {/* Particle animation */}
          {Array.from({ length: 13 }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-gradient-to-r from-baywatch-orange to-orange-400 rounded-full animate-bounce"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1.4s'
              }}
            />
          ))}
        </div>
        <h2 className="text-xl font-bold text-baywatch-orange mt-4">
          Loading Event Data
        </h2>
        <p className="text-gray-400 mt-2">
          Retrieving information from The Blue Alliance
        </p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
