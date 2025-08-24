import React from 'react';

export default function NebulaLoader({ size = 128, color = '#471a67', speed = '1.8s' }) {
  const styleVars = { '--uib-size': `${size}px`, '--uib-color': color, '--uib-speed': speed };
  return (
    <div className="relative inline-flex items-center justify-center" style={{ ...styleVars, width: `${size}px`, height: `${size}px` }}>
      {Array.from({ length: 13 }).map((_, i) => (<div key={i} className="loader-particle" />))}
    </div>
  );
}
