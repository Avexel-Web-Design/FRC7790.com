# Dashboard Notification System

## Overview

The FRC 7790 dashboard includes a comprehensive notification system that provides real-time visual indicators for new messages, calendar events, and tasks. The system uses **30-second polling** to simulate near-real-time updates while respecting server performance constraints.

## Features

### ✅ Real-Time Polling
- **30-second intervals** for automatic updates
- **Intelligent caching** to minimize server load
- **Force refresh** capability for immediate updates
- **Background processing** with minimal UI impact

### ✅ Visual Indicators
- **Color-coded notifications**:
  - 🔴 **Red**: Unread messages and channels
  - 🔵 **Blue**: New calendar events  
  - 🟢 **Green**: Updated tasks
- **Smart badge counts** showing exact numbers for messages
- **Pulse animations** for newly detected items
- **Auto-hide** when sections are viewed

### ✅ Persistent State Management
- **localStorage integration** for tracking last viewed times
- **Survives page refreshes** and browser sessions
- **User-specific** notification states
- **Graceful offline handling**

### ✅ Multi-Platform Support
- **Desktop navigation** with hover effects
- **Mobile responsive** with inline indicators
- **Dashboard sidebar** with compact icons
- **Consistent experience** across all interfaces

## Implementation Details

### Notification Context (`NotificationContext.tsx`)

The core notification system is implemented as a React Context that provides:

```typescript
interface NotificationContextType {
  // Basic notification states
  channelsHaveUnread: boolean;
  messagesHaveUnread: boolean;
  calendarHasUpdates: boolean;
  tasksHaveUpdates: boolean;
  
  // Enhanced notification data
  notificationCounts: {
    channels: number;
    messages: number;
    calendar: number;
    tasks: number;
    total: number;
  };
  
  // Status and control methods
  isRefreshing: boolean;
  lastRefreshTime: number;
  markCalendarAsViewed: () => void;
  markTasksAsViewed: () => void;
  refreshNotifications: () => Promise<void>;
}
```

### Polling Mechanism

```typescript
// Auto-refresh every 30 seconds
useEffect(() => {
  if (user) {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }
}, [user, refreshNotifications]);
```

### Smart Detection System

The system efficiently detects new content using:

1. **Optimized API endpoints** (`/stats`) for quick metadata checks
2. **Timestamp comparisons** against last viewed times
3. **Fallback mechanisms** for reliability
4. **Cache management** to prevent excessive requests

### Visual Components

#### NotificationDot Component
```typescript
<NotificationDot 
  show={true}
  position="top-right"
  size="small"
  color="blue"
  animate={true}
  count={5}
  showCount={true}
/>
```

#### NotificationStatus Component
Shows real-time refresh status and total counts:
```typescript
<NotificationStatus className="text-center" />
```

## User Experience

### Automatic Detection
- **New messages**: Detected immediately via existing chat infrastructure
- **Calendar events**: Detected when new events are created by any user
- **Task updates**: Detected when tasks are created or modified
- **Smart filtering**: Currently viewed sections don't show notifications

### Manual Control
- **View sections** automatically marks them as seen
- **Navigation clicks** clear relevant notifications
- **Persistent across sessions** using localStorage
- **Force refresh** available for immediate updates

### Visual Feedback
- **Pulsing animations** for newly detected items
- **Color coding** for different notification types
- **Badge counts** for message quantities
- **Status indicators** showing last refresh time
- **Loading states** during refresh operations

## API Integration

### Existing Endpoints
- `/chat/notifications/all` - Combined notification data
- `/chat/notifications/unread` - Unread message counts
- `/chat/notifications/read/:channelId` - Mark channel as read

### New Endpoints
- `/calendar/stats` - Calendar metadata for efficient checking
- `/tasks/stats` - Task metadata for efficient checking

### Data Flow
```
1. User logs in → Initial notification fetch
2. Every 30 seconds → Background refresh
3. User navigates → Mark section as viewed
4. New content detected → Update visual indicators
5. User views section → Clear notifications
```

## Performance Considerations

### Optimized Requests
- **Combined API calls** where possible
- **Metadata-only requests** for change detection
- **Fallback mechanisms** for reliability
- **Request caching** with 30-second windows

### Smart Updates
- **Differential updates** only when needed
- **Active channel filtering** to reduce noise
- **Batch operations** for multiple notifications
- **Memory efficient** state management

### Server Load Management
- **30-second minimum intervals** between requests
- **User-specific caching** to prevent duplicate calls
- **Graceful degradation** when APIs are unavailable
- **Error handling** with automatic retries

## Benefits

1. **Real-Time Awareness**: Users stay informed of new content
2. **Reduced Noise**: Smart filtering prevents notification overload
3. **Persistent State**: Notifications survive page refreshes
4. **Cross-Platform**: Consistent experience on all devices
5. **Performance**: Efficient polling with minimal server impact
6. **Extensible**: Easy to add new notification types

## Future Enhancements

Potential improvements to consider:

- **WebSocket integration** when available on Cloudflare
- **Push notifications** for critical updates
- **Notification preferences** for user customization
- **Sound alerts** for urgent notifications
- **Email digests** for offline users
- **Integration** with external services (Slack, Discord)

## Configuration

The notification system is configured through constants in `NotificationContext.tsx`:

```typescript
const CACHE_DURATION = 30000; // 30 seconds
const STORAGE_KEYS = {
  lastCalendarView: 'lastCalendarViewTime',
  lastTasksView: 'lastTasksViewTime',
  lastChannelViews: 'lastChannelViewTimes'
};
```

## Testing

To test the notification system:

1. **Login** to the dashboard
2. **Create new events** in Calendar from another session
3. **Add new tasks** from another session  
4. **Send messages** in different channels
5. **Navigate between sections** to see notifications clear
6. **Wait 30 seconds** to see automatic updates

The system provides comprehensive logging for debugging:
- Console logs for refresh operations
- Error handling for failed requests
- Cache hit/miss information
- Notification state changes

---

This notification system provides a robust, user-friendly way to keep team members informed of new content while respecting both user experience and server performance constraints.
