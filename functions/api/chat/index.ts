import { Hono } from 'hono';
import { getMessages, sendMessage, deleteMessage, getDMMessages, sendDMMessage } from './messages';
import { 
  getChannels, 
  createChannel, 
  updateChannel, 
  deleteChannel,
  reorderChannels,
  getChannelMembers,
  getGroupChats,
  createGroupChat,
  updateGroupChat,
  deleteGroupChat
} from './channels';
import { getUsers, getUsersByRecentActivity } from './users';
import { markChannelAsRead, getUnreadCounts, getTotalUnreadCount, getAllNotificationData } from './notifications';

const chat = new Hono();

// Debug endpoint
chat.get('/debug', async (c) => {
  const authHeader = c.req.header('Authorization');
  console.log("Debug endpoint called");
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ 
      message: 'No token found',
      hasToken: false 
    });
  }
  
  const token = authHeader.substring(7);
  try {
    // Try to parse the JWT payload
    const [headerBase64, payloadBase64] = token.split('.');
    const header = JSON.parse(atob(headerBase64));
    const payload = JSON.parse(atob(payloadBase64));
    
    return c.json({
      message: 'Token found and parsed',
      hasToken: true,
      tokenInfo: {
        header,
        payload: {
          ...payload,
          // Don't reveal sensitive fields
          password: payload.password ? '[REDACTED]' : undefined
        }
      }
    });
  } catch (error) {
    return c.json({ 
      message: 'Token parsing error',
      hasToken: true,
      error: String(error)
    });
  }
});

// Messages endpoints
chat.get('/messages/:channelId', getMessages);
chat.post('/messages/:channelId', sendMessage);
chat.delete('/messages/:messageId', deleteMessage);

// Direct Messages endpoints
chat.get('/messages/dm/:dmId', getDMMessages);
chat.post('/messages/dm/:dmId', sendDMMessage);

// Channels endpoints
chat.get('/channels', getChannels);
chat.post('/channels', createChannel);
chat.put('/channels/:channelId', updateChannel);
chat.delete('/channels/:channelId', deleteChannel);
chat.get('/channels/:channelId/members', getChannelMembers);
chat.post('/channels/reorder', reorderChannels);

// Group chat endpoints
chat.get('/groups', getGroupChats);
chat.post('/groups', createGroupChat);
chat.put('/groups/:groupId', updateGroupChat);
chat.delete('/groups/:groupId', deleteGroupChat);

// Users endpoint (public to authenticated users)
chat.get('/users', getUsers);
chat.get('/users/recent', getUsersByRecentActivity);

// Notifications endpoints
chat.post('/notifications/read/:channelId', markChannelAsRead);
chat.get('/notifications/all', getAllNotificationData); // New combined endpoint
chat.get('/notifications/unread', getUnreadCounts);
chat.get('/notifications/total', getTotalUnreadCount);

export default chat;