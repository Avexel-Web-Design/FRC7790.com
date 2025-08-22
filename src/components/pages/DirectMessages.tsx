import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { frcAPI } from '../../utils/frcAPI';
import { generateColor } from '../../utils/color';
import NebulaLoader from '../common/NebulaLoader';
import NotificationDot from '../common/NotificationDot';
import { SmilePlus, Trash2, Reply as ReplyIcon, Copy as CopyIcon, Info as InfoIcon } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faThumbsUp, faThumbsDown, faFaceLaughSquint, faCircleCheck as faCircleCheckRegular } from '@fortawesome/free-regular-svg-icons';
import { faExclamation, faQuestion, faCircleCheck as faCircleCheckSolid } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface Message {
  id: number;
  sender_id: number;
  content: string;
  timestamp: string;
  avatar: string;
  sender_username: string;
  read_by_any?: number;
  readers?: { user_id: number; username: string; read_at: string }[];
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
  const { unreadCounts, markChannelAsRead, refreshNotifications, setActiveChannel } = useNotifications();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // List of users and group chats
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);

  // Message handling
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  // Ensure newest messages appear at the bottom by sorting ascending (oldest first)
  const sortMessagesAsc = (arr: Message[]) =>
    [...arr].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

  // Format timestamps: show time for today, date for previous days
  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isSameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (isSameDay) {
      return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
  };

  // UI / state flags
  const [isChatsLoading, setIsChatsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reactions state (frontend-only for now)
  type ReactionMap = Record<number, Record<string, number>>; // messageId -> emoji -> count
  type UserReactionMap = Record<number, Set<string>>; // messageId -> set of emojis reacted by current user
  const [reactions, setReactions] = useState<ReactionMap>({});
  const [userReactions, setUserReactions] = useState<UserReactionMap>({});
  const [pickerOpenFor, setPickerOpenFor] = useState<number | null>(null);
  // Ref to the currently open picker/toolbar container for outside-click detection
  const pickerContainerRef = useRef<HTMLDivElement | null>(null);
  // Info popup state and ref
  const [infoOpenFor, setInfoOpenFor] = useState<number | null>(null);
  const infoContainerRef = useRef<HTMLDivElement | null>(null);
  // Copied feedback state
  const [copiedFor, setCopiedFor] = useState<number | null>(null);
  // Reply state
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  // Thread overlay state
  const [threadCenterId, setThreadCenterId] = useState<number | null>(null);
  // Quick reaction icons (Font Awesome), matching Channels
  const quickIcons: { key: string; icon: IconDefinition; title: string }[] = [
    { key: 'heart', icon: faHeart, title: 'Heart' },
    { key: 'thumbs_up', icon: faThumbsUp, title: 'Like' },
    { key: 'thumbs_down', icon: faThumbsDown, title: 'Dislike' },
    { key: 'laugh', icon: faFaceLaughSquint, title: 'Laugh' },
    { key: 'exclamation', icon: faExclamation, title: 'Exclamation' },
    { key: 'question', icon: faQuestion, title: 'Question' },
  ];
  const iconMap: Record<string, IconDefinition> = {
    heart: faHeart,
    thumbs_up: faThumbsUp,
    thumbs_down: faThumbsDown,
    laugh: faFaceLaughSquint,
    exclamation: faExclamation,
    question: faQuestion,
  };

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
          setMessages(sortMessagesAsc(data));
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

  // Close thread on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setThreadCenterId(null);
    };
    if (threadCenterId != null) {
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
  }, [threadCenterId]);

  // Close reaction picker and info popup on outside click; keep them open when mouse leaves
  useEffect(() => {
    const handleDocMouseDown = (e: MouseEvent) => {
      const pickerEl = pickerContainerRef.current;
      const infoEl = infoContainerRef.current;
      const target = e.target as Node | null;
      const clickedInsidePicker = pickerEl && target ? pickerEl.contains(target) : false;
      const clickedInsideInfo = infoEl && target ? infoEl.contains(target) : false;
      if (!clickedInsidePicker) setPickerOpenFor(null);
      if (!clickedInsideInfo) setInfoOpenFor(null);
    };
    document.addEventListener('mousedown', handleDocMouseDown);
    return () => document.removeEventListener('mousedown', handleDocMouseDown);
  }, [pickerOpenFor, infoOpenFor]);

  /** Clear active channel on component unmount */
  useEffect(() => {
    return () => {
      setActiveChannel(null);
    };
  }, [setActiveChannel]);

  /** Set active channel when selected chat changes */
  useEffect(() => {
    if (selectedChat && user) {
      const channelId = selectedChat.type === 'dm' 
        ? getConversationId(user.id, selectedChat.id)
        : selectedChat.id.toString();
      setActiveChannel(channelId);
    }
  }, [selectedChat, user, setActiveChannel]);

  const handleChatClick = (chat: ChatItem) => {
    setSelectedChat(chat);
    
    // Determine the channel ID for notifications
    let channelId: string;
    if (chat.type === 'dm' && user) {
      channelId = getConversationId(user.id, chat.id);
    } else {
      channelId = chat.id.toString();
    }
    
    // Set as active channel to suppress notifications
    setActiveChannel(channelId);
    
    // Mark as read
    markChannelAsRead(channelId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChat || !user) return;
    
    const currentTime = new Date().toISOString();
    
    try {
      let endpoint: string;
      let payload: any;
      
    if (selectedChat.type === 'dm') {
        const convId = getConversationId(user.id, selectedChat.id);
        endpoint = `/chat/messages/dm/${convId}?user_id=${user.id}`;
        payload = {
      content: replyTo ? `::reply[${replyTo.id}]::${messageInput.trim()}` : messageInput.trim(),
          sender_id: user.id,
        };
      } else {
        // Group chat
        endpoint = `/chat/messages/${selectedChat.id}?user_id=${user.id}`;
        payload = {
      content: replyTo ? `::reply[${replyTo.id}]::${messageInput.trim()}` : messageInput.trim(),
          sender_id: user.id,
        };
      }
      
      const resp = await frcAPI.post(endpoint, payload);
      if (resp.ok) {
  // Clear the input immediately for better UX
        setMessageInput('');
  setReplyTo(null);
        
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
            const data = await updated.json();
            setMessages(sortMessagesAsc(data));
          }
        } else {
          const updated = await frcAPI.get(`/chat/messages/${selectedChat.id}?user_id=${user.id}`);
          if (updated.ok) {
            const data = await updated.json();
            setMessages(sortMessagesAsc(data));
          }
        }
        // Refresh notifications since a new message was sent
        refreshNotifications();
      }
    } catch (err) {
      console.error('Error sending message', err);
      setError('Error sending message.');
    }
  };

  // Parse reply marker from message content
  const parseReplyMarker = (content: string): { replyId: number | null; text: string } => {
    const m = content.match(/^::reply\[(\d+)\]::([\s\S]*)$/);
    if (m) {
      return { replyId: parseInt(m[1], 10), text: m[2] };
    }
    return { replyId: null, text: content };
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

  // Clipboard helper
  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  // Reaction helpers (UI-only toggle for now)
  const toggleReaction = (messageId: number, emoji: string) => {
    if (!emoji) return;
    setReactions(prev => {
      const msgMap = { ...(prev[messageId] || {}) };
      const currentCount = msgMap[emoji] || 0;
      // Toggle behavior based on whether current user has reacted
      const hasReacted = !!userReactions[messageId]?.has(emoji);
      const nextCount = Math.max(0, currentCount + (hasReacted ? -1 : 1));
      if (nextCount === 0) {
        delete msgMap[emoji];
      } else {
        msgMap[emoji] = nextCount;
      }
      return { ...prev, [messageId]: msgMap };
    });
    setUserReactions(prev => {
      const setForMsg = new Set(prev[messageId] || []);
      if (setForMsg.has(emoji)) {
        setForMsg.delete(emoji);
      } else {
        setForMsg.add(emoji);
      }
      return { ...prev, [messageId]: setForMsg };
    });
    setPickerOpenFor(null);
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
    <div className="flex h-full md:h-full min-h-screen bg-black text-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-black flex-col">
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
                  onClick={() => handleChatClick(chat)}
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
                    {(() => {
                      const chatId = chat.type === 'dm' && user 
                        ? getConversationId(user.id, chat.id)
                        : chat.id.toString();
                      const unreadCount = unreadCounts[chatId] || 0;
                      
                      return unreadCount > 0 && (
                        <NotificationDot 
                          count={unreadCount} 
                          position="top-right"
                          size="medium"
                        />
                      );
                    })()}
                  </div>
                  <div className="flex-1 truncate">
                    <span className="truncate">
                      {chat.type === 'group' ? chat.name : chat.username}
                    </span>
                  </div>
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

      {/* Mobile Chat Selector */}
      <div className="md:hidden">
        {!selectedChat ? (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Messages</h2>
              <button
                onClick={openCreateGroupModal}
                className="bg-black hover:bg-baywatch-orange text-baywatch-orange hover:text-white rounded-full p-2"
                title="Create new group chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {isChatsLoading ? (
              <div className="flex items-center justify-center p-8">
                <NebulaLoader size={48} />
              </div>
            ) : (
              <div className="space-y-3">
                {chatItems.map(chat => (
                  <button
                    key={`${chat.type}-${chat.id}`}
                    onClick={() => handleChatClick(chat)}
                    className="w-full text-left py-4 px-4 rounded-xl border border-gray-700 hover:border-baywatch-orange hover:bg-gray-800 active:bg-gray-700 transition-all duration-200 flex items-center justify-between mobile-touch-target"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {chat.type === 'group' ? (
                          <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                            </svg>
                          </div>
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base"
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
                        {(() => {
                          const chatId = chat.type === 'dm' && user 
                            ? getConversationId(user.id, chat.id)
                            : chat.id.toString();
                          const unreadCount = unreadCounts[chatId] || 0;
                          
                          return unreadCount > 0 && (
                            <NotificationDot 
                              count={unreadCount} 
                              position="top-right"
                              size="medium"
                            />
                          );
                        })()}
                      </div>
                      <span className="font-medium text-base">
                        {chat.type === 'group' ? chat.name : chat.username}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedChat ? 'hidden md:flex' : ''}`}>
        {/* Header */}
        <div className="bg-black px-2">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center">
              {/* Mobile Back Button */}
              <button
                onClick={() => setSelectedChat(null)}
                className="md:hidden mr-3 p-2 hover:text-baywatch-orange hover:bg-gray-800 rounded-lg transition-colors mobile-touch-target"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg md:text-xl font-bold truncate">
                {selectedChat 
                  ? (selectedChat.type === 'group' ? selectedChat.name : selectedChat.username)
                  : 'Select a chat'
                }
              </h2>
            </div>
            <div className="hidden md:flex items-center">
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
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar pb-20 md:pb-4">
          {isMessagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <NebulaLoader size={64} />
            </div>
          ) : selectedChat ? (
            messages.length > 0 ? (
              <div className="flex flex-col justify-end min-h-full">
                {messages.map((msg, idx) => {
                  const isOwn = !!user && msg.sender_id === user!.id;
                  const prev = idx > 0 ? messages[idx - 1] : null;
                  const next = idx < messages.length - 1 ? messages[idx + 1] : null;
                  const isGroup = selectedChat?.type === 'group';
                  const TWO_MIN = 2 * 60 * 1000;
                  const thisTs = new Date(msg.timestamp).getTime();
                  const prevTs = prev ? new Date(prev.timestamp).getTime() : 0;
                  const nextTs = next ? new Date(next.timestamp).getTime() : 0;
                  const sameSenderAsPrev = !!prev && prev.sender_id === msg.sender_id;
                  const sameSenderAsNext = !!next && next.sender_id === msg.sender_id;
                  const closeToPrev = sameSenderAsPrev && (thisTs - prevTs) <= TWO_MIN;
                  const closeToNext = sameSenderAsNext && (nextTs - thisTs) <= TWO_MIN;
                  const isFirstOfGroup = !closeToPrev;
                  const isLastOfGroup = !closeToNext;

      const avatar = (
                    <div
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg"
                      style={{ backgroundColor: generateColor(msg.sender_username, msg.sender_username === user?.username ? user.avatarColor : null) }}
                    >
                      {msg.sender_username
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 2)}
                    </div>
                  );

      // Determine if this bubble displays a name header (others, first of group, group chat)
      const showNameHeader = !isOwn && isFirstOfGroup && isGroup;

    // Bubble corner shaping for stacked groups (more rounded overall, minimal rounding on stacked-side corners)
                  const bubbleRadius = (() => {
        // Less rounding when the sender's name is shown
        const base = showNameHeader ? 'rounded-2xl' : 'rounded-3xl';
                    const mods: string[] = [];
                    if (!isFirstOfGroup) {
            // On stacked side, use minimal rounding to visually connect bubbles
            mods.push(isOwn ? 'rounded-tr-md' : 'rounded-tl-md');
                    }
                    if (!isLastOfGroup) {
            // Minimal rounding for bottom stacked-side corner as well
            mods.push(isOwn ? 'rounded-br-md' : 'rounded-bl-md');
                    }
                    return [base, ...mods].join(' ');
                  })();

          const parsed = parseReplyMarker(msg.content);
          const repliedMsg = parsed.replyId ? messages.find(m => m.id === parsed.replyId) : null;
          const repliedParsed = repliedMsg ? parseReplyMarker(repliedMsg.content) : null;
          const repliedSnippet = repliedParsed ? repliedParsed.text : '';

          return (
                    <div
                      key={msg.id}
            id={`msg-${msg.id}`}
                      className={`relative flex items-end gap-2 mb-1 ${isFirstOfGroup ? 'mt-3' : 'mt-0'} group ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Left side avatar for others: only in group chats and only on last of group; spacer otherwise (group only) */}
                      {!isOwn && isGroup && (
                        isLastOfGroup ? (
                          <div className="self-end">{avatar}</div>
                        ) : (
                          <div className="w-8 md:w-10" />
                        )
                      )}

                      {/* Action toolbar: position outside bubble. For own -> left of bubble. Reserve width to avoid layout shift */}
                      {isOwn && (
                        <div
                          className={`relative flex items-center gap-1 transition-opacity text-gray-400 ${
                            (pickerOpenFor === msg.id || infoOpenFor === msg.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                          ref={(el) => {
                            if (pickerOpenFor === msg.id) pickerContainerRef.current = el;
                            if (infoOpenFor === msg.id) infoContainerRef.current = el;
                          }}
                        >
                          
                          {/* Info button shows a popup with full details */}
                          <button
                            type="button"
                            className="hover:text-baywatch-orange"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInfoOpenFor(infoOpenFor === msg.id ? null : msg.id);
                            }}
                            title="Message info"
                          >
                            <InfoIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="hover:text-baywatch-orange"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const parsed = parseReplyMarker(msg.content);
                              const ok = await copyToClipboard(parsed.text);
                              if (ok) {
                                setCopiedFor(msg.id);
                                setTimeout(() => setCopiedFor(prev => (prev === msg.id ? null : prev)), 1200);
                              }
                            }}
                            title={copiedFor === msg.id ? 'Copied!' : 'Copy message'}
                          >
                            <CopyIcon className="w-4 h-4" />
                          </button>
              {canDeleteMessage(msg) && (
                            <button
                              onClick={e => handleDeleteMessage(msg.id, e)}
                              className={`hover:text-red-400 text-current`}
                              title={`Delete message${"\n"}(Hold Shift to skip confirmation)`}
                              disabled={isDeletingMessage}
                            >
                <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          {/* Reply button in between delete and react */}
                          <button
                            type="button"
                            className="hover:text-baywatch-orange"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyTo(msg);
                              setTimeout(() => inputRef.current?.focus(), 0);
                            }}
                            title="Reply"
                          >
                            <ReplyIcon className="w-4 h-4" />
                          </button>
                          {/* React button after delete */}
                          <button
                            type="button"
                            className="hover:text-baywatch-orange"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPickerOpenFor(pickerOpenFor === msg.id ? null : msg.id);
                            }}
                            title="Add reaction"
                          >
                            <SmilePlus className="w-4 h-4" />
                          </button>
                          {pickerOpenFor === msg.id && (
                            <div className="absolute bottom-full right-0 mb-2 z-20">
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-xl whitespace-nowrap">
                                <div className="flex items-center gap-1">
                  {quickIcons.map(({ key, icon, title }) => (
                                    <button
                                      key={key}
                                      type="button"
                                      className="px-1.5 py-1 rounded hover:bg-gray-800"
                                      title={title}
                                      onClick={() => toggleReaction(msg.id, key)}
                                    >
                    <FontAwesomeIcon icon={icon} className="w-4 h-4" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          {infoOpenFor === msg.id && (
                            <div className="absolute bottom-full right-full mr-2 mb-2 z-20">
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-sm min-w-[260px] max-w-xs">
                                <div className="text-gray-300 font-medium mb-1">Message info</div>
                                <div className="text-gray-400">
                                  <div><span className="text-gray-500">From:</span> {msg.sender_username}</div>
                                  <div><span className="text-gray-500">ID:</span> {msg.id}</div>
                                  <div className="mt-1">
                                    <span className="text-gray-500">Sent:</span>{' '}
                                    {new Date(msg.timestamp).toLocaleString(undefined, {
                                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                      hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
                                      timeZoneName: 'short'
                                    })}
                                  </div>
                                  {(msg.readers && msg.readers.length > 0) ? (
                                    <div className="mt-2">
                                      <div className="text-gray-500 mb-1">Read by:</div>
                                      <ul className="space-y-0.5 max-h-40 overflow-y-auto pr-1">
                                        {msg.readers.map(r => (
                                          <li key={`reader-${msg.id}-${r.user_id}`} className="flex items-center justify-between">
                                            <span className="text-gray-300 truncate mr-2">{r.username}</span>
                                            <span className="text-[11px] text-gray-500 whitespace-nowrap">
                                              {new Date(r.read_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : (
                                    <div className="mt-2 text-gray-500">No reads yet</div>
                                  )}
                                  {selectedChat && (
                                    <div><span className="text-gray-500">Chat:</span> {selectedChat.type === 'group' ? selectedChat.name : selectedChat.username}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message bubble */}
                      <div
                        className={`max-w-[85%] px-3 py-2 ${bubbleRadius} shadow-sm ${
                          isOwn ? 'bg-baywatch-orange text-white' : 'bg-gray-800 text-gray-100'
                        }`}
                      >
                        {/* In-message reply preview */}
                        {parsed.replyId && (
                          <button
                            type="button"
                            onClick={() => setThreadCenterId(msg.id)}
                            className={`mb-1 text-xs rounded-md px-2 py-1 border ${
                              isOwn ? 'bg-white/10 border-white/30 text-white/90' : 'bg-black/20 border-white/10 text-gray-300'
                            }`}
                            title="View replied message"
                          >
                            <span className="opacity-80">
                              Replying to {repliedMsg ? repliedMsg.sender_username : 'message'}: {repliedSnippet?.slice(0, 80)}
                              {repliedSnippet && repliedSnippet.length > 80 ? '…' : ''}
                            </span>
                          </button>
                        )}
                        {/* Name on top only for others and only first of group (group chats only) */}
                        {!isOwn && isFirstOfGroup && isGroup && (
                          <div className="text-xs font-semibold mb-1 opacity-90">{msg.sender_username}</div>
                        )}
                        <div className={`whitespace-pre-wrap break-words ${isOwn ? 'text-right' : ''}`}>
                          <span>{parsed.text}</span>
                          {isLastOfGroup && (
                            <span className={`ml-2 text-[10px] ${isOwn ? 'text-white/80' : 'text-gray-400'} whitespace-nowrap align-baseline`}>
                              {formatTimestamp(msg.timestamp)}
                              {isOwn && (
                                <span className="ml-1 inline-flex items-center align-baseline">
                                  <FontAwesomeIcon
                                    icon={msg.read_by_any ? faCircleCheckSolid : faCircleCheckRegular}
                                    className="w-3.5 h-3.5 opacity-90"
                                    title={msg.read_by_any ? 'Read' : 'Sent'}
                                  />
                                </span>
                              )}
                            </span>
                          )}
                          {/* Reaction chips under bubble */}
                          {Object.keys(reactions[msg.id] || {}).length > 0 && (
                            <div className={`mt-1 flex flex-wrap gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              {Object.entries(reactions[msg.id]).map(([key, count]) => {
                                const iconDef = iconMap[key];
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => toggleReaction(msg.id, key)}
                                    className={`px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                                      userReactions[msg.id]?.has(key)
                                        ? (isOwn ? 'bg-white/20 border-white/40' : 'bg-white/10 border-white/20')
                                        : (isOwn ? 'bg-black/10 border-white/20' : 'bg-black/20 border-white/10')
                                    }`}
                                    title="Toggle reaction"
                                  >
                                    {iconDef ? (
                                      <FontAwesomeIcon icon={iconDef} className="w-3.5 h-3.5 mr-1 inline-block" />
                                    ) : (
                                      <span className="mr-1">{key}</span>
                                    )}
                                    <span className="tabular-nums">{count}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action toolbar for others: to the right of bubble (reserve width) */}
                      {!isOwn && (
                        <div
                          className={`relative flex items-center gap-1 transition-opacity text-gray-400 ${
                            (pickerOpenFor === msg.id || infoOpenFor === msg.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                          ref={(el) => {
                            if (pickerOpenFor === msg.id) pickerContainerRef.current = el;
                            if (infoOpenFor === msg.id) infoContainerRef.current = el;
                          }}
                        >
                          <button
                            type="button"
                            className="hover:text-baywatch-orange"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPickerOpenFor(pickerOpenFor === msg.id ? null : msg.id);
                            }}
                            title="Add reaction"
                          >
                            <SmilePlus className="w-4 h-4" />
                          </button>
                          {/* Reply button between react and delete */}
                          <button
                            type="button"
                            className="hover:text-baywatch-orange"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyTo(msg);
                              setTimeout(() => inputRef.current?.focus(), 0);
                            }}
                            title="Reply"
                          >
                            <ReplyIcon className="w-4 h-4" />
                          </button>
              {canDeleteMessage(msg) && (
                            <button
                              onClick={e => handleDeleteMessage(msg.id, e)}
                              className={`hover:text-red-400 text-current`}
                              title={`Delete message${"\n"}(Hold Shift to skip confirmation)`}
                              disabled={isDeletingMessage}
                            >
                <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          {/* Copy and Info after Delete */}
                          <button
                            type="button"
                            className="hover:text-baywatch-orange"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const parsed = parseReplyMarker(msg.content);
                              const ok = await copyToClipboard(parsed.text);
                              if (ok) {
                                setCopiedFor(msg.id);
                                setTimeout(() => setCopiedFor(prev => (prev === msg.id ? null : prev)), 1200);
                              }
                            }}
                            title={copiedFor === msg.id ? 'Copied!' : 'Copy message'}
                          >
                            <CopyIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="hover:text-baywatch-orange"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInfoOpenFor(infoOpenFor === msg.id ? null : msg.id);
                            }}
                            title="Message info"
                          >
                            <InfoIcon className="w-4 h-4" />
                          </button>
                          {pickerOpenFor === msg.id && (
                            <div className="absolute bottom-full left-0 mb-2 z-20">
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-xl whitespace-nowrap">
                                <div className="flex items-center gap-1">
                  {quickIcons.map(({ key, icon, title }) => (
                                    <button
                                      key={key}
                                      type="button"
                                      className="px-1.5 py-1 rounded hover:bg-gray-800"
                                      title={title}
                                      onClick={() => toggleReaction(msg.id, key)}
                                    >
                    <FontAwesomeIcon icon={icon} className="w-4 h-4" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          {infoOpenFor === msg.id && (
                            <div className="absolute bottom-full left-full ml-2 mb-2 z-20">
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-sm min-w-[260px] max-w-xs">
                                <div className="text-gray-300 font-medium mb-1">Message info</div>
                                <div className="text-gray-400">
                                  <div><span className="text-gray-500">From:</span> {msg.sender_username}</div>
                                  <div><span className="text-gray-500">ID:</span> {msg.id}</div>
                                  <div className="mt-1">
                                    <span className="text-gray-500">Sent:</span>{' '}
                                    {new Date(msg.timestamp).toLocaleString(undefined, {
                                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                      hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
                                      timeZoneName: 'short'
                                    })}
                                  </div>
                                  {(msg.readers && msg.readers.length > 0) ? (
                                    <div className="mt-2">
                                      <div className="text-gray-500 mb-1">Read by:</div>
                                      <ul className="space-y-0.5 max-h-40 overflow-y-auto pr-1">
                                        {msg.readers.map(r => (
                                          <li key={`reader-${msg.id}-${r.user_id}`} className="flex items-center justify-between">
                                            <span className="text-gray-300 truncate mr-2">{r.username}</span>
                                            <span className="text-[11px] text-gray-500 whitespace-nowrap">
                                              {new Date(r.read_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : (
                                    <div className="mt-2 text-gray-500">No reads yet</div>
                                  )}
                                  {selectedChat && (
                                    <div><span className="text-gray-500">Chat:</span> {selectedChat.type === 'group' ? selectedChat.name : selectedChat.username}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Own messages: no avatar */}
                    </div>
                  );
                })}
              </div>
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
        <div className="bg-black px-2 pb-safe sticky bottom-0 md:relative md:bottom-auto">
          <div className="p-4 border-t border-gray-700">
            {replyTo && (
              <div className="mb-2 flex items-center gap-2 rounded-md border border-gray-700 bg-gray-900 p-2">
                <ReplyIcon className="w-4 h-4 text-baywatch-orange" />
                <div className="flex-1 overflow-hidden">
                  <div className="text-xs text-gray-400">Replying to {replyTo.sender_username}</div>
                  <div className="text-sm truncate">{parseReplyMarker(replyTo.content).text}</div>
                </div>
                <button
                  type="button"
                  className="text-gray-400 hover:text-red-400 px-2"
                  title="Cancel reply"
                  onClick={() => setReplyTo(null)}
                >
                  ×
                </button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                ref={inputRef}
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                placeholder={selectedChat 
                  ? `Message ${selectedChat.type === 'group' ? selectedChat.name : selectedChat.username}`
                  : 'Select a chat...'
                }
                className="flex-1 bg-gray-800 text-gray-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-baywatch-orange border border-gray-600"
                disabled={!selectedChat}
              />
              <button
                type="submit"
                className="bg-baywatch-orange hover:bg-baywatch-orange/80 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedChat || !messageInput.trim()}
              >
                <span className="hidden sm:inline">Send</span>
                <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
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
      {/* Thread Overlay */}
      {threadCenterId != null && (() => {
        // Build thread
        const byId = new Map(messages.map(m => [m.id, m]));
        const parse = parseReplyMarker;
        const parentOf = new Map<number, number>();
        const childrenOf = new Map<number, number[]>();
        for (const m of messages) {
          const { replyId } = parse(m.content);
          if (replyId) {
            parentOf.set(m.id, replyId);
            const arr = childrenOf.get(replyId) || [];
            arr.push(m.id);
            childrenOf.set(replyId, arr);
          }
        }
        const ancestors: Message[] = [];
        const seen = new Set<number>();
        let cur: number | undefined = threadCenterId;
        while (cur !== undefined) {
          if (seen.has(cur)) break;
          seen.add(cur);
          const p = parentOf.get(cur);
          if (p != null) {
            const pm = byId.get(p);
            if (pm) ancestors.unshift(pm);
            cur = p;
          } else break;
        }
        const descendants: Message[] = [];
        const q: number[] = [threadCenterId];
        const visited = new Set<number>([threadCenterId]);
        while (q.length) {
          const id = q.shift()!;
          const kids = childrenOf.get(id) || [];
          for (const kid of kids) {
            if (visited.has(kid)) continue;
            visited.add(kid);
            const km = byId.get(kid);
            if (km) descendants.push(km);
            q.push(kid);
          }
        }
        descendants.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const center = byId.get(threadCenterId);
        const items = [...ancestors, ...(center ? [center] : []), ...descendants];

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setThreadCenterId(null)}
          >
            <div
              className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Thread</h3>
                <button className="text-gray-400 hover:text-white" onClick={() => setThreadCenterId(null)} title="Close">×</button>
              </div>
              <div className="space-y-3">
                {items.map(m => {
                  const isOwnMsg = !!user && m.sender_id === user!.id;
                  const p = parse(m.content);
                  return (
                    <div key={`thread-${m.id}`} className={`p-3 rounded-xl border ${isOwnMsg ? 'bg-baywatch-orange/10 border-baywatch-orange/40' : 'bg-black/30 border-white/10'}`}>
                      <div className="text-xs text-gray-400 mb-1 flex items-center justify-between">
                        <span className="font-medium text-gray-300">{m.sender_username}</span>
                        <span>{formatTimestamp(m.timestamp)}</span>
                      </div>
                      {p.replyId && (
                        <div className="mb-1 text-[11px] opacity-80">Replying to #{p.replyId}</div>
                      )}
                      <div className="whitespace-pre-wrap break-words">{p.text}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default DirectMessages;