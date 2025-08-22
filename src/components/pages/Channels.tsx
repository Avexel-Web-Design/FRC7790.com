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

interface Channel {
  id: string;
  name: string;
  position?: number;
  is_private?: number; // 0 = public, 1 = private
}

interface SimpleUser {
  id: number;
  username: string;
  is_admin?: number;
}

const Channels: React.FC = () => {
  const { user } = useAuth();
  const { unreadCounts, markChannelAsRead, refreshNotifications, setActiveChannel } = useNotifications();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>({ id: 'general', name: '# general' });
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [userColors, setUserColors] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [isChannelsLoading, setIsChannelsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  
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
  // Thread view state
  const [threadCenterId, setThreadCenterId] = useState<number | null>(null);
  // Removed More panel; only quick reactions remain
  // Use emojiInput as the search text for the icon browser
  // Quick reaction icons (Font Awesome)
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
  
  // Drag and drop state
  const [draggedChannel, setDraggedChannel] = useState<Channel | null>(null);
  const [dragOverChannelId, setDragOverChannelId] = useState<string | null>(null);
  
  // Admin modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [channelName, setChannelName] = useState('');
  const [channelId, setChannelId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Privacy & membership state
  const [isPrivate, setIsPrivate] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<SimpleUser[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  // Fetch channels
  useEffect(() => {
    const fetchChannels = async () => {
      setIsChannelsLoading(true);
      setError(null);
      try {
        console.log('Fetching channels...');
        const response = await frcAPI.get(`/chat/channels?user_id=${user?.id ?? ''}`);
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
  }, [user]);

  // Fetch messages for selected channel
  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedChannel) {
        setIsMessagesLoading(true);
        setError(null);
        try {
          console.log(`Fetching messages for channel: ${selectedChannel.id}`);
          const response = await frcAPI.get(`/chat/messages/${selectedChannel.id}?user_id=${user?.id ?? ''}`);
          console.log('Messages response:', response);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Messages data:', data);
            setMessages(sortMessagesAsc(data));
            // Generate and store colors for new users
            const newColors = new Map(userColors);
            data.forEach((message: Message) => {
              if (!newColors.has(message.sender_username)) {
                newColors.set(message.sender_username, generateColor(message.sender_username, null));
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

  // Close reaction picker on outside click, but keep it open when moving the mouse away
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

  // Clear active channel on component unmount
  useEffect(() => {
    return () => {
      setActiveChannel(null);
    };
  }, [setActiveChannel]);

  // Set initial active channel immediately on mount
  useEffect(() => {
    if (user) {
      setActiveChannel('general');
    }
  }, [user, setActiveChannel]);

  // Set initial active channel
  useEffect(() => {
    if (selectedChannel) {
      setActiveChannel(selectedChannel.id);
    }
  }, [selectedChannel, setActiveChannel]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (messageInput.trim() && selectedChannel && user) {
      try {
        console.log(`Sending message to ${selectedChannel.id}:`, messageInput);
        const contentToSend = replyTo ? `::reply[${replyTo.id}]::${messageInput.trim()}` : messageInput.trim();
        const response = await frcAPI.post(`/chat/messages/${selectedChannel.id}?user_id=${user.id}`, {
          content: contentToSend,
          sender_id: user.id,
        });
        console.log('Send message response:', response);

        if (response.ok) {
          // Re-fetch messages to include the newly sent message
          const updatedMessagesResponse = await frcAPI.get(`/chat/messages/${selectedChannel.id}?user_id=${user.id}`);
          if (updatedMessagesResponse.ok) {
            const updatedMessages = await updatedMessagesResponse.json();
            setMessages(sortMessagesAsc(updatedMessages));
          }
          setMessageInput('');
          setReplyTo(null);
          // Refresh notifications since a new message was sent
          refreshNotifications();
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

  // Parse reply marker from message content
  const parseReplyMarker = (content: string): { replyId: number | null; text: string } => {
    const m = content.match(/^::reply\[(\d+)\]::([\s\S]*)$/);
    if (m) {
      return { replyId: parseInt(m[1], 10), text: m[2] };
    }
    return { replyId: null, text: content };
  };

  // Build a thread (ancestors + center + descendants) for a given message id
  const buildThread = (centerId: number): { items: Message[]; centerId: number } => {
    const byId = new Map(messages.map(m => [m.id, m]));
    const parentOf = new Map<number, number>();
    const childrenOf = new Map<number, number[]>();
    for (const m of messages) {
      const { replyId } = parseReplyMarker(m.content);
      if (replyId) {
        parentOf.set(m.id, replyId);
        const arr = childrenOf.get(replyId) || [];
        arr.push(m.id);
        childrenOf.set(replyId, arr);
      }
    }

    // Ancestors chain to root
    const ancestors: Message[] = [];
    const seen = new Set<number>();
    let cur: number | undefined = centerId;
    while (cur !== undefined) {
      if (seen.has(cur)) break;
      seen.add(cur);
      const p = parentOf.get(cur);
      if (p != null) {
        const pm = byId.get(p);
        if (pm) ancestors.unshift(pm);
        cur = p;
      } else {
        break;
      }
    }

    // Descendants BFS
    const descendants: Message[] = [];
    const q: number[] = [centerId];
    const visited = new Set<number>([centerId]);
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
    // Sort descendants chronologically
    descendants.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const center = byId.get(centerId);
    const items = [...ancestors, ...(center ? [center] : []), ...descendants];
    return { items, centerId };
  };

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

  const handleDeleteMessage = async (messageId: number, event?: React.MouseEvent) => {
    if (!user) return;
    
    // Skip confirmation if shift key is pressed
    const skipConfirmation = event?.shiftKey;
    
    // Confirm deletion unless shift is pressed
    if (!skipConfirmation && !window.confirm('Are you sure you want to delete this message?')) {
      return;
    }
    
    setError(null);
    setIsDeletingMessage(true);
    try {
      console.log(`Deleting message: ${messageId}`);
      const response = await frcAPI.request('DELETE', `/chat/messages/${messageId}`, {
        user_id: user.id,
      });
      console.log('Delete message response:', response);
      
      if (response.ok) {
        // Update messages list by removing the deleted message
        setMessages(messages.filter(msg => msg.id !== messageId));
      } else {
        const errorText = await response.text();
        console.error('Failed to delete message:', response.statusText, errorText);
        setError(`Failed to delete message: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      setError('Error deleting message. Check console for details.');
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
    // Fallback
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

  const loadUsers = async () => {
    try {
      const resp = await frcAPI.get('/admin/users');
      if (resp.ok) {
        const data = await resp.json();
        setAvailableUsers(data);
      }
    } catch (e) {
      console.error('Error loading users', e);
    }
  };

  const openCreateModal = () => {
    setModalType('create');
    setChannelName('');
    setChannelId('');
    setIsPrivate(false);
    setSelectedMembers(user ? [user.id] : []);
    setIsModalOpen(true);
    setError(null);

    if (user?.isAdmin) {
      loadUsers();
    }
  };

  const openEditModal = (channel: Channel) => {
    setModalType('edit');
    setChannelName(channel.name.replace('# ', ''));
    setChannelId(channel.id);
    setIsPrivate(channel.is_private === 1);
    setSelectedMembers([]);
    setIsModalOpen(true);
    setError(null);

    if (user?.isAdmin) {
      loadUsers();
    }
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
          created_by: user.id,
          is_private: isPrivate,
          members: selectedMembers
        });
        console.log('Create channel response:', response);
        
        if (response.ok) {
          // Refresh channels list
          const channelsResponse = await frcAPI.get(`/chat/channels?user_id=${user.id}`);
          if (channelsResponse.ok) {
            const updatedChannels = await channelsResponse.json();
            setChannels(updatedChannels);
          }
          
          // Close modal
          setIsModalOpen(false);
          setChannelName('');
          setChannelId('');
          setIsPrivate(false);
          setSelectedMembers([]);
        } else {
          const errorText = await response.text();
          console.error('Failed to create channel:', response.statusText, errorText);
          setError(`Failed to create channel: ${response.status} ${response.statusText} - ${errorText}`);
        }
      } else {
        console.log('Updating channel:', { id, name: `# ${channelName.trim()}` });
        const response = await frcAPI.put(`/chat/channels/${id}`, {
          name: `# ${channelName.trim()}`,
          is_private: isPrivate,
          members: selectedMembers
        });
        console.log('Update channel response:', response);
        
        if (response.ok) {
          // Refresh channels list
          const channelsResponse = await frcAPI.get(`/chat/channels?user_id=${user.id}`);
          if (channelsResponse.ok) {
            const updatedChannels = await channelsResponse.json();
            setChannels(updatedChannels);
          }
          
          // Close modal
          setIsModalOpen(false);
          setChannelName('');
          setChannelId('');
          setIsPrivate(false);
          setSelectedMembers([]);
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
        const channelsResponse = await frcAPI.get(`/chat/channels?user_id=${user?.id ?? ''}`);
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
  
  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, channel: Channel) => {
    if (!user?.isAdmin) return;
    
    console.log('Drag start:', channel.id);
    setDraggedChannel(channel);
    
    // Make the drag image transparent (optional)
    const dragImg = document.createElement('span');
    dragImg.innerHTML = channel.name;
    dragImg.style.position = 'absolute';
    dragImg.style.top = '-9999px';
    document.body.appendChild(dragImg);
    e.dataTransfer.setDragImage(dragImg, 0, 0);
    e.dataTransfer.effectAllowed = 'move';
    
    setTimeout(() => {
      document.body.removeChild(dragImg);
    }, 0);
  };
  
  const handleDragOver = (e: React.DragEvent, channelId: string) => {
    e.preventDefault();
    if (!user?.isAdmin || !draggedChannel || draggedChannel.id === channelId) return;
    
    e.dataTransfer.dropEffect = 'move';
    setDragOverChannelId(channelId);
  };
  
  const handleDragLeave = () => {
    setDragOverChannelId(null);
  };
  
  const handleDrop = async (e: React.DragEvent, targetChannel: Channel) => {
    e.preventDefault();
    if (!user?.isAdmin || !draggedChannel || draggedChannel.id === targetChannel.id) {
      setDraggedChannel(null);
      setDragOverChannelId(null);
      return;
    }
    
    console.log('Drop:', draggedChannel.id, 'onto', targetChannel.id);
    setDragOverChannelId(null);
    
    // Create a new array with reordered channels
    const currentChannels = [...channels];
    
    // Find indices of source and target
    const draggedIndex = currentChannels.findIndex(c => c.id === draggedChannel.id);
    const targetIndex = currentChannels.findIndex(c => c.id === targetChannel.id);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedChannel(null);
      return;
    }
    
    // Remove dragged item
    const [draggedItem] = currentChannels.splice(draggedIndex, 1);
    
    // Insert at target position
    currentChannels.splice(targetIndex, 0, draggedItem);
    
    // Update positions
    const updatedChannels = currentChannels.map((channel, index) => ({
      ...channel,
      position: index + 1
    }));
    
    // Optimistically update UI
    setChannels(updatedChannels);
    setDraggedChannel(null);
    
    // Send update to server
    try {
      const response = await frcAPI.post('/chat/channels/reorder', {
        channels: updatedChannels.map(c => ({ id: c.id, position: c.position }))
      });
      
      if (!response.ok) {
        // If error, refresh channels to get server state
        const errorText = await response.text();
        console.error('Failed to reorder channels:', response.statusText, errorText);
        setError(`Failed to reorder channels: ${response.status} ${response.statusText}`);
        
        // Refresh channels
        const channelsResponse = await frcAPI.get(`/chat/channels?user_id=${user?.id ?? ''}`);
        if (channelsResponse.ok) {
          const serverChannels = await channelsResponse.json();
          setChannels(serverChannels);
        }
      }
    } catch (error) {
      console.error('Error reordering channels:', error);
      setError('Error reordering channels. Check console for details.');
      
      // Refresh channels to get server state
      try {
        const channelsResponse = await frcAPI.get(`/chat/channels?user_id=${user?.id ?? ''}`);
        if (channelsResponse.ok) {
          const serverChannels = await channelsResponse.json();
          setChannels(serverChannels);
        }
      } catch {
        // Ignore error from refresh attempt
      }
    }
  };

  const handleChannelClick = (channel: Channel) => {
    setSelectedChannel(channel);
    setActiveChannel(channel.id);
    markChannelAsRead(channel.id);
  };

  // Check if user can delete a message (owner or admin)
  const canDeleteMessage = (message: Message): boolean => {
    if (!user) return false;
    return user.isAdmin || message.sender_id === user.id;
  };

  return (
    <div className="flex h-full md:h-full min-h-screen bg-black text-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-black flex-col">
        <div className="px-2">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold">Channels</h2>
            {user?.isAdmin && (
              <button
                onClick={openCreateModal}
                className="bg-black hover:bg-baywatch-orange text-baywatch-orange hover:text-white rounded-full p-1"
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
              <NebulaLoader size={48} />
            </div>
          ) : (
            <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
              {channels.map((channel) => (
                <div 
                  key={channel.id} 
                  className={`flex items-center justify-between ${
                    dragOverChannelId === channel.id ? 'border-2 border-baywatch-orange border-dashed bg-baywatch-orange bg-opacity-25' : ''
                  } ${
                    draggedChannel?.id === channel.id ? 'opacity-50' : ''
                  } rounded-md`}
                  draggable={user?.isAdmin}
                  onDragStart={(e) => handleDragStart(e, channel)}
                  onDragOver={(e) => handleDragOver(e, channel.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, channel)}
                >
                  <button
                    onClick={() => handleChannelClick(channel)}
                    className={`flex-1 text-left py-2 px-3 rounded-md transition-colors duration-200 ${
                      selectedChannel?.id === channel.id 
                        ? 'bg-baywatch-orange text-white hover:text-white' 
                        : 'hover:text-baywatch-orange'
                    } relative flex items-center justify-between`}
                  >
                    <span>{channel.name}</span>
                    {unreadCounts[channel.id] > 0 && (
                      <NotificationDot count={unreadCounts[channel.id]} />
                    )}
                  </button>
                  {user?.isAdmin && channel.id !== 'general' && (
                    <div className="flex space-x-1 pr-2">
                      <button
                        onClick={() => openEditModal(channel)}
                        className="text-gray-400 hover:text-baywatch-orange"
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
      </div>

      {/* Mobile Channel Selector */}
      <div className="md:hidden">
        {!selectedChannel ? (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Channels</h2>
              {user?.isAdmin && (
                <button
                  onClick={openCreateModal}
                  className="bg-black hover:bg-baywatch-orange text-baywatch-orange hover:text-white rounded-full p-2"
                  title="Create new channel"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            
            {isChannelsLoading ? (
              <div className="flex items-center justify-center p-8">
                <NebulaLoader size={48} />
              </div>
            ) : (
              <div className="space-y-3">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => handleChannelClick(channel)}
                    className="w-full text-left py-4 px-4 rounded-xl border border-gray-700 hover:border-baywatch-orange hover:bg-gray-800 active:bg-gray-700 transition-all duration-200 flex items-center justify-between mobile-touch-target"
                  >
                    <span className="font-medium text-base">{channel.name}</span>
                    {unreadCounts[channel.id] > 0 && (
                      <NotificationDot count={unreadCounts[channel.id]} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedChannel ? 'hidden md:flex' : ''}`}>
        {/* Chat Header */}
        <div className="bg-black px-2">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center">
              {/* Mobile Back Button */}
              <button
                onClick={() => setSelectedChannel(null)}
                className="md:hidden mr-3 p-2 hover:text-baywatch-orange hover:bg-gray-800 rounded-lg transition-colors mobile-touch-target"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg md:text-xl font-bold truncate">
                {selectedChannel ? selectedChannel.name : 'Select a Channel'}
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

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500 text-white p-2 text-sm text-center">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar pb-20 md:pb-4">
          {isMessagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <NebulaLoader size={64} />
            </div>
          ) : selectedChannel ? (
            messages.length > 0 ? (
              <div className="flex flex-col justify-end min-h-full">
                {messages.map((message, idx) => {
                  const isOwn = !!user && message.sender_id === user!.id;
                  const prev = idx > 0 ? messages[idx - 1] : null;
                  const next = idx < messages.length - 1 ? messages[idx + 1] : null;
                  const TWO_MIN = 2 * 60 * 1000;
                  const thisTs = new Date(message.timestamp).getTime();
                  const prevTs = prev ? new Date(prev.timestamp).getTime() : 0;
                  const nextTs = next ? new Date(next.timestamp).getTime() : 0;
                  const sameSenderAsPrev = !!prev && prev.sender_id === message.sender_id;
                  const sameSenderAsNext = !!next && next.sender_id === message.sender_id;
                  const closeToPrev = sameSenderAsPrev && (thisTs - prevTs) <= TWO_MIN;
                  const closeToNext = sameSenderAsNext && (nextTs - thisTs) <= TWO_MIN;
                  const isFirstOfGroup = !closeToPrev;
                  const isLastOfGroup = !closeToNext;

                  const avatar = (
                    <div
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg"
                      style={{ backgroundColor: generateColor(message.sender_username, message.sender_username === user?.username ? user.avatarColor : null) }}
                    >
                      {message.sender_username?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '??'}
                    </div>
                  );

                  // Determine if this bubble displays a name header (others, first of group)
                  const showNameHeader = !isOwn && isFirstOfGroup;

                  // Bubble corner shaping for stacked groups (more rounded overall, minimal rounding on stacked-side corners)
                  const bubbleRadius = (() => {
                    // Less rounding when the sender's name is shown
                    const base = showNameHeader ? 'rounded-2xl' : 'rounded-3xl';
                    const mods: string[] = [];
                    if (!isFirstOfGroup) {
                      // Reduce top corner on speaking side
                      mods.push(isOwn ? 'rounded-tr-md' : 'rounded-tl-md');
                    }
                    if (!isLastOfGroup) {
                      // Reduce bottom corner on speaking side
                      mods.push(isOwn ? 'rounded-br-md' : 'rounded-bl-md');
                    }
                    return [base, ...mods].join(' ');
                  })();

          const parsed = parseReplyMarker(message.content);
          const repliedMsg = parsed.replyId ? messages.find(m => m.id === parsed.replyId) : null;
          const repliedParsed = repliedMsg ? parseReplyMarker(repliedMsg.content) : null;
          const repliedSnippet = repliedParsed ? repliedParsed.text : '';

          return (
                    <div
                      key={message.id}
            id={`msg-${message.id}`}
                      className={`relative flex items-end gap-2 mb-1 ${isFirstOfGroup ? 'mt-3' : 'mt-0'} group ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Left side avatar for others only on last of group; spacer otherwise for alignment */}
                      {!isOwn && (
                        isLastOfGroup ? (
                          <div className="self-end">{avatar}</div>
                        ) : (
                          <div className="w-8 md:w-10" />
                        )
                      )}

                      {/* Action toolbar: outside bubble. For own -> left of bubble */}
                      {isOwn && (
                        <div
                          className={`relative flex items-center gap-1 transition-opacity text-gray-400 ${
                            (pickerOpenFor === message.id || infoOpenFor === message.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                          ref={(el) => {
                            if (pickerOpenFor === message.id) pickerContainerRef.current = el;
                            if (infoOpenFor === message.id) infoContainerRef.current = el;
                          }}
                        >
                          {/* Info button shows a popup with full details */}
                          <button
                            type="button"
                            className="hover:text-baywatch-orange"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInfoOpenFor(infoOpenFor === message.id ? null : message.id);
                            }}
                            title="Message info"
                          >
                            <InfoIcon className="w-4 h-4" />
                          </button><button
                            type="button"
                            className="hover:text-baywatch-orange"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const parsed = parseReplyMarker(message.content);
                              const ok = await copyToClipboard(parsed.text);
                              if (ok) {
                                setCopiedFor(message.id);
                                setTimeout(() => setCopiedFor(prev => (prev === message.id ? null : prev)), 1200);
                              }
                            }}
                            title={copiedFor === message.id ? 'Copied!' : 'Copy message'}
                          >
                            <CopyIcon className="w-4 h-4" />
                          </button>
                          {canDeleteMessage(message) && (
                            <button
                              onClick={(e) => handleDeleteMessage(message.id, e)}
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
                              setReplyTo(message);
                              setTimeout(() => inputRef.current?.focus(), 0);
                            }}
                            title="Reply"
                          >
                            <ReplyIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="hover:text-baywatch-orange"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPickerOpenFor(pickerOpenFor === message.id ? null : message.id);
                            }}
                            title="Add reaction"
                          >
                            <SmilePlus className="w-4 h-4" />
                          </button>
                          {pickerOpenFor === message.id && (
                            <div className="absolute bottom-full right-0 mb-2 z-20">
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-xl whitespace-nowrap">
                                <div className="flex items-center gap-1">
                  {quickIcons.map(({ key, icon, title }) => (
                                    <button
                                      key={key}
                                      type="button"
                                      className="px-1.5 py-1 rounded hover:bg-gray-800"
                                      title={title}
                                      onClick={() => toggleReaction(message.id, key)}
                                    >
                    <FontAwesomeIcon icon={icon} className="w-4 h-4" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          {infoOpenFor === message.id && (
                            <div className="absolute bottom-full right-full mr-2 mb-2 z-20">
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-sm min-w-[260px] max-w-xs">
                                <div className="text-gray-300 font-medium mb-1">Message info</div>
                                <div className="text-gray-400">
                                  <div><span className="text-gray-500">From:</span> {message.sender_username}</div>
                                  <div><span className="text-gray-500">ID:</span> {message.id}</div>
                                  <div className="mt-1">
                                    <span className="text-gray-500">Sent:</span>{' '}
                                    {new Date(message.timestamp).toLocaleString(undefined, {
                                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                      hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
                                      timeZoneName: 'short'
                                    })}
                                  </div>
                                  {(message.readers && message.readers.length > 0) ? (
                                    <div className="mt-2">
                                      <div className="text-gray-500 mb-1">Read by:</div>
                                      <ul className="space-y-0.5 max-h-40 overflow-y-auto pr-1">
                                        {message.readers.map(r => (
                                          <li key={`reader-${message.id}-${r.user_id}`} className="flex items-center justify-between">
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
                                  {selectedChannel && (
                                    <div><span className="text-gray-500">Channel:</span> {selectedChannel.name}</div>
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
                            onClick={() => setThreadCenterId(message.id)}
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
                        {/* Name on top only for others and only first of group */}
                        {!isOwn && isFirstOfGroup && (
                          <div className="text-xs font-semibold mb-1 opacity-90">{message.sender_username}</div>
                        )}
                        <div className={`whitespace-pre-wrap break-words ${isOwn ? 'text-right' : ''}`}>
                          <span>{parsed.text}</span>
                          {isLastOfGroup && (
                            <span className={`ml-2 text-[10px] ${isOwn ? 'text-white/80' : 'text-gray-400'} whitespace-nowrap align-baseline`}>
                              {formatTimestamp(message.timestamp)}
                              {isOwn && (
                                <span className="ml-1 inline-flex items-center align-baseline">
                                  <FontAwesomeIcon
                                    icon={(message.read_by_any || (message.readers && message.readers.length > 0)) ? faCircleCheckSolid : faCircleCheckRegular}
                                    className="w-3.5 h-3.5 opacity-90"
                                    title={(message.read_by_any || (message.readers && message.readers.length > 0)) ? 'Read' : 'Sent'}
                                  />
                                </span>
                              )}
                            </span>
                          )}
                          {/* Reaction chips under bubble */}
                          {Object.keys(reactions[message.id] || {}).length > 0 && (
                            <div className={`mt-1 flex flex-wrap gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              {Object.entries(reactions[message.id]).map(([key, count]) => {
                                const iconDef = iconMap[key];
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => toggleReaction(message.id, key)}
                                    className={`px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                                      userReactions[message.id]?.has(key)
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

                      {/* Action toolbar for others: right of bubble */}
                      {!isOwn && (
                        <div
                          className={`relative flex items-center gap-1 transition-opacity text-gray-400 ${
                            (pickerOpenFor === message.id || infoOpenFor === message.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                          ref={(el) => {
                            if (pickerOpenFor === message.id) pickerContainerRef.current = el;
                            if (infoOpenFor === message.id) infoContainerRef.current = el;
                          }}
                        >
                          <button
                            type="button"
                            className="hover:text-baywatch-orange"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPickerOpenFor(pickerOpenFor === message.id ? null : message.id);
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
                              setReplyTo(message);
                              setTimeout(() => inputRef.current?.focus(), 0);
                            }}
                            title="Reply"
                          >
                            <ReplyIcon className="w-4 h-4" />
                          </button>
                          {canDeleteMessage(message) && (
                            <button
                              onClick={(e) => handleDeleteMessage(message.id, e)}
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
                              const parsed = parseReplyMarker(message.content);
                              const ok = await copyToClipboard(parsed.text);
                              if (ok) {
                                setCopiedFor(message.id);
                                setTimeout(() => setCopiedFor(prev => (prev === message.id ? null : prev)), 1200);
                              }
                            }}
                            title={copiedFor === message.id ? 'Copied!' : 'Copy message'}
                          >
                            <CopyIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="hover:text-baywatch-orange"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInfoOpenFor(infoOpenFor === message.id ? null : message.id);
                            }}
                            title="Message info"
                          >
                            <InfoIcon className="w-4 h-4" />
                          </button>
                          {pickerOpenFor === message.id && (
                            <div className="absolute bottom-full left-0 mb-2 z-20">
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-xl whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  {quickIcons.map(({ key, icon, title }) => (
                                    <button
                                      key={key}
                                      type="button"
                                      className="px-1.5 py-1 rounded hover:bg-gray-800"
                                      title={title}
                                      onClick={() => toggleReaction(message.id, key)}
                                    >
                                      <FontAwesomeIcon icon={icon} className="w-4 h-4" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          {copiedFor === message.id && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 text-white text-xs px-2 py-0.5 rounded shadow">
                              Copied
                            </div>
                          )}
                          {infoOpenFor === message.id && (
                            <div className="absolute bottom-full left-full ml-2 mb-2 z-20">
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-sm min-w-[260px] max-w-xs">
                                <div className="text-gray-300 font-medium mb-1">Message info</div>
                                <div className="text-gray-400">
                                  <div><span className="text-gray-500">From:</span> {message.sender_username}</div>
                                  <div><span className="text-gray-500">ID:</span> {message.id}</div>
                                  <div className="mt-1">
                                    <span className="text-gray-500">Sent:</span>{' '}
                                    {new Date(message.timestamp).toLocaleString(undefined, {
                                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                      hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
                                      timeZoneName: 'short'
                                    })}
                                  </div>
                                  {(message.readers && message.readers.length > 0) ? (
                                    <div className="mt-2">
                                      <div className="text-gray-500 mb-1">Read by:</div>
                                      <ul className="space-y-0.5 max-h-40 overflow-y-auto pr-1">
                                        {message.readers.map(r => (
                                          <li key={`reader-${message.id}-${r.user_id}`} className="flex items-center justify-between">
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
                                  {selectedChannel && (
                                    <div><span className="text-gray-500">Channel:</span> {selectedChannel.name}</div>
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
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={selectedChannel ? `Message ${selectedChannel.name}` : 'Select a channel to type...'}
                className="flex-1 bg-gray-800 text-gray-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-baywatch-orange border border-gray-600"
                disabled={!selectedChannel}
              />
              <button
                type="submit"
                className="bg-baywatch-orange hover:bg-baywatch-orange/80 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedChannel || !messageInput.trim()}
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

      {/* Channel Management Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-md">
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
                    className="flex-1 bg-gray-700 text-gray-100 border border-gray-600 rounded-r-md px-3 py-2 focus:outline-none"
                    placeholder="channel-name"
                    required
                  />
                </div>
              </div>
              {/* Privacy toggle */}
              <div className="mb-4">
                <div className="flex items-center">
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="sr-only"
                    />
                    <label 
                      htmlFor="isPrivate" 
                      className={`w-4 h-4 border-2 rounded flex items-center justify-center cursor-pointer ${
                        isPrivate
                          ? 'bg-baywatch-orange border-baywatch-orange' 
                          : 'border-gray-300 bg-transparent'
                      }`}
                    >
                      {isPrivate && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  </div>
                  <label htmlFor="isPrivate" className="ml-2 cursor-pointer">Private channel</label>
                </div>
              </div>

              {/* Members selection if private */}
              {isPrivate && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Select members</label>
                  <div className="max-h-40 overflow-y-auto bg-gray-700 border border-gray-600 rounded-md p-2">
                    {availableUsers.length === 0 && <p className="text-gray-400 text-sm">No users found.</p>}
                    {availableUsers.map((u) => (
                      <div key={u.id} className="flex items-center space-x-2 py-1">
                        <div className="relative">
                          <input
                            type="checkbox"
                            id={`channel-user-${u.id}`}
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
                            htmlFor={`channel-user-${u.id}`} 
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
                        <label htmlFor={`channel-user-${u.id}`} className="cursor-pointer">{u.username}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  disabled={!channelName.trim() || isLoading}
                  className="px-4 py-2 bg-transparent hover:text-baywatch-orange text-white font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : modalType === 'create' ? 'Create' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Thread Overlay */}
      {threadCenterId != null && (() => {
        const { items } = buildThread(threadCenterId);
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
                  const p = parseReplyMarker(m.content);
                  return (
                    <div key={`thread-${m.id}`} className={`p-3 rounded-xl border ${isOwnMsg ? 'bg-baywatch-orange/10 border-baywatch-orange/40' : 'bg-black/30 border-white/10'}`}>
                      <div className="text-xs text-gray-400 mb-1 flex items-center justify-between">
                        <span className="font-medium text-gray-300">{m.sender_username}</span>
                        <span>{formatTimestamp(m.timestamp)}</span>
                      </div>
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

export default Channels;
