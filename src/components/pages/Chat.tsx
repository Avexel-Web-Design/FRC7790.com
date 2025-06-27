import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { frcAPI } from '../../utils/frcAPI';

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  avatar: string;
  sender_username: string;
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
    const fetchMessages = async () => {
      if (selectedChannel) {
        try {
          const response = await frcAPI.get(`/chat/messages/${selectedChannel.id}`);
          if (response.ok) {
            const data = await response.json();
            setMessages(data);
          } else {
            console.error('Failed to fetch messages:', response.statusText);
            setMessages([]);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    };
    fetchMessages();
  }, [selectedChannel]);

  useEffect(() => {
    // Scroll to bottom of messages when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && selectedChannel && user) {
      try {
        const response = await frcAPI.post(`/chat/messages/${selectedChannel.id}`, {
          content: messageInput.trim(),
          sender_id: user.id,
        });

        if (response.ok) {
          // Re-fetch messages to include the newly sent message
          const updatedMessagesResponse = await frcAPI.get(`/chat/messages/${selectedChannel.id}`);
          if (updatedMessagesResponse.ok) {
            const updatedMessages = await updatedMessagesResponse.json();
            setMessages(updatedMessages);
          }
          setMessageInput('');
        } else {
          console.error('Failed to send message:', response.statusText);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
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
                    <p className="font-semibold mr-2">{message.sender_username}</p>
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
