import React from 'react';

/**
 * NebulaLoader
 * Re-usable particle loader adapted from legacy site styles (loader-particle).
 * It relies on CSS rules for `.loader-particle` and `@keyframes orbit` which are
 * appended to src/index.css.  The component simply renders 13 absolutely-
 * positioned pseudo-orbits spinning around a centre.
 */
const NebulaLoader: React.FC<{
  size?: number;      // Diameter in px, default 128
  color?: string;     // CSS color string for particles, default #FF6B00
  speed?: string;     // Animation speed (e.g. '1.8s'), default '1.8s'
}> = ({ size = 128, color = '#FF6B00', speed = '1.8s' }) => {
  const styleVars = {
    '--uib-size': `${size}px`,
    '--uib-color': color,
    '--uib-speed': speed,
  } as React.CSSProperties;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ ...styleVars, width: `${size}px`, height: `${size}px` }}
    >
      {Array.from({ length: 13 }).map((_, i) => (
        <div key={i} className="loader-particle" />
      ))}
    </div>
  );
};

export default NebulaLoader;
