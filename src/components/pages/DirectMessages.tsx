import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { frcAPI } from '../../utils/frcAPI';
import { generateColor } from '../../utils/color';

interface Message {
  id: number;
  sender_id: number;
  content: string;
  timestamp: string;
  avatar: string;
  sender_username: string;
}

interface SimpleUser {
  id: number;
  username: string;
  is_admin?: number;
}

const DirectMessages: React.FC = () => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // List of users the current user can DM
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SimpleUser | null>(null);

  // Message handling
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');

  // UI / state flags
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Helper to build a deterministic conversation ID between two users.
   * Format: dm_<smallerId>_<largerId>
   */
  const getConversationId = (uid1: number, uid2: number): string => {
    const [a, b] = [uid1, uid2].sort((x, y) => x - y);
    return `dm_${a}_${b}`;
  };

  /** Fetch list of users (excluding current) */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsUsersLoading(true);
        setError(null);
        const resp = await frcAPI.get('/chat/users');
        if (resp.ok) {
          const data = await resp.json();
          const list = (data as SimpleUser[]).filter(u => u.id !== user?.id);
          setUsers(list);
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.error('Error fetching users', err);
        setError('Error loading users.');
      } finally {
        setIsUsersLoading(false);
      }
    };

    if (user) fetchUsers();
  }, [user]);

  /** Fetch messages for selected conversation */
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser || !user) return;
      const convId = getConversationId(user.id, selectedUser.id);
      setIsMessagesLoading(true);
      setError(null);
      try {
        const resp = await frcAPI.get(`/chat/messages/${convId}?user_id=${user.id}`);
        if (resp.ok) {
          const data = await resp.json();
          setMessages(data);
        } else if (resp.status === 404) {
          // Conversation not yet created – attempt to create hidden channel
          await frcAPI.post('/chat/channels', {
            id: convId,
            name: `DM with ${selectedUser.username}`,
            created_by: user.id,
            is_private: true,
            members: [user.id, selectedUser.id]
          });
          setMessages([]);
        } else {
          setError(`Failed to fetch messages: ${resp.statusText}`);
          setMessages([]);
        }
      } catch (err) {
        console.error('Error fetching messages', err);
        setError('Error loading messages.');
        setMessages([]);
      } finally {
        setIsMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [selectedUser]);

  /** Scroll to bottom when new messages arrive */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedUser || !user) return;
    const convId = getConversationId(user.id, selectedUser.id);
    try {
      const resp = await frcAPI.post(`/chat/messages/${convId}`, {
        content: messageInput.trim(),
        sender_id: user.id,
      });
      if (resp.ok) {
        const updated = await frcAPI.get(`/chat/messages/${convId}?user_id=${user.id}`);
        if (updated.ok) {
          setMessages(await updated.json());
        }
        setMessageInput('');
      }
    } catch (err) {
      console.error('Error sending message', err);
      setError('Error sending message.');
    }
  };

  const handleDeleteMessage = async (messageId: number, event?: React.MouseEvent) => {
    if (!user) return;
    const skip = event?.shiftKey;
    if (!skip && !window.confirm('Delete this message?')) return;
    setIsDeletingMessage(true);
    try {
      const resp = await frcAPI.request('DELETE', `/chat/messages/${messageId}`, {
        user_id: user.id,
      });
      if (resp.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
    } catch (err) {
      console.error('Err deleting message', err);
    } finally {
      setIsDeletingMessage(false);
    }
  };

  const canDeleteMessage = (msg: Message): boolean => {
    if (!user) return false;
    return user.isAdmin || msg.sender_id === user.id;
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>
        {isUsersLoading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <nav className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={`w-full flex items-center space-x-3 py-2 px-3 rounded-md transition-colors duration-150 ${
                  selectedUser?.id === u.id ? 'bg-blue-700 text-white' : 'hover:bg-gray-700'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: generateColor(u.username) }}
                >
                  {u.username
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2)}
                </div>
                <span>{u.username}</span>
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {selectedUser ? selectedUser.username : 'Select a user'}
          </h2>
          <div className="flex items-center">
            <div
              className="w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: user?.username ? generateColor(user.username) : '#007bff' }}
            >
              {user?.username?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
            </div>
            <div>
              <p className="font-semibold">{user?.username}</p>
              <p className="text-sm text-gray-400">Online</p>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-500 text-white p-2 text-sm text-center">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-bold">
              ×
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          {isMessagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : selectedUser ? (
            messages.length > 0 ? (
              messages.map(msg => (
                <div key={msg.id} className="flex items-start mb-4 group">
                  <div
                    className="w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: generateColor(msg.sender_username) }}
                  >
                    {msg.sender_username
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .substring(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="font-semibold mr-2 inline">{msg.sender_username}</p>
                        <span className="text-xs text-gray-400 inline">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {canDeleteMessage(msg) && (
                        <button
                          onClick={e => handleDeleteMessage(msg.id, e)}
                          className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isDeletingMessage}
                          title={`Delete message${"\n"}(Hold Shift to skip confirmation)`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="text-gray-300">{msg.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">No messages yet. Say hi!</p>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">Select a user to start chatting.</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="bg-gray-800 p-4 border-t border-gray-700">
          <form onSubmit={handleSendMessage} className="flex">
            <input
              type="text"
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              placeholder={selectedUser ? `Message ${selectedUser.username}` : 'Select a user...'}
              className="flex-1 bg-gray-700 text-gray-100 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedUser}
            />
            <button
              type="submit"
              className="ml-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
              disabled={!selectedUser || !messageInput.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DirectMessages; 