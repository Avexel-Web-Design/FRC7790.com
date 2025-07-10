import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';

interface NotificationStatusProps {
  className?: string;
}

const NotificationStatus: React.FC<NotificationStatusProps> = ({ className = '' }) => {
  const { isRefreshing, lastRefreshTime, notificationCounts } = useNotifications();

  const formatLastUpdate = (timestamp: number) => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className={`flex items-center space-x-2 text-xs text-gray-400 ${className}`}>
      {/* Refresh status indicator */}
      <div className="flex items-center space-x-1">
        {isRefreshing ? (
          <>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span>Refreshing...</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Updated {formatLastUpdate(lastRefreshTime)}</span>
          </>
        )}
      </div>
      
      {/* Total notification count */}
      {notificationCounts.total > 0 && (
        <div className="flex items-center space-x-1">
          <span>•</span>
          <span className="text-orange-400 font-medium">
            {notificationCounts.total} new
          </span>
        </div>
      )}
    </div>
  );
};

export default NotificationStatus;
