import React from 'react';

const CoralIcon = ({ className = "w-4 h-4", strokeWidth = 2, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    {...props}
  >
    {/* Base spans from X: 11 to X: 13 at Y: 21 */}
    
    {/* Far Left Branch (Curves up then out) */}
    <path d="M11 21 C11 18 9 15 5 13 C4 11 5 9 4 7" />
    
    {/* Mid-Left Branch (Wiggles upwards) */}
    <path d="M11.5 21 C11 17 10 14 8 11 C7 8 8 5 7 3" />
    
    {/* Center-Left Branch (Tallest, curves slightly left) */}
    <path d="M12 21 C12 16 11 13 11 9 C10 6 12 4 11 2" />
    
    {/* Center-Right Branch (Tall, wiggles slightly right) */}
    <path d="M12 21 C13 16 13 14 14 10 C15 7 14 5 15 2" />
    
    {/* Mid-Right Branch (Bends outwards) */}
    <path d="M12.5 21 C13 18 15 15 17 12 C18 9 17 6 18 4" />
    
    {/* Far Right Branch (Curves up then out) */}
    <path d="M13 21 C13 18 16 15 20 13 C21 11 20 9 21 7" />

  </svg>
);

export default CoralIcon;
