import { Hono } from 'hono';
import { getMessages, sendMessage } from './messages';

const chat = new Hono();

chat.get('/messages/:channelId', getMessages);
chat.post('/messages/:channelId', sendMessage);

export default chat;