import { Hono } from 'hono';
import { getMessages, sendMessage } from './messages';
import { 
  getChannels, 
  createChannel, 
  updateChannel, 
  deleteChannel,
  reorderChannels
} from './channels';

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

// Channels endpoints
chat.get('/channels', getChannels);
chat.post('/channels', createChannel);
chat.put('/channels/:channelId', updateChannel);
chat.delete('/channels/:channelId', deleteChannel);
chat.post('/channels/reorder', reorderChannels);

export default chat;