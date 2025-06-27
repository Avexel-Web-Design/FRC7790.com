import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  avatar: string;
}

interface Channel {
  id: string;
  name: string;
}

const Chat: React.FC = () => {
  const { user } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>({ id: 'general', name: '# general' });
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data for channels and messages
  const channels: Channel[] = [
    { id: 'general', name: '# general' },
    { id: 'random', name: '# random' },
    { id: 'development', name: '# development' },
    { id: 'announcements', name: '# announcements' },
  ];

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Simulate fetching messages for the selected channel
    if (selectedChannel) {
      // In a real app, you'd fetch from an API based on selectedChannel.id
      setMessages([
        { id: 1, sender: 'Bot', content: `Welcome to ${selectedChannel.name}!`, timestamp: '2025-06-26T10:00:00Z', avatar: 'https://via.placeholder.com/40/0000FF/FFFFFF?text=B' },
        { id: 2, sender: 'Alice', content: 'Hey everyone!', timestamp: '2025-06-26T10:05:00Z', avatar: 'https://via.placeholder.com/40/FF0000/FFFFFF?text=A' },
        { id: 3, sender: 'Bob', content: 'Hello Alice!', timestamp: '2025-06-26T10:07:00Z', avatar: 'https://via.placeholder.com/40/00FF00/FFFFFF?text=B' },
        { id: 4, sender: 'Charlie', content: 'What\'s up?', timestamp: '2025-06-26T10:10:00Z', avatar: 'https://via.placeholder.com/40/00FFFF/FFFFFF?text=C' },
        { id: 5, sender: 'Alice', content: 'Just chilling, how about you?', timestamp: '2025-06-26T10:12:00Z', avatar: 'https://via.placeholder.com/40/FF0000/FFFFFF?text=A' },
        { id: 6, sender: 'Bot', content: 'Remember to be respectful and follow the community guidelines.', timestamp: '2025-06-26T10:15:00Z', avatar: 'https://via.placeholder.com/40/0000FF/FFFFFF?text=B' },
        { id: 7, sender: 'Bob', content: 'Anyone working on the new feature?', timestamp: '2025-06-26T10:20:00Z', avatar: 'https://via.placeholder.com/40/00FF00/FFFFFF?text=B' },
        { id: 8, sender: 'Charlie', content: 'I am! Need any help?', timestamp: '2025-06-26T10:22:00Z', avatar: 'https://via.placeholder.com/40/00FFFF/FFFFFF?text=C' },
        { id: 9, sender: 'Alice', content: 'I\'m stuck on a bug, any ideas?', timestamp: '2025-06-26T10:25:00Z', avatar: 'https://via.placeholder.com/40/FF0000/FFFFFF?text=A' },
        { id: 10, sender: 'Bot', content: 'Please describe the bug in detail, Alice.', timestamp: '2025-06-26T10:28:00Z', avatar: 'https://via.placeholder.com/40/0000FF/FFFFFF?text=B' },
        { id: 11, sender: 'Bob', content: 'I can take a look after lunch.', timestamp: '2025-06-26T10:30:00Z', avatar: 'https://via.placeholder.com/40/00FF00/FFFFFF?text=B' },
        { id: 12, sender: 'Charlie', content: 'Thanks Bob!', timestamp: '2025-06-26T10:32:00Z', avatar: 'https://via.placeholder.com/40/00FFFF/FFFFFF?text=C' },
        { id: 13, sender: 'Alice', content: 'It\'s a CSS issue with the new chat component.', timestamp: '2025-06-26T10:35:00Z', avatar: 'https://via.placeholder.com/40/FF0000/FFFFFF?text=A' },
        { id: 14, sender: 'Bot', content: 'Ah, the irony!', timestamp: '2025-06-26T10:36:00Z', avatar: 'https://via.placeholder.com/40/0000FF/FFFFFF?text=B' },
        { id: 15, sender: 'Bob', content: 'I\'ll bring coffee.', timestamp: '2025-06-26T10:38:00Z', avatar: 'https://via.placeholder.com/40/00FF00/FFFFFF?text=B' },
        { id: 16, sender: 'Charlie', content: 'Sounds good!', timestamp: '2025-06-26T10:40:00Z', avatar: 'https://via.placeholder.com/40/00FFFF/FFFFFF?text=C' },
        { id: 17, sender: 'Alice', content: 'Thanks guys!', timestamp: '2025-06-26T10:42:00Z', avatar: 'https://via.placeholder.com/40/FF0000/FFFFFF?text=A' },
        { id: 18, sender: 'Bot', content: 'Any other questions?', timestamp: '2025-06-26T10:45:00Z', avatar: 'https://via.placeholder.com/40/0000FF/FFFFFF?text=B' },
        { id: 19, sender: 'Bob', content: 'Nope, all clear here.', timestamp: '2025-06-26T10:47:00Z', avatar: 'https://via.placeholder.com/40/00FF00/FFFFFF?text=B' },
        { id: 20, sender: 'Charlie', content: 'Me neither.', timestamp: '2025-06-26T10:48:00Z', avatar: 'https://via.placeholder.com/40/00FFFF/FFFFFF?text=C' },
      ]);
    }
  }, [selectedChannel]);

  useEffect(() => {
    // Scroll to bottom of messages when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && selectedChannel && user) {
      const newMessage: Message = {
        id: messages.length + 1,
        sender: user.username,
        content: messageInput.trim(),
        timestamp: new Date().toISOString(),
        avatar: `https://via.placeholder.com/40/${Math.floor(Math.random()*16777215).toString(16)}/FFFFFF?text=${user.username.charAt(0).toUpperCase()}`
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessageInput('');
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Channels</h2>
        </div>
        <nav className="flex-1 p-2 space-y-2">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel)}
              className={`block w-full text-left py-2 px-3 rounded-md transition-colors duration-200 ${
                selectedChannel?.id === channel.id
                  ? 'bg-blue-700 text-white'
                  : 'hover:bg-gray-700'
              }`}
            >
              {channel.name}
            </button>
          ))}
        </nav>
        
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {selectedChannel ? selectedChannel.name : 'Select a Channel'}
          </h2>
          <div className="flex items-center">
            <img
              src={`https://via.placeholder.com/40/${Math.floor(Math.random()*16777215).toString(16)}/FFFFFF?text=${user?.username.charAt(0).toUpperCase()}`}
              alt="User Avatar"
              className="w-10 h-10 rounded-full mr-3"
            />
            <div>
              <p className="font-semibold">{user?.username}</p>
              <p className="text-sm text-gray-400">Online</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          {selectedChannel ? (
            messages.map((message) => (
              <div key={message.id} className="flex items-start mb-4">
                <img
                  src={message.avatar}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div>
                  <div className="flex items-baseline">
                    <p className="font-semibold mr-2">{message.sender}</p>
                    <span className="text-xs text-gray-400">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-300">{message.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">Please select a channel to start chatting.</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-gray-800 p-4 border-t border-gray-700">
          <form onSubmit={handleSendMessage} className="flex">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={selectedChannel ? `Message ${selectedChannel.name}` : 'Select a channel to type...'}
              className="flex-1 bg-gray-700 text-gray-100 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedChannel}
            />
            <button
              type="submit"
              className="ml-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
              disabled={!selectedChannel || !messageInput.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
