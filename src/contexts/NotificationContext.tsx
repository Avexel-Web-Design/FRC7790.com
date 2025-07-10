import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { frcAPI } from '../utils/frcAPI';

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

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [channelsHaveUnread, setChannelsHaveUnread] = useState(false);
  const [messagesHaveUnread, setMessagesHaveUnread] = useState(false);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(0);

  // Cache duration - only allow refresh if last one was more than 30 seconds ago
  const CACHE_DURATION = 30000; // 30 seconds

  const refreshNotifications = useCallback(async () => {
    if (!user) return;

    // Check if we should skip this refresh due to caching
    const now = Date.now();
    if (now - lastRefresh < CACHE_DURATION) {
      console.log('NotificationContext: Skipping refresh due to cache (last refresh was', (now - lastRefresh) / 1000, 'seconds ago)');
      return;
    }

    try {
      console.log('NotificationContext: Refreshing notifications for user', user.id);
      setLastRefresh(now);
      
      // Use the new combined endpoint to get all notification data in one call
      const allDataUrl = `/chat/notifications/all?user_id=${user.id}`;
      console.log('NotificationContext: Fetching all notification data from', allDataUrl);
      const response = await frcAPI.get(allDataUrl);
      
      if (response.ok) {
        const data = await response.json();
        console.log('NotificationContext: Received notification data', data);
        
        const { unreadCounts, totalUnread, channelsUnread, messagesUnread } = data;
        
        // Get the original unread count for the active channel (before filtering)
        const activeChannelUnreadCount = activeChannel && unreadCounts[activeChannel] ? unreadCounts[activeChannel] : 0;
        
        // Filter out the active channel from unread counts
        const filteredCounts = { ...unreadCounts };
        if (activeChannel && filteredCounts[activeChannel]) {
          delete filteredCounts[activeChannel];
        }
        
        setUnreadCounts(filteredCounts);
        
        // Subtract active channel's unread count from totals
        const adjustedTotal = Math.max(0, totalUnread - activeChannelUnreadCount);
        
        // Determine if active channel is a regular channel or DM/group
        const isActiveChannelRegular = activeChannel && !activeChannel.startsWith('dm_') && !activeChannel.startsWith('group_');
        const adjustedChannelsUnread = isActiveChannelRegular 
          ? Math.max(0, channelsUnread - activeChannelUnreadCount)
          : channelsUnread;
        const adjustedMessagesUnread = !isActiveChannelRegular 
          ? Math.max(0, messagesUnread - activeChannelUnreadCount)
          : messagesUnread;
        
        setTotalUnread(adjustedTotal);
        setChannelsHaveUnread(adjustedChannelsUnread > 0);
        setMessagesHaveUnread(adjustedMessagesUnread > 0);
      } else {
        console.error('NotificationContext: Failed to fetch notification data', response.status);
        
        // Fallback to separate calls if the combined endpoint fails
        if (response.status === 404) {
          console.log('NotificationContext: Combined endpoint not available, falling back to separate calls');
          
          // Get unread counts for individual channels/conversations
          const unreadUrl = `/chat/notifications/unread?user_id=${user.id}`;
          const unreadResponse = await frcAPI.get(unreadUrl);
          if (unreadResponse.ok) {
            const counts = await unreadResponse.json();
            
            // Filter out the active channel from unread counts
            const filteredCounts = { ...counts };
            if (activeChannel && filteredCounts[activeChannel]) {
              delete filteredCounts[activeChannel];
            }
            
            setUnreadCounts(filteredCounts);
            
            // Get total unread count for sidebar badges
            const totalUrl = `/chat/notifications/total?user_id=${user.id}`;
            const totalResponse = await frcAPI.get(totalUrl);
            if (totalResponse.ok) {
              const { totalUnread: total, channelsUnread, messagesUnread } = await totalResponse.json();
              
              const activeChannelUnreadCount = activeChannel && counts[activeChannel] ? counts[activeChannel] : 0;
              const adjustedTotal = Math.max(0, total - activeChannelUnreadCount);
              
              const isActiveChannelRegular = activeChannel && !activeChannel.startsWith('dm_') && !activeChannel.startsWith('group_');
              const adjustedChannelsUnread = isActiveChannelRegular 
                ? Math.max(0, channelsUnread - activeChannelUnreadCount)
                : channelsUnread;
              const adjustedMessagesUnread = !isActiveChannelRegular 
                ? Math.max(0, messagesUnread - activeChannelUnreadCount)
                : messagesUnread;
              
              setTotalUnread(adjustedTotal);
              setChannelsHaveUnread(adjustedChannelsUnread > 0);
              setMessagesHaveUnread(adjustedMessagesUnread > 0);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  }, [user, activeChannel, lastRefresh, CACHE_DURATION]);

  const markChannelAsRead = async (channelId: string) => {
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
    } catch (error) {
      console.error('Error marking channel as read:', error);
    }
  };

  // Auto-refresh notifications every 2 minutes (reduced frequency)
  useEffect(() => {
    if (user) {
      refreshNotifications();
      
      const interval = setInterval(refreshNotifications, 120000); // 2 minutes
      return () => clearInterval(interval);
    }
  }, [user, refreshNotifications]);

  // Debounced refresh when active channel changes (avoid immediate refresh)
  useEffect(() => {
    if (user && activeChannel !== null) {
      const timeoutId = setTimeout(() => {
        refreshNotifications();
      }, 1000); // Wait 1 second before refreshing
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeChannel, user, refreshNotifications]);

  // Initial load when user logs in
  useEffect(() => {
    if (user) {
      refreshNotifications();
    } else {
      // Clear notifications when user logs out
      setUnreadCounts({});
      setTotalUnread(0);
      setChannelsHaveUnread(false);
      setMessagesHaveUnread(false);
      setActiveChannel(null);
    }
  }, [user, refreshNotifications]);

  const value = {
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
