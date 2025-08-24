import React from 'react';

export default function NotificationDot({ count, show = false, size = 'small', position = 'top-right', className = '' }) {
  if (!show && (!count || count === 0)) return null;
  const sizeClasses = { small: 'w-3 h-3 text-[9px]', medium: 'w-4 h-4 text-[10px]', large: 'w-5 h-5 text-[11px]' };
  const positionClasses = {
    'top-right': 'absolute -top-1 -right-1',
    'top-left': 'absolute -top-1 -left-1',
    'bottom-right': 'absolute -bottom-1 -right-1',
    'bottom-left': 'absolute -bottom-1 -left-1',
    'absolute-right': 'absolute top-1/2 right-2 transform -translate-y-1/2',
    'inline': 'relative inline-block'
  };
  const display = count && count > 0 ? (size === 'small' ? (count > 9 ? '9+' : String(count)) : (count > 99 ? '99+' : String(count))) : '';
  return (
    <div className={`${sizeClasses[size]} ${positionClasses[position]} bg-sca-purple text-white rounded-full flex items-center justify-center font-bold leading-none ${className}`}>
      {display}
    </div>
  );
}
