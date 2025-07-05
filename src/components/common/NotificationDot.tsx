import React from 'react';

interface NotificationDotProps {
  count?: number;
  show?: boolean;
  size?: 'small' | 'medium' | 'large';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline';
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
    small: 'w-2 h-2 text-[8px]',
    medium: 'w-4 h-4 text-[10px]',
    large: 'w-5 h-5 text-xs'
  };

  const positionClasses = {
    'top-right': 'absolute -top-1 -right-1',
    'top-left': 'absolute -top-1 -left-1',
    'bottom-right': 'absolute -bottom-1 -right-1',
    'bottom-left': 'absolute -bottom-1 -left-1',
    'inline': 'relative inline-block'
  };

  const shouldShowCount = count !== undefined && count > 0;
  const displayCount = count && count > 99 ? '99+' : count?.toString();

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${positionClasses[position]}
        ${shouldShowCount ? 'px-1 min-w-4' : ''}
        bg-red-500 text-white rounded-full
        flex items-center justify-center
        font-bold leading-none
        ${className}
      `}
    >
      {shouldShowCount ? displayCount : ''}
    </div>
  );
};

export default NotificationDot;
