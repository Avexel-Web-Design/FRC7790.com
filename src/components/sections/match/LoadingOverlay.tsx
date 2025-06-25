import React from 'react';
import NebulaLoader from '../../common/NebulaLoader';

const LoadingOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="text-center">
        <NebulaLoader size={128} />
        <h2 className="text-xl font-bold text-baywatch-orange mt-4">Loading Match Data</h2>
        <p className="text-gray-400 mt-2">Retrieving information from The Blue Alliance</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
