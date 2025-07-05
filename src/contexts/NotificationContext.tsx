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

  const refreshNotifications = useCallback(async () => {
    if (!user) return;

    try {
      console.log('NotificationContext: Refreshing notifications for user', user.id);
      
      // Get unread counts for individual channels/conversations
      const unreadUrl = `/chat/notifications/unread?user_id=${user.id}`;
      console.log('NotificationContext: Fetching unread counts from', unreadUrl);
      const unreadResponse = await frcAPI.get(unreadUrl);
      if (unreadResponse.ok) {
        const counts = await unreadResponse.json();
        console.log('NotificationContext: Received unread counts', counts);
        
        // Get the original unread count for the active channel (before filtering)
        const activeChannelUnreadCount = activeChannel && counts[activeChannel] ? counts[activeChannel] : 0;
        
        // Filter out the active channel from unread counts
        const filteredCounts = { ...counts };
        if (activeChannel && filteredCounts[activeChannel]) {
          delete filteredCounts[activeChannel];
        }
        
        setUnreadCounts(filteredCounts);
        
        // Get total unread count for sidebar badges
        const totalUrl = `/chat/notifications/total?user_id=${user.id}`;
        console.log('NotificationContext: Fetching total counts from', totalUrl);
        const totalResponse = await frcAPI.get(totalUrl);
        if (totalResponse.ok) {
          const { totalUnread: total, channelsUnread, messagesUnread } = await totalResponse.json();
          console.log('NotificationContext: Received total counts', { total, channelsUnread, messagesUnread });
          
          // Subtract active channel's unread count from totals
          const adjustedTotal = Math.max(0, total - activeChannelUnreadCount);
          
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
          console.error('NotificationContext: Failed to fetch total counts', totalResponse.status);
        }
      } else {
        console.error('NotificationContext: Failed to fetch unread counts', unreadResponse.status);
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  }, [user, activeChannel]);

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

        // Refresh total counts
        await refreshNotifications();
      }
    } catch (error) {
      console.error('Error marking channel as read:', error);
    }
  };

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    if (user) {
      refreshNotifications();
      
      const interval = setInterval(refreshNotifications, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [user, refreshNotifications]);

  // Refresh notifications when active channel changes
  useEffect(() => {
    if (user) {
      refreshNotifications();
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
