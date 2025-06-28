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
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userColors, setUserColors] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [isChannelsLoading, setIsChannelsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  
  // Admin modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [channelName, setChannelName] = useState('');
  const [channelId, setChannelId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateColor = (username: string): string => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  };

  // Fetch channels
  useEffect(() => {
    const fetchChannels = async () => {
      setIsChannelsLoading(true);
      setError(null);
      try {
        console.log('Fetching channels...');
        const response = await frcAPI.get('/chat/channels');
        console.log('Channels response:', response);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Channels data:', data);
          setChannels(data);
        } else {
          console.error('Failed to fetch channels:', response.statusText);
          setError(`Failed to fetch channels: ${response.status} ${response.statusText}`);
          // Fallback to default channels if API fails
          setChannels([
            { id: 'general', name: '# general' },
            { id: 'random', name: '# random' },
            { id: 'development', name: '# development' },
            { id: 'announcements', name: '# announcements' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching channels:', error);
        setError('Error fetching channels. Check console for details.');
        // Fallback to default channels if API fails
        setChannels([
          { id: 'general', name: '# general' },
          { id: 'random', name: '# random' },
          { id: 'development', name: '# development' },
          { id: 'announcements', name: '# announcements' },
        ]);
      } finally {
        setIsChannelsLoading(false);
      }
    };
    fetchChannels();
  }, []);

  // Fetch messages for selected channel
  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedChannel) {
        setIsMessagesLoading(true);
        setError(null);
        try {
          console.log(`Fetching messages for channel: ${selectedChannel.id}`);
          const response = await frcAPI.get(`/chat/messages/${selectedChannel.id}`);
          console.log('Messages response:', response);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Messages data:', data);
            setMessages(data);
            // Generate and store colors for new users
            const newColors = new Map(userColors);
            data.forEach((message: Message) => {
              if (!newColors.has(message.sender_username)) {
                newColors.set(message.sender_username, generateColor(message.sender_username));
              }
            });
            setUserColors(newColors);
          } else {
            console.error('Failed to fetch messages:', response.statusText);
            setError(`Failed to fetch messages: ${response.status} ${response.statusText}`);
            setMessages([]);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
          setError('Error fetching messages. Check console for details.');
          setMessages([]);
        } finally {
          setIsMessagesLoading(false);
        }
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
    setError(null);
    if (messageInput.trim() && selectedChannel && user) {
      try {
        console.log(`Sending message to ${selectedChannel.id}:`, messageInput);
        const response = await frcAPI.post(`/chat/messages/${selectedChannel.id}`, {
          content: messageInput.trim(),
          sender_id: user.id,
        });
        console.log('Send message response:', response);

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
          setError(`Failed to send message: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        setError('Error sending message. Check console for details.');
      }
    }
  };

  const openCreateModal = () => {
    setModalType('create');
    setChannelName('');
    setChannelId('');
    setIsModalOpen(true);
    setError(null);
  };

  const openEditModal = (channel: Channel) => {
    setModalType('edit');
    setChannelName(channel.name.replace('# ', ''));
    setChannelId(channel.id);
    setIsModalOpen(true);
    setError(null);
  };

  const handleCreateChannel = async () => {
    if (!channelName.trim() || !user) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Generate channel ID from name (lowercase, no spaces)
      const id = modalType === 'create' 
        ? channelName.toLowerCase().replace(/\s+/g, '-')
        : channelId;
        
      if (modalType === 'create') {
        console.log('Creating channel:', { id, name: `# ${channelName.trim()}` });
        const response = await frcAPI.post('/chat/channels', {
          id,
          name: `# ${channelName.trim()}`,
          created_by: user.id
        });
        console.log('Create channel response:', response);
        
        if (response.ok) {
          // Refresh channels list
          const channelsResponse = await frcAPI.get('/chat/channels');
          if (channelsResponse.ok) {
            const updatedChannels = await channelsResponse.json();
            setChannels(updatedChannels);
          }
          
          // Close modal
          setIsModalOpen(false);
          setChannelName('');
          setChannelId('');
        } else {
          const errorText = await response.text();
          console.error('Failed to create channel:', response.statusText, errorText);
          setError(`Failed to create channel: ${response.status} ${response.statusText} - ${errorText}`);
        }
      } else {
        console.log('Updating channel:', { id, name: `# ${channelName.trim()}` });
        const response = await frcAPI.put(`/chat/channels/${id}`, {
          name: `# ${channelName.trim()}`
        });
        console.log('Update channel response:', response);
        
        if (response.ok) {
          // Refresh channels list
          const channelsResponse = await frcAPI.get('/chat/channels');
          if (channelsResponse.ok) {
            const updatedChannels = await channelsResponse.json();
            setChannels(updatedChannels);
          }
          
          // Close modal
          setIsModalOpen(false);
          setChannelName('');
          setChannelId('');
        } else {
          const errorText = await response.text();
          console.error('Failed to update channel:', response.statusText, errorText);
          setError(`Failed to update channel: ${response.status} ${response.statusText} - ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Error managing channel:', error);
      setError('Error managing channel. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChannel = async (channel: Channel) => {
    // Prevent deletion of general channel
    if (channel.id === 'general') {
      alert('Cannot delete the general channel');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete the channel "${channel.name}"? All messages will be permanently deleted.`)) {
      return;
    }
    
    setError(null);
    try {
      console.log('Deleting channel:', channel.id);
      const response = await frcAPI.delete(`/chat/channels/${channel.id}`);
      console.log('Delete channel response:', response);
      
      if (response.ok) {
        // If the deleted channel was selected, switch to general
        if (selectedChannel?.id === channel.id) {
          const generalChannel = channels.find(c => c.id === 'general');
          if (generalChannel) {
            setSelectedChannel(generalChannel);
          }
        }
        
        // Refresh channels list
        const channelsResponse = await frcAPI.get('/chat/channels');
        if (channelsResponse.ok) {
          const updatedChannels = await channelsResponse.json();
          setChannels(updatedChannels);
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to delete channel:', response.statusText, errorText);
        setError(`Failed to delete channel: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting channel:', error);
      setError('Error deleting channel. Check console for details.');
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold">Channels</h2>
          {user?.isAdmin && (
            <button
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1"
              title="Create new channel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
        
        {isChannelsLoading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <nav className="flex-1 p-2 space-y-2">
            {channels.map((channel) => (
              <div key={channel.id} className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedChannel(channel)}
                  className={`flex-1 text-left py-2 px-3 rounded-md transition-colors duration-200 ${
                    selectedChannel?.id === channel.id
                      ? 'bg-blue-700 text-white'
                      : 'hover:bg-gray-700'
                  }`}
                >
                  {channel.name}
                </button>
                {user?.isAdmin && channel.id !== 'general' && (
                  <div className="flex space-x-1 pr-2">
                    <button
                      onClick={() => openEditModal(channel)}
                      className="text-gray-400 hover:text-white"
                      title="Edit channel"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteChannel(channel)}
                      className="text-gray-400 hover:text-red-500"
                      title="Delete channel"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </nav>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {selectedChannel ? selectedChannel.name : 'Select a Channel'}
          </h2>
          <div className="flex items-center">
            <div
              className="w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: userColors.get(user?.username || '') || '#007bff' }}
            >
              {user?.username?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
            </div>
            <div>
              <p className="font-semibold">{user?.username}</p>
              <p className="text-sm text-gray-400">Online</p>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500 text-white p-2 text-sm text-center">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          {isMessagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : selectedChannel ? (
            messages.length > 0 ? (
              messages.map((message) => (
                <div key={message.id} className="flex items-start mb-4">
                  <div
                    className="w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: userColors.get(message.sender_username) || '#cccccc' }}
                  >
                    {message.sender_username?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '??'}
                  </div>
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
                <p className="text-gray-400">No messages in this channel yet. Send the first one!</p>
              </div>
            )
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

      {/* Channel Management Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {modalType === 'create' ? 'Create New Channel' : 'Edit Channel'}
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateChannel(); }}>
              <div className="mb-4">
                <label htmlFor="channelName" className="block text-sm font-medium mb-1">
                  Channel Name
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-gray-700 text-gray-400 border border-r-0 border-gray-600 rounded-l-md">
                    #
                  </span>
                  <input
                    type="text"
                    id="channelName"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    className="flex-1 bg-gray-700 text-gray-100 border border-gray-600 rounded-r-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="channel-name"
                    required
                  />
                </div>
              </div>
              {error && (
                <div className="mb-4 bg-red-500 bg-opacity-25 border border-red-500 text-red-100 p-2 rounded">
                  {error}
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!channelName.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : modalType === 'create' ? 'Create' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
