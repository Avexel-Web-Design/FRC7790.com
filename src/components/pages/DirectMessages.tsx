import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { frcAPI } from '../../utils/frcAPI';
import { generateColor } from '../../utils/color';
import NebulaLoader from '../common/NebulaLoader';

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
  last_message_time?: string;
}

interface GroupChat {
  id: string;
  name: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  is_private: number;
  last_activity?: string;
}

type ChatItem = (SimpleUser & { type: 'dm' }) | (GroupChat & { type: 'group' });

const DirectMessages: React.FC = () => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // List of users and group chats
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);

  // Message handling
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');

  // UI / state flags
  const [isChatsLoading, setIsChatsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group chat modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [editingGroupId, setEditingGroupId] = useState<string>('');
  const [groupName, setGroupName] = useState('');
  const [availableUsers, setAvailableUsers] = useState<SimpleUser[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Helper to build a deterministic conversation ID between two users.
   * Format: dm_<smallerId>_<largerId>
   */
  const getConversationId = (uid1: number, uid2: number): string => {
    const [a, b] = [uid1, uid2].sort((x, y) => x - y);
    return `dm_${a}_${b}`;
  };

  /** Fetch list of users and group chats */
  const fetchChats = async (maintainSelection: boolean = false) => {
    if (!user) return;
    
    try {
      if (!maintainSelection) {
        setIsChatsLoading(true);
      }
      setError(null);
      
      // Fetch users for DMs
      const usersResp = await frcAPI.get(`/chat/users/recent?user_id=${user.id}`);
      let usersList: SimpleUser[] = [];
      
      if (usersResp.ok) {
        usersList = await usersResp.json();
      } else {
        // Fallback to basic user list
        const fallbackResp = await frcAPI.get('/chat/users');
        if (fallbackResp.ok) {
          const fallbackData = await fallbackResp.json();
          usersList = (fallbackData as SimpleUser[]).filter(u => u.id !== user?.id);
        }
      }
      
      // Fetch group chats
      const groupsResp = await frcAPI.get(`/chat/groups?user_id=${user.id}`);
      let groupsList: GroupChat[] = [];
      
      if (groupsResp.ok) {
        groupsList = await groupsResp.json();
      }
      
      // Combine and sort chats
      const combinedChats: ChatItem[] = [
        ...groupsList.map(group => ({ ...group, type: 'group' as const })),
        ...usersList.map(user => ({ ...user, type: 'dm' as const }))
      ];
      
      // Sort by last activity (groups by last_activity, DMs by last_message_time)
      combinedChats.sort((a, b) => {
        const aTime = a.type === 'group' ? (a.last_activity || a.created_at) : (a.last_message_time || '');
        const bTime = b.type === 'group' ? (b.last_activity || b.created_at) : (b.last_message_time || '');
        
        if (aTime && bTime) {
          return bTime.localeCompare(aTime);
        } else if (aTime && !bTime) {
          return -1;
        } else if (!aTime && bTime) {
          return 1;
        } else {
          // Both empty, sort by name
          const aName = a.type === 'group' ? a.name : a.username;
          const bName = b.type === 'group' ? b.name : b.username;
          return aName.localeCompare(bName, undefined, { sensitivity: 'base' });
        }
      });
      
      setChatItems(combinedChats);
    } catch (err) {
      console.error('Error fetching chats', err);
      setError('Error loading chats.');
    } finally {
      if (!maintainSelection) {
        setIsChatsLoading(false);
      }
    }
  };

  /** Fetch list of chats */
  useEffect(() => {
    if (user) fetchChats();
  }, [user]);

  /** Fetch messages for selected conversation */
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat || !user) return;
      
      setIsMessagesLoading(true);
      setError(null);
      
      try {
        let endpoint: string;
        if (selectedChat.type === 'dm') {
          const convId = getConversationId(user.id, selectedChat.id);
          endpoint = `/chat/messages/dm/${convId}?user_id=${user.id}`;
        } else {
          // Group chat
          endpoint = `/chat/messages/${selectedChat.id}?user_id=${user.id}`;
        }
        
        const resp = await frcAPI.get(endpoint);
        if (resp.ok) {
          const data = await resp.json();
          setMessages(data);
        } else if (resp.status === 404) {
          // No messages yet - that's fine, we'll create them when sending
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
  }, [selectedChat]);

  /** Scroll to bottom when new messages arrive */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChat || !user) return;
    
    const currentTime = new Date().toISOString();
    
    try {
      let endpoint: string;
      let payload: any;
      
      if (selectedChat.type === 'dm') {
        const convId = getConversationId(user.id, selectedChat.id);
        endpoint = `/chat/messages/dm/${convId}`;
        payload = {
          content: messageInput.trim(),
          sender_id: user.id,
        };
      } else {
        // Group chat
        endpoint = `/chat/messages/${selectedChat.id}`;
        payload = {
          content: messageInput.trim(),
          sender_id: user.id,
        };
      }
      
      const resp = await frcAPI.post(endpoint, payload);
      if (resp.ok) {
        // Clear the input immediately for better UX
        setMessageInput('');
        
        // Update chat items order (move to top)
        setChatItems(currentChats => {
          const chatIndex = currentChats.findIndex(c => 
            c.type === selectedChat.type && 
            (c.type === 'dm' ? c.id === selectedChat.id : c.id === selectedChat.id)
          );
          if (chatIndex >= 0) {
            const updatedChats = [...currentChats];
            const [movedChat] = updatedChats.splice(chatIndex, 1);
            
            // Update timestamp
            if (movedChat.type === 'dm') {
              (movedChat as any).last_message_time = currentTime;
            } else {
              (movedChat as any).last_activity = currentTime;
            }
            
            updatedChats.unshift(movedChat);
            return updatedChats;
          }
          return currentChats;
        });
        
        // Refresh messages for current conversation
        if (selectedChat.type === 'dm') {
          const convId = getConversationId(user.id, selectedChat.id);
          const updated = await frcAPI.get(`/chat/messages/dm/${convId}?user_id=${user.id}`);
          if (updated.ok) {
            setMessages(await updated.json());
          }
        } else {
          const updated = await frcAPI.get(`/chat/messages/${selectedChat.id}?user_id=${user.id}`);
          if (updated.ok) {
            setMessages(await updated.json());
          }
        }
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

  // Group chat helper functions
  const loadUsers = async () => {
    try {
      const resp = await frcAPI.get('/chat/users');
      if (resp.ok) {
        const data = await resp.json();
        const filteredUsers = (data as SimpleUser[]).filter(u => u.id !== user?.id);
        setAvailableUsers(filteredUsers);
      }
    } catch (e) {
      console.error('Error loading users', e);
    }
  };

  const openCreateGroupModal = () => {
    setModalType('create');
    setEditingGroupId('');
    setGroupName('');
    setSelectedMembers(user ? [user.id] : []);
    setIsModalOpen(true);
    setError(null);
    loadUsers();
  };

  const openEditGroupModal = async (group: GroupChat) => {
    setModalType('edit');
    setEditingGroupId(group.id);
    setGroupName(group.name);
    setIsModalOpen(true);
    setError(null);
    
    // Load users and current group members
    await loadUsers();
    
    // Load current group members
    try {
      const response = await frcAPI.get(`/chat/channels/${group.id}/members`);
      if (response.ok) {
        const members = await response.json();
        const memberIds = members.map((m: any) => m.user_id);
        setSelectedMembers(memberIds);
      } else {
        setSelectedMembers([]);
      }
    } catch (error) {
      console.error('Error loading group members:', error);
      setSelectedMembers([]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !user || selectedMembers.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (modalType === 'create') {
        const response = await frcAPI.post('/chat/groups', {
          name: groupName.trim(),
          created_by: user.id,
          members: selectedMembers
        });
        
        if (response.ok) {
          // Refresh chats list
          await fetchChats();
          
          // Close modal
          setIsModalOpen(false);
          setGroupName('');
          setSelectedMembers([]);
          setEditingGroupId('');
        } else {
          const errorText = await response.text();
          setError(`Failed to create group: ${response.status} ${response.statusText} - ${errorText}`);
        }
      } else {
        // Edit mode
        const response = await frcAPI.put(`/chat/groups/${editingGroupId}`, {
          name: groupName.trim(),
          members: selectedMembers
        });
        
        if (response.ok) {
          // Refresh chats list
          await fetchChats();
          
          // Close modal
          setIsModalOpen(false);
          setGroupName('');
          setSelectedMembers([]);
          setEditingGroupId('');
        } else {
          const errorText = await response.text();
          setError(`Failed to update group: ${response.status} ${response.statusText} - ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Error managing group:', error);
      setError('Error managing group. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async (group: GroupChat) => {
    if (!window.confirm(`Are you sure you want to delete the group "${group.name}"? All messages will be permanently deleted.`)) {
      return;
    }
    
    setError(null);
    try {
      const response = await frcAPI.delete(`/chat/groups/${group.id}`);
      
      if (response.ok) {
        // If the deleted group was selected, clear selection
        if (selectedChat?.type === 'group' && selectedChat?.id === group.id) {
          setSelectedChat(null);
        }
        
        // Refresh chats list
        await fetchChats();
      } else {
        const errorText = await response.text();
        setError(`Failed to delete group: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      setError('Error deleting group. Check console for details.');
    }
  };

  return (
    <div className="flex h-screen bg-black text-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-black flex flex-col">
        <div className="px-2">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold">Messages</h2>
            <button
              onClick={openCreateGroupModal}
              className="bg-black hover:bg-baywatch-orange text-baywatch-orange hover:text-white rounded-full p-1"
              title="Create new group chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        {isChatsLoading ? (
          <div className="flex items-center justify-center p-4">
            <NebulaLoader size={48} />
          </div>
        ) : (
          <nav className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
            {chatItems.map(chat => (
              <div key={`${chat.type}-${chat.id}`} className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedChat(chat)}
                  className={`flex-1 flex items-center space-x-3 py-2 px-3 rounded-md transition-colors duration-200 ${
                    selectedChat?.type === chat.type && selectedChat?.id === chat.id 
                      ? 'bg-baywatch-orange text-white hover:text-white' 
                      : 'hover:text-baywatch-orange'
                  }`}
                >
                  <div className="relative">
                    {chat.type === 'group' ? (
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                      </div>
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: generateColor(chat.username, null) }}
                      >
                        {chat.username
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .substring(0, 2)}
                      </div>
                    )}
                  </div>
                  <span className="truncate">
                    {chat.type === 'group' ? chat.name : chat.username}
                  </span>
                </button>
                {chat.type === 'group' && user && (chat.created_by === user.id || user.isAdmin) && (
                  <div className="flex space-x-1 pr-2">
                    <button
                      onClick={() => openEditGroupModal(chat)}
                      className="text-gray-400 hover:text-baywatch-orange"
                      title="Edit group"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(chat)}
                      className="text-gray-400 hover:text-red-500"
                      title="Delete group"
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

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-black px-2">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {selectedChat 
                ? (selectedChat.type === 'group' ? selectedChat.name : selectedChat.username)
                : 'Select a chat'
              }
            </h2>
            <div className="flex items-center">
              <div
                className="w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: user?.username ? generateColor(user.username, user.avatarColor) : '#007bff' }}
              >
                {user?.username?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
              </div>
              <div>
                <p className="font-semibold">{user?.username}</p>
                <p className="text-sm text-gray-400">Online</p>
              </div>
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
              <NebulaLoader size={64} />
            </div>
          ) : selectedChat ? (
            messages.length > 0 ? (
              messages.map(msg => (
                <div key={msg.id} className="flex items-start mb-4 group">
                  <div
                    className="w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: generateColor(msg.sender_username, msg.sender_username === user?.username ? user.avatarColor : null) }}
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
              <p className="text-gray-400">Select a chat to start messaging.</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="bg-black px-2">
          <div className="p-4 border-t border-gray-700">
            <form onSubmit={handleSendMessage} className="flex">
              <input
                type="text"
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                placeholder={selectedChat 
                  ? `Message ${selectedChat.type === 'group' ? selectedChat.name : selectedChat.username}`
                  : 'Select a chat...'
                }
                className="flex-1 bg-black text-gray-100 rounded-md px-4 py-2 focus:outline-none"
                disabled={!selectedChat}
              />
              <button
                type="submit"
                className="ml-3 bg-baywatch-orange hover:bg-baywatch-orange/70 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
                disabled={!selectedChat || !messageInput.trim()}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Group Creation/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {modalType === 'create' ? 'Create New Group Chat' : 'Edit Group Chat'}
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateGroup(); }}>
              <div className="mb-4">
                <label htmlFor="groupName" className="block text-sm font-medium mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-gray-700 text-gray-100 border border-gray-600 rounded-md px-3 py-2 focus:outline-none"
                  placeholder="Enter group name"
                  required
                />
              </div>

              {/* Members selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Select members</label>
                <div className="max-h-40 overflow-y-auto bg-gray-700 border border-gray-600 rounded-md p-2">
                  {availableUsers.length === 0 && <p className="text-gray-400 text-sm">Loading users...</p>}
                  {availableUsers.map((u) => (
                    <div key={u.id} className="flex items-center space-x-2 py-1">
                      <div className="relative">
                        <input
                          type="checkbox"
                          id={`user-${u.id}`}
                          checked={selectedMembers.includes(u.id)}
                          onChange={() => {
                            setSelectedMembers((prev) =>
                              prev.includes(u.id)
                                ? prev.filter((id) => id !== u.id)
                                : [...prev, u.id]
                            );
                          }}
                          className="sr-only"
                        />
                        <label 
                          htmlFor={`user-${u.id}`} 
                          className={`w-4 h-4 border-2 rounded flex items-center justify-center cursor-pointer ${
                            selectedMembers.includes(u.id)
                              ? 'bg-baywatch-orange border-baywatch-orange' 
                              : 'border-gray-300 bg-transparent'
                          }`}
                        >
                          {selectedMembers.includes(u.id) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </label>
                      </div>
                      <label htmlFor={`user-${u.id}`} className="cursor-pointer">{u.username}</label>
                    </div>
                  ))}
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
                  className="px-4 py-2 bg-transparent hover:text-baywatch-orange text-white font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!groupName.trim() || selectedMembers.length === 0 || isLoading}
                  className="px-4 py-2 bg-transparent hover:text-baywatch-orange text-white font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {isLoading ? (modalType === 'create' ? 'Creating...' : 'Saving...') : (modalType === 'create' ? 'Create Group' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectMessages; 