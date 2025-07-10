import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { frcAPI } from '../utils/frcAPI';

interface NotificationContextType {
  unreadCounts: Record<string, number>;
  totalUnread: number;
  channelsHaveUnread: boolean;
  messagesHaveUnread: boolean;
  calendarHasUpdates: boolean;
  tasksHaveUpdates: boolean;
  lastRefreshTime: number;
  markChannelAsRead: (channelId: string) => Promise<void>;
  markCalendarAsViewed: () => void;
  markTasksAsViewed: () => void;
  refreshNotifications: () => Promise<void>;
  forceRefreshNotifications: () => Promise<void>; // Bypasses cache for immediate refresh
  setActiveChannel: (channelId: string | null) => void;
  activeChannel: string | null;
  isRefreshing: boolean; // Loading state for UI feedback
  // New: Enhanced notification data
  notificationCounts: {
    channels: number;
    messages: number;
    calendar: number;
    tasks: number;
    total: number;
  };
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
  const [calendarHasUpdates, setCalendarHasUpdates] = useState(false);
  const [tasksHaveUpdates, setTasksHaveUpdates] = useState(false);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Enhanced notification counts
  const [notificationCounts, setNotificationCounts] = useState({
    channels: 0,
    messages: 0,
    calendar: 0,
    tasks: 0,
    total: 0
  });

  // Cache duration - only allow refresh if last one was more than 3 minutes ago
  const CACHE_DURATION = 180000; // 3 minutes

  // LocalStorage keys for tracking last viewed times
  const STORAGE_KEYS = {
    lastCalendarView: 'lastCalendarViewTime',
    lastTasksView: 'lastTasksViewTime',
    lastChannelViews: 'lastChannelViewTimes'
  };

  // Get last viewed time from localStorage
  const getLastViewedTime = (key: string): number => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  };

  // Set last viewed time in localStorage
  const setLastViewedTime = (key: string, timestamp: number) => {
    try {
      localStorage.setItem(key, timestamp.toString());
    } catch (error) {
      console.warn('Unable to save to localStorage:', error);
    }
  };

  // Check for new calendar events
  const checkCalendarUpdates = useCallback(async () => {
    if (!user) return false;
    
    try {
      const lastViewTime = getLastViewedTime(STORAGE_KEYS.lastCalendarView);
      const response = await frcAPI.get('/calendar/stats');
      
      if (response.ok) {
        const stats = await response.json();
        const latestTime = stats.latest_created_at || stats.latest_event_date;
        
        if (latestTime) {
          const latestTimestamp = new Date(latestTime).getTime();
          return latestTimestamp > lastViewTime;
        }
      }
    } catch (error) {
      console.error('Error checking calendar updates:', error);
      // Fallback to the original method if stats endpoint fails
      try {
        const lastViewTime = getLastViewedTime(STORAGE_KEYS.lastCalendarView);
        const response = await frcAPI.get('/calendar');
        
        if (response.ok) {
          const events = await response.json();
          const newEvents = events.filter((event: any) => {
            const eventCreateTime = new Date(event.created_at || event.event_date).getTime();
            return eventCreateTime > lastViewTime;
          });
          
          return newEvents.length > 0;
        }
      } catch (fallbackError) {
        console.error('Error with calendar fallback check:', fallbackError);
      }
    }
    return false;
  }, [user]);

  // Check for new or updated tasks
  const checkTasksUpdates = useCallback(async () => {
    if (!user) return false;
    
    try {
      const lastViewTime = getLastViewedTime(STORAGE_KEYS.lastTasksView);
      const response = await frcAPI.get('/tasks/stats');
      
      if (response.ok) {
        const stats = await response.json();
        const latestTime = stats.latest_updated_at || stats.latest_created_at;
        
        if (latestTime) {
          const latestTimestamp = new Date(latestTime).getTime();
          return latestTimestamp > lastViewTime;
        }
      }
    } catch (error) {
      console.error('Error checking tasks updates:', error);
      // Fallback to the original method if stats endpoint fails
      try {
        const lastViewTime = getLastViewedTime(STORAGE_KEYS.lastTasksView);
        const response = await frcAPI.get('/tasks');
        
        if (response.ok) {
          const tasks = await response.json();
          const newOrUpdatedTasks = tasks.filter((task: any) => {
            const taskTime = new Date(task.updated_at || task.created_at).getTime();
            return taskTime > lastViewTime;
          });
          
          return newOrUpdatedTasks.length > 0;
        }
      } catch (fallbackError) {
        console.error('Error with tasks fallback check:', fallbackError);
      }
    }
    return false;
  }, [user]);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;

    // Check if we should skip this refresh due to caching
    const now = Date.now();
    if (now - lastRefresh < CACHE_DURATION) {
      console.log('NotificationContext: Skipping refresh due to cache (last refresh was', (now - lastRefresh) / 1000, 'seconds ago)');
      return;
    }

    setIsRefreshing(true);
    try {
      console.log('NotificationContext: Refreshing notifications for user', user.id);
      setLastRefresh(now);
      setLastRefreshTime(now);
      
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

        // Check for calendar and tasks updates
        const [calendarUpdates, tasksUpdates] = await Promise.all([
          checkCalendarUpdates(),
          checkTasksUpdates()
        ]);

        setCalendarHasUpdates(calendarUpdates);
        setTasksHaveUpdates(tasksUpdates);

        // Update enhanced notification counts
        setNotificationCounts({
          channels: adjustedChannelsUnread,
          messages: adjustedMessagesUnread,
          calendar: calendarUpdates ? 1 : 0,
          tasks: tasksUpdates ? 1 : 0,
          total: adjustedTotal + (calendarUpdates ? 1 : 0) + (tasksUpdates ? 1 : 0)
        });
        
      } else {
        console.error('NotificationContext: Failed to fetch notification data', response.status);
        // Fallback to separate API calls if combined endpoint fails
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

            // Check for calendar and tasks updates
            const [calendarUpdates, tasksUpdates] = await Promise.all([
              checkCalendarUpdates(),
              checkTasksUpdates()
            ]);

            setCalendarHasUpdates(calendarUpdates);
            setTasksHaveUpdates(tasksUpdates);

            // Update enhanced notification counts
            setNotificationCounts({
              channels: adjustedChannelsUnread,
              messages: adjustedMessagesUnread,
              calendar: calendarUpdates ? 1 : 0,
              tasks: tasksUpdates ? 1 : 0,
              total: adjustedTotal + (calendarUpdates ? 1 : 0) + (tasksUpdates ? 1 : 0)
            });
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user, activeChannel, checkCalendarUpdates, checkTasksUpdates]);

  // Force refresh notifications bypassing cache (for immediate updates)
  const forceRefreshNotifications = useCallback(async () => {
    if (!user) return;
    setLastRefresh(0); // Reset cache
    await refreshNotifications();
  }, [user, refreshNotifications]);

  const markChannelAsRead = async (channelId: string) => {
    if (!user) return;
    try {
      const response = await frcAPI.post(`/chat/notifications/read/${channelId}`, {
        user_id: user.id
      });
      if (response.ok) {
        // Remove this channel from unread counts immediately for better UX
        setUnreadCounts(prev => {
          const newCounts = { ...prev };
          delete newCounts[channelId];
          return newCounts;
        });
        // Force refresh to get accurate total counts
        await forceRefreshNotifications();
      }
    } catch (error) {
      console.error('Error marking channel as read:', error);
    }
  };

  // Mark calendar as viewed
  const markCalendarAsViewed = useCallback(() => {
    const now = Date.now();
    setLastViewedTime(STORAGE_KEYS.lastCalendarView, now);
    setCalendarHasUpdates(false);
    setNotificationCounts(prev => ({
      ...prev,
      calendar: 0,
      total: prev.total - prev.calendar
    }));
  }, []);

  // Mark tasks as viewed
  const markTasksAsViewed = useCallback(() => {
    const now = Date.now();
    setLastViewedTime(STORAGE_KEYS.lastTasksView, now);
    setTasksHaveUpdates(false);
    setNotificationCounts(prev => ({
      ...prev,
      tasks: 0,
      total: prev.total - prev.tasks
    }));
  }, []);

  // Auto-refresh notifications every 5 minutes for periodic updates
  useEffect(() => {
    if (!user) return;
    
    // Create a stable refresh function that doesn't depend on changing callbacks
    const doRefresh = async () => {
      if (!user) return;

      // Check if we should skip this refresh due to caching
      const now = Date.now();
      if (now - lastRefresh < 300000) { // 5 minutes
        return;
      }

      setIsRefreshing(true);
      try {
        setLastRefresh(now);
        setLastRefreshTime(now);
        
        // Use the new combined endpoint to get all notification data in one call
        const allDataUrl = `/chat/notifications/all?user_id=${user.id}`;
        const response = await frcAPI.get(allDataUrl);
        
        if (response.ok) {
          const data = await response.json();
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

          // Check for calendar and tasks updates using simplified inline checks
          const calendarUpdates = await checkForCalendarUpdates();
          const tasksUpdates = await checkForTasksUpdates();

          setCalendarHasUpdates(calendarUpdates);
          setTasksHaveUpdates(tasksUpdates);

          // Update enhanced notification counts
          setNotificationCounts({
            channels: adjustedChannelsUnread,
            messages: adjustedMessagesUnread,
            calendar: calendarUpdates ? 1 : 0,
            tasks: tasksUpdates ? 1 : 0,
            total: adjustedTotal + (calendarUpdates ? 1 : 0) + (tasksUpdates ? 1 : 0)
          });
        }
      } catch (error) {
        console.error('Error refreshing notifications:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    // Simple inline functions for calendar and tasks checks
    const checkForCalendarUpdates = async () => {
      try {
        const lastViewedTime = getLastViewedTime(STORAGE_KEYS.lastCalendarView);
        const response = await frcAPI.get(`/calendar/stats?lastViewed=${lastViewedTime}`);
        if (response.ok) {
          const { hasUpdates } = await response.json();
          return hasUpdates;
        }
      } catch {
        // Ignore errors for now
      }
      return false;
    };

    const checkForTasksUpdates = async () => {
      try {
        const lastViewedTime = getLastViewedTime(STORAGE_KEYS.lastTasksView);
        const response = await frcAPI.get(`/tasks/stats?lastViewed=${lastViewedTime}`);
        if (response.ok) {
          const { hasUpdates } = await response.json();
          return hasUpdates;
        }
      } catch {
        // Ignore errors for now
      }
      return false;
    };
    
    // Initial refresh
    doRefresh();
    
    // Set up interval for periodic refreshes every 5 minutes
    const interval = setInterval(doRefresh, 300000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [user?.id]); // Only depend on user.id, not the entire user object or any functions

  // Debounced refresh when active channel changes (avoid immediate refresh)
  useEffect(() => {
    if (user && activeChannel !== null) {
      const timeoutId = setTimeout(() => {
        // Use force refresh for more responsive updates when switching channels
        setLastRefresh(0); // Reset cache
        // Trigger a refresh by calling the inline refresh function
        const doImmediateRefresh = async () => {
          if (!user) return;
          setIsRefreshing(true);
          try {
            const now = Date.now();
            setLastRefresh(now);
            setLastRefreshTime(now);
            
            const allDataUrl = `/chat/notifications/all?user_id=${user.id}`;
            const response = await frcAPI.get(allDataUrl);
            
            if (response.ok) {
              const data = await response.json();
              const { unreadCounts, totalUnread, channelsUnread, messagesUnread } = data;
              
              const activeChannelUnreadCount = activeChannel && unreadCounts[activeChannel] ? unreadCounts[activeChannel] : 0;
              const filteredCounts = { ...unreadCounts };
              if (activeChannel && filteredCounts[activeChannel]) {
                delete filteredCounts[activeChannel];
              }
              
              setUnreadCounts(filteredCounts);
              const adjustedTotal = Math.max(0, totalUnread - activeChannelUnreadCount);
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
          } catch (error) {
            console.error('Error refreshing notifications on channel change:', error);
          } finally {
            setIsRefreshing(false);
          }
        };
        doImmediateRefresh();
      }, 1000); // Wait 1 second before refreshing
      return () => clearTimeout(timeoutId);
    }
  }, [activeChannel, user?.id]);

  // Clear notifications when user logs out
  useEffect(() => {
    if (!user) {
      // Clear notifications when user logs out
      setUnreadCounts({});
      setTotalUnread(0);
      setChannelsHaveUnread(false);
      setMessagesHaveUnread(false);
      setCalendarHasUpdates(false);
      setTasksHaveUpdates(false);
      setActiveChannel(null);
      setNotificationCounts({
        channels: 0,
        messages: 0,
        calendar: 0,
        tasks: 0,
        total: 0
      });
    }
  }, [user]);

  const value = {
    unreadCounts,
    totalUnread,
    channelsHaveUnread,
    messagesHaveUnread,
    calendarHasUpdates,
    tasksHaveUpdates,
    lastRefreshTime,
    markChannelAsRead,
    markCalendarAsViewed,
    markTasksAsViewed,
    refreshNotifications,
    forceRefreshNotifications,
    setActiveChannel,
    activeChannel,
    isRefreshing,
    notificationCounts,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
