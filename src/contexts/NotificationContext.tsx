import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { frcAPI } from '../utils/frcAPI';
import { notifyNewMessage } from '../utils/localNotifications';

interface NotificationContextType {
  unreadCounts: Record<string, number>;
  totalUnread: number;
  channelsHaveUnread: boolean;
  messagesHaveUnread: boolean;
  markChannelAsRead: (channelId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  setActiveChannel: (channelId: string | null) => void;
  activeChannel: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Cache duration - only allow refresh if last one was more than 30 seconds ago
const CACHE_DURATION = 30000; // 30 seconds

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * Given raw notification data and the currently active channel,
 * compute adjusted counts (excluding the active channel from totals).
 */
function computeAdjustedCounts(
  rawUnreadCounts: Record<string, number>,
  rawTotalUnread: number,
  channelsUnread: number,
  messagesUnread: number,
  activeChannel: string | null
) {
  const activeChannelUnreadCount =
    activeChannel && rawUnreadCounts[activeChannel] ? rawUnreadCounts[activeChannel] : 0;

  // Filter active channel out of the counts map
  const filteredCounts = { ...rawUnreadCounts };
  if (activeChannel && filteredCounts[activeChannel]) {
    delete filteredCounts[activeChannel];
  }

  const adjustedTotal = Math.max(0, rawTotalUnread - activeChannelUnreadCount);

  const isActiveChannelRegular =
    activeChannel && !activeChannel.startsWith('dm_') && !activeChannel.startsWith('group_');
  const adjustedChannelsUnread = isActiveChannelRegular
    ? Math.max(0, channelsUnread - activeChannelUnreadCount)
    : channelsUnread;
  const adjustedMessagesUnread = !isActiveChannelRegular
    ? Math.max(0, messagesUnread - activeChannelUnreadCount)
    : messagesUnread;

  return {
    filteredCounts,
    adjustedTotal,
    adjustedChannelsUnread,
    adjustedMessagesUnread,
  };
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [channelsHaveUnread, setChannelsHaveUnread] = useState(false);
  const [messagesHaveUnread, setMessagesHaveUnread] = useState(false);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const [lastTotalUnread, setLastTotalUnread] = useState<number>(0);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;

    // Check if we should skip this refresh due to caching
    const now = Date.now();
    if (now - lastRefresh < CACHE_DURATION) {
      return;
    }

    try {
      setLastRefresh(now);
      
      // Use the combined endpoint to get all notification data in one call
      const response = await frcAPI.get(`/chat/notifications/all?user_id=${user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        const adjusted = computeAdjustedCounts(
          data.unreadCounts,
          data.totalUnread,
          data.channelsUnread,
          data.messagesUnread,
          activeChannel
        );

        if (adjusted.adjustedTotal > lastTotalUnread) {
          notifyNewMessage('New messages', 'You have unread messages');
        }

        setUnreadCounts(adjusted.filteredCounts);
        setLastTotalUnread(adjusted.adjustedTotal);
        setTotalUnread(adjusted.adjustedTotal);
        setChannelsHaveUnread(adjusted.adjustedChannelsUnread > 0);
        setMessagesHaveUnread(adjusted.adjustedMessagesUnread > 0);
      } else if (response.status === 404) {
        // Fallback to separate calls if the combined endpoint is not available
        const [unreadResponse, totalResponse] = await Promise.all([
          frcAPI.get(`/chat/notifications/unread?user_id=${user.id}`),
          frcAPI.get(`/chat/notifications/total?user_id=${user.id}`),
        ]);

        if (unreadResponse.ok && totalResponse.ok) {
          const counts: Record<string, number> = await unreadResponse.json();
          const { totalUnread: total, channelsUnread, messagesUnread } = await totalResponse.json();

          const adjusted = computeAdjustedCounts(
            counts,
            total,
            channelsUnread,
            messagesUnread,
            activeChannel
          );

          if (adjusted.adjustedTotal > lastTotalUnread) {
            notifyNewMessage('New messages', 'You have unread messages');
          }

          setUnreadCounts(adjusted.filteredCounts);
          setLastTotalUnread(adjusted.adjustedTotal);
          setTotalUnread(adjusted.adjustedTotal);
          setChannelsHaveUnread(adjusted.adjustedChannelsUnread > 0);
          setMessagesHaveUnread(adjusted.adjustedMessagesUnread > 0);
        }
      }
    } catch {
      // Network error - keep existing state
    }
  }, [user, activeChannel, lastRefresh, lastTotalUnread]);

  const markChannelAsRead = useCallback(async (channelId: string) => {
    if (!user) return;

    try {
      const response = await frcAPI.post(`/chat/notifications/read/${channelId}`, {
        user_id: user.id
      });

      if (response.ok) {
        // Remove this channel from unread counts
        setUnreadCounts(prev => {
          const newCounts = { ...prev };
          delete newCounts[channelId];
          return newCounts;
        });

        // Reset cache and refresh total counts
        setLastRefresh(0);
        await refreshNotifications();
      }
    } catch {
      // Network error - keep existing state
    }
  }, [user, refreshNotifications]);

  // Auto-refresh notifications every 2 minutes
  useEffect(() => {
    if (user) {
      refreshNotifications();
      
      const interval = setInterval(refreshNotifications, 120000); // 2 minutes
      return () => clearInterval(interval);
    }
  }, [user, refreshNotifications]);

  // Debounced refresh when active channel changes
  useEffect(() => {
    if (user && activeChannel !== null) {
      const timeoutId = setTimeout(() => {
        refreshNotifications();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeChannel, user, refreshNotifications]);

  // Clear state when user logs out
  useEffect(() => {
    if (!user) {
      setUnreadCounts({});
      setTotalUnread(0);
      setChannelsHaveUnread(false);
      setMessagesHaveUnread(false);
      setActiveChannel(null);
    }
  }, [user]);

  const value: NotificationContextType = {
    unreadCounts,
    totalUnread,
    channelsHaveUnread,
    messagesHaveUnread,
    markChannelAsRead,
    refreshNotifications,
    setActiveChannel,
    activeChannel,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
