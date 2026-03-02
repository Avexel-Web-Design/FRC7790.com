import { Hono } from 'hono';
import { authMiddleware } from '../auth/middleware';
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
import { markChannelAsRead, getUnreadCounts, getTotalUnreadCount, getAllNotificationData, toggleMute, registerDevice, getMutedSettings, getPushConfig, sendTestPush } from './notifications';

const chat = new Hono();

// Require auth for all chat routes and forbid public accounts
chat.use('*', authMiddleware, async (c, next) => {
  const user = c.get('user') as any;
  if (user && user.userType === 'public') {
    return c.json({ error: 'Chat features are restricted to members.' }, 403);
  }
  await next();
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
chat.post('/notifications/mute/:channelId', toggleMute);
chat.post('/notifications/register-device', registerDevice);
chat.get('/notifications/muted', getMutedSettings);
chat.get('/notifications/push-config', getPushConfig);
chat.post('/notifications/test', sendTestPush);

export default chat;