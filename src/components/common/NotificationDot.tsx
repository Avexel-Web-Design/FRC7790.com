import React from 'react';

interface NotificationDotProps {
  count?: number;
  show?: boolean;
  size?: 'small' | 'medium' | 'large';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline' | 'absolute-right';
  className?: string;
}

const NotificationDot: React.FC<NotificationDotProps> = ({
  count,
  show = false,
  size = 'small',
  position = 'top-right',
  className = ''
}) => {
  if (!show && (!count || count === 0)) {
    return null;
  }

  const sizeClasses = {
  // Slightly larger to comfortably fit 1-2 characters in a circle
  small: 'w-3 h-3 text-[9px]',
  medium: 'w-4 h-4 text-[10px]',
  large: 'w-5 h-5 text-[11px]'
  };

  const positionClasses = {
    'top-right': 'absolute -top-1 -right-1',
    'top-left': 'absolute -top-1 -left-1',
    'bottom-right': 'absolute -bottom-1 -right-1',
    'bottom-left': 'absolute -bottom-1 -left-1',
    'absolute-right': 'absolute top-1/2 right-2 transform -translate-y-1/2',
    'inline': 'relative inline-block'
  };

  const shouldShowCount = count !== undefined && count > 0;
  // Clamp the displayed count to keep text readable inside a circle
  const displayCount = shouldShowCount
    ? (size === 'small'
        ? (count! > 9 ? '9+' : count!.toString())
        : (count! > 99 ? '99+' : count!.toString()))
    : '';

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${positionClasses[position]}
        bg-baywatch-orange text-white rounded-full
        flex items-center justify-center
        font-bold leading-none
        ${className}
      `}
    >
      {displayCount}
    </div>
  );
};

export default NotificationDot;
