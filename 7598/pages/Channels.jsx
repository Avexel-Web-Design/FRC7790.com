import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import frcAPI from '@/utils/frcApiClient';
import { generateColor } from '@/utils/color';
import NebulaLoader from '@/components/common/NebulaLoader';
import NotificationDot from '@/components/common/NotificationDot';
import { SmilePlus, Trash2, Reply as ReplyIcon, Copy as CopyIcon, Info as InfoIcon, Paperclip as PaperclipIcon } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faThumbsUp, faThumbsDown, faFaceLaughSquint, faCircleCheck as faCircleCheckRegular } from '@fortawesome/free-regular-svg-icons';
import { faExclamation, faQuestion, faCircleCheck as faCircleCheckSolid } from '@fortawesome/free-solid-svg-icons';

const Channels = () => {
  const { user } = useAuth();
  const { unreadCounts, markChannelAsRead, refreshNotifications, setActiveChannel } = useNotifications();

  const [selectedChannel, setSelectedChannel] = useState({ id: 'general', name: '# general' });
  const [messageInput, setMessageInput] = useState('');
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [isChannelsLoading, setIsChannelsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const prevSelectedChannelRef = useRef(null);

  const [pickerOpenFor, setPickerOpenFor] = useState(null);
  const [infoOpenFor, setInfoOpenFor] = useState(null);
  const [copiedFor, setCopiedFor] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [threadCenterId, setThreadCenterId] = useState(null);
  const pickerContainerRef = useRef(null);
  const infoContainerRef = useRef(null);

  const [draggedChannel, setDraggedChannel] = useState(null);
  const [dragOverChannelId, setDragOverChannelId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [channelName, setChannelName] = useState('');
  const [channelId, setChannelId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  const quickIcons = useMemo(() => ([
    { key: 'heart', icon: faHeart, title: 'Heart' },
    { key: 'thumbs_up', icon: faThumbsUp, title: 'Like' },
    { key: 'thumbs_down', icon: faThumbsDown, title: 'Dislike' },
    { key: 'laugh', icon: faFaceLaughSquint, title: 'Laugh' },
    { key: 'exclamation', icon: faExclamation, title: 'Exclamation' },
    { key: 'question', icon: faQuestion, title: 'Question' },
  ]), []);
  const iconMap = useMemo(() => ({
    heart: faHeart,
    thumbs_up: faThumbsUp,
    thumbs_down: faThumbsDown,
    laugh: faFaceLaughSquint,
    exclamation: faExclamation,
    question: faQuestion,
  }), []);

  const sortMessagesAsc = (arr) => [...arr].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const formatTimestamp = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const isSameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    return isSameDay
      ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })
      : d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
  };

  // Fetch channels
  useEffect(() => {
    const fetchChannels = async () => {
      setIsChannelsLoading(true);
      setError(null);
      try {
        const response = await frcAPI.get(`/chat/channels?user_id=${user?.id ?? ''}`);
        if (response.ok) {
          const data = await response.json();
          setChannels(data);
        } else {
          setChannels([
            { id: 'general', name: '# general' },
            { id: 'random', name: '# random' },
          ]);
        }
      } catch (e) {
        setChannels([{ id: 'general', name: '# general' }]);
      } finally {
        setIsChannelsLoading(false);
      }
    };
    fetchChannels();
  }, [user]);

  // Fetch messages when channel changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChannel) return;
      setIsMessagesLoading(true);
      setError(null);
      try {
        const response = await frcAPI.get(`/chat/messages/${selectedChannel.id}?user_id=${user?.id ?? ''}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(sortMessagesAsc(data));
        } else {
          setMessages([]);
        }
      } catch (e) {
        setMessages([]);
      } finally {
        setIsMessagesLoading(false);
      }
    };
    fetchMessages();
  }, [selectedChannel, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => setActiveChannel(null), [setActiveChannel]);
  useEffect(() => { if (user) setActiveChannel('general'); }, [user, setActiveChannel]);
  useEffect(() => { if (selectedChannel) setActiveChannel(selectedChannel.id); }, [selectedChannel, setActiveChannel]);

  useEffect(() => {
    const handleDocMouseDown = (e) => {
      const t = e.target;
      const inPicker = pickerContainerRef.current && t ? pickerContainerRef.current.contains(t) : false;
      const inInfo = infoContainerRef.current && t ? infoContainerRef.current.contains(t) : false;
      if (!inPicker) setPickerOpenFor(null);
      if (!inInfo) setInfoOpenFor(null);
    };
    document.addEventListener('mousedown', handleDocMouseDown);
    return () => document.removeEventListener('mousedown', handleDocMouseDown);
  }, [pickerOpenFor, infoOpenFor]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setError(null);
    if (!messageInput.trim() || !selectedChannel || !user) return;
    try {
      const contentToSend = replyTo ? `::reply[${replyTo.id}]::${messageInput.trim()}` : messageInput.trim();
      const response = await frcAPI.post(`/chat/messages/${selectedChannel.id}?user_id=${user.id}`, {
        content: contentToSend,
        sender_id: user.id,
      });
      if (response.ok) {
        const updated = await frcAPI.get(`/chat/messages/${selectedChannel.id}?user_id=${user.id}`);
        if (updated.ok) setMessages(sortMessagesAsc(await updated.json()));
        setMessageInput('');
        setReplyTo(null);
        refreshNotifications();
      } else {
        setError(`Failed to send message (${response.status})`);
      }
    } catch (err) {
      setError('Error sending message');
    }
  };

  const parseReplyMarker = (content) => {
    const m = content.match(/^::reply\[(\d+)\]::([\s\S]*)$/);
    return m ? { replyId: parseInt(m[1], 10), text: m[2] } : { replyId: null, text: content };
  };

  const buildThread = (centerId) => {
    const byId = new Map(messages.map(m => [m.id, m]));
    const parentOf = new Map();
    const childrenOf = new Map();
    for (const m of messages) {
      const { replyId } = parseReplyMarker(m.content);
      if (replyId) {
        parentOf.set(m.id, replyId);
        const arr = childrenOf.get(replyId) || [];
        arr.push(m.id);
        childrenOf.set(replyId, arr);
      }
    }
    const ancestors = [];
    const seen = new Set();
    let cur = centerId;
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
    const descendants = [];
    const q = [centerId];
    const visited = new Set([centerId]);
    while (q.length) {
      const id = q.shift();
      const kids = childrenOf.get(id) || [];
      for (const kid of kids) {
        if (visited.has(kid)) continue;
        visited.add(kid);
        const km = byId.get(kid);
        if (km) descendants.push(km);
        q.push(kid);
      }
    }
    descendants.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const center = byId.get(centerId);
    const items = [...ancestors, ...(center ? [center] : []), ...descendants];
    return { items, centerId };
  };

  const handleDeleteMessage = async (messageId, event) => {
    if (!user) return;
    const skip = event?.shiftKey;
    if (!skip && !window.confirm('Are you sure you want to delete this message?')) return;
    setError(null);
    setIsDeletingMessage(true);
    try {
      const response = await frcAPI.request('DELETE', `/chat/messages/${messageId}`, { user_id: user.id });
      if (response.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } else {
        const t = await response.text();
        setError(`Failed to delete message: ${t || response.status}`);
      }
    } catch (e) {
      setError('Error deleting message');
    } finally {
      setIsDeletingMessage(false);
    }
  };

  const copyToClipboard = async (text) => {
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

  const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result;
      if (typeof res === 'string') {
        const comma = res.indexOf(',');
        resolve({ base64: res.substring(comma + 1), contentType: file.type || 'application/octet-stream' });
      } else {
        reject(new Error('Unsupported result type'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleAttachClick = () => fileInputRef.current?.click();

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedChannel) return;
    try {
      const { base64, contentType } = await readFileAsBase64(file);
      const res = await frcAPI.post('/uploads/image', { dataBase64: base64, contentType, filename: file.name || 'image' });
      if (res.ok) {
        const { url } = await res.json();
        const endpoint = `/chat/messages/${selectedChannel.id}?user_id=${user.id}`;
        await frcAPI.post(endpoint, { content: `::image::${url}`, sender_id: user.id });
        const upd = await frcAPI.get(endpoint);
        if (upd.ok) setMessages(sortMessagesAsc(await upd.json()));
      }
    } catch {
      setError('Failed to attach image');
    } finally {
      e.target.value = '';
    }
  };

  const toggleReaction = async (messageId, key) => {
    if (!key || !user) return;
    // optimistic update
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const counts = { ...(m.reaction_counts || {}) };
      const mine = new Set(m.my_reactions || []);
      const has = mine.has(key);
      if (has) {
        const next = (counts[key] || 0) - 1;
        if (next <= 0) delete counts[key]; else counts[key] = next;
        mine.delete(key);
      } else {
        counts[key] = (counts[key] || 0) + 1;
        mine.add(key);
      }
      return { ...m, reaction_counts: counts, my_reactions: Array.from(mine) };
    }));
    setPickerOpenFor(null);
    try {
      const resp = await frcAPI.post(`/chat/messages/${messageId}/reactions/${key}/toggle?user_id=${user.id}`);
      if (!resp.ok) {
        // revert on failure
        setMessages(prev => prev.map(m => {
          if (m.id !== messageId) return m;
          const counts = { ...(m.reaction_counts || {}) };
          const mine = new Set(m.my_reactions || []);
          const has = mine.has(key);
          if (has) {
            // we had added in optimistic; remove now
            const next = (counts[key] || 0) - 1;
            if (next <= 0) delete counts[key]; else counts[key] = next;
            mine.delete(key);
          } else {
            // we had removed in optimistic; add back
            counts[key] = (counts[key] || 0) + 1;
            mine.add(key);
          }
          return { ...m, reaction_counts: counts, my_reactions: Array.from(mine) };
        }));
        setError('Failed to toggle reaction');
      }
    } catch {
      // revert on error
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m;
        const counts = { ...(m.reaction_counts || {}) };
        const mine = new Set(m.my_reactions || []);
        const has = mine.has(key);
        if (has) {
          const next = (counts[key] || 0) - 1;
          if (next <= 0) delete counts[key]; else counts[key] = next;
          mine.delete(key);
        } else {
          counts[key] = (counts[key] || 0) + 1;
          mine.add(key);
        }
        return { ...m, reaction_counts: counts, my_reactions: Array.from(mine) };
      }));
      setError('Failed to toggle reaction');
    }
  };

  const loadUsers = async () => {
    try {
      const resp = await frcAPI.get('/admin/users');
      if (resp.ok) setAvailableUsers(await resp.json());
    } catch (e) {}
  };

  const openCreateModal = () => {
    setModalType('create');
    setChannelName('');
    setChannelId('');
    setIsPrivate(false);
    setSelectedMembers(user ? [user.id] : []);
    setIsModalOpen(true);
    setError(null);
    if (user?.isAdmin) loadUsers();
  };
  const openEditModal = (channel) => {
    setModalType('edit');
    setChannelName(channel.name.replace('# ', ''));
    setChannelId(channel.id);
    setIsPrivate(channel.is_private === 1);
    setSelectedMembers([]);
    setIsModalOpen(true);
    setError(null);
    if (user?.isAdmin) loadUsers();
  };

  const handleCreateChannel = async () => {
    if (!channelName.trim() || !user) return;
    setIsLoading(true);
    setError(null);
    try {
      const id = modalType === 'create' ? channelName.toLowerCase().replace(/\s+/g, '-') : channelId;
      if (modalType === 'create') {
        const response = await frcAPI.post('/chat/channels', { id, name: `# ${channelName.trim()}`, created_by: user.id, is_private: isPrivate, members: selectedMembers });
        if (response.ok) {
          const ch = await frcAPI.get(`/chat/channels?user_id=${user.id}`);
          if (ch.ok) setChannels(await ch.json());
          setIsModalOpen(false);
          setChannelName(''); setChannelId(''); setIsPrivate(false); setSelectedMembers([]);
        } else {
          const t = await response.text();
          setError(`Failed to create channel: ${t || response.status}`);
        }
      } else {
        const response = await frcAPI.put(`/chat/channels/${id}`, { name: `# ${channelName.trim()}`, is_private: isPrivate, members: selectedMembers });
        if (response.ok) {
          const ch = await frcAPI.get(`/chat/channels?user_id=${user.id}`);
          if (ch.ok) setChannels(await ch.json());
          setIsModalOpen(false);
          setChannelName(''); setChannelId(''); setIsPrivate(false); setSelectedMembers([]);
        } else {
          const t = await response.text();
          setError(`Failed to update channel: ${t || response.status}`);
        }
      }
    } catch (e) {
      setError('Error managing channel');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChannel = async (channel) => {
    if (channel.id === 'general') { alert('Cannot delete the general channel'); return; }
    if (!window.confirm(`Are you sure you want to delete the channel "${channel.name}"? All messages will be permanently deleted.`)) return;
    setError(null);
    try {
      const response = await frcAPI.delete(`/chat/channels/${channel.id}`);
      if (response.ok) {
        if (selectedChannel?.id === channel.id) {
          const general = channels.find(c => c.id === 'general');
          if (general) setSelectedChannel(general);
        }
        const ch = await frcAPI.get(`/chat/channels?user_id=${user?.id ?? ''}`);
        if (ch.ok) setChannels(await ch.json());
      } else {
        const t = await response.text();
        setError(`Failed to delete channel: ${t || response.status}`);
      }
    } catch (e) {
      setError('Error deleting channel');
    }
  };

  const handleDragStart = (e, channel) => {
    if (!user?.isAdmin) return;
    setDraggedChannel(channel);
    const dragImg = document.createElement('span');
    dragImg.innerHTML = channel.name;
    dragImg.style.position = 'absolute';
    dragImg.style.top = '-9999px';
    document.body.appendChild(dragImg);
    e.dataTransfer.setDragImage(dragImg, 0, 0);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { document.body.removeChild(dragImg); }, 0);
  };
  const handleDragOver = (e, channelId) => {
    e.preventDefault();
    if (!user?.isAdmin || !draggedChannel || draggedChannel.id === channelId) return;
    e.dataTransfer.dropEffect = 'move';
    setDragOverChannelId(channelId);
  };
  const handleDragLeave = () => setDragOverChannelId(null);
  const handleDrop = async (e, targetChannel) => {
    e.preventDefault();
    if (!user?.isAdmin || !draggedChannel || draggedChannel.id === targetChannel.id) {
      setDraggedChannel(null); setDragOverChannelId(null); return;
    }
    const current = [...channels];
    const di = current.findIndex(c => c.id === draggedChannel.id);
    const ti = current.findIndex(c => c.id === targetChannel.id);
    if (di === -1 || ti === -1) { setDraggedChannel(null); return; }
    const [dragged] = current.splice(di, 1);
    current.splice(ti, 0, dragged);
    const updated = current.map((c, i) => ({ ...c, position: i + 1 }));
    setChannels(updated);
    setDraggedChannel(null);
    try {
      const res = await frcAPI.post('/chat/channels/reorder', { channels: updated.map(c => ({ id: c.id, position: c.position })) });
      if (!res.ok) {
        const ch = await frcAPI.get(`/chat/channels?user_id=${user?.id ?? ''}`);
        if (ch.ok) setChannels(await ch.json());
      }
    } catch {}
  };

  const handleChannelClick = (channel) => {
    setSelectedChannel(channel);
    setActiveChannel(channel.id);
    markChannelAsRead(channel.id);
  };

  const canDeleteMessage = (message) => !!user && (user.isAdmin || message.sender_id === user.id);

  return (
    <div className="flex h-full w-full min-w-0 bg-black text-gray-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-black flex-col">
        <div className="pr-2">
          <div className="px-4 pb-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold">Channels</h2>
            {user?.isAdmin && (
              <button onClick={openCreateModal} className="bg-black hover:bg-sca-purple text-sca-purple hover:text-white rounded-full p-1" title="Create new channel">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          {isChannelsLoading ? (
            <div className="flex items-center justify-center p-4"><NebulaLoader size={48} /></div>
          ) : (
            <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
              {channels.map((channel) => (
                <div key={channel.id} className={`flex items-center justify-between ${dragOverChannelId === channel.id ? 'border-2 border-sca-purple border-dashed bg-sca-purple/25' : ''} ${draggedChannel?.id === channel.id ? 'opacity-50' : ''} rounded-md`}
                  draggable={user?.isAdmin}
                  onDragStart={(e) => handleDragStart(e, channel)}
                  onDragOver={(e) => handleDragOver(e, channel.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, channel)}
                >
                  <button onClick={() => handleChannelClick(channel)} className={`flex-1 text-left py-2 px-3 rounded-md transition-colors duration-200 ${selectedChannel?.id === channel.id ? 'bg-sca-purple text-white hover:text-white' : 'hover:text-sca-purple'} relative flex items-center justify-between`}>
                    <span>{channel.name}</span>
                    {unreadCounts[channel.id] > 0 && <NotificationDot count={unreadCounts[channel.id]} />}
                  </button>
                  {user?.isAdmin && channel.id !== 'general' && (
                    <div className="flex space-x-1 pr-2">
                      <button onClick={() => openEditModal(channel)} className="text-gray-400 hover:text-sca-purple" title="Edit channel">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                      </button>
                      <button onClick={() => handleDeleteChannel(channel)} className="text-gray-400 hover:text-red-500" title="Delete channel">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
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
      <div
        className={`md:hidden ${!selectedChannel ? 'flex-1 min-h-0' : 'hidden'}`}
        onClick={(e) => {
          if (selectedChannel) return; // only active when menu is open
          if (e.target.closest('button, a, input, textarea, select, label, [role="button"]')) return;
          const prev = prevSelectedChannelRef.current;
          if (prev) setSelectedChannel(prev);
        }}
      >
        {!selectedChannel ? (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Channels</h2>
              {user?.isAdmin && (
                <button onClick={openCreateModal} className="bg-black hover:bg-sca-purple text-sca-purple hover:text-white rounded-full p-2" title="Create new channel">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                </button>
              )}
            </div>
            {isChannelsLoading ? (
              <div className="flex items-center justify-center p-8"><NebulaLoader size={48} /></div>
            ) : (
              <div className="space-y-3">
                {channels.map((channel) => (
                  <button key={channel.id} onClick={() => handleChannelClick(channel)} className="w-full text-left py-4 px-4 rounded-xl border border-gray-700 hover:border-sca-purple hover:bg-gray-800 active:bg-gray-700 transition-all duration-200 flex items-center justify-between mobile-touch-target">
                    <span className="font-medium text-base">{channel.name}</span>
                    {unreadCounts[channel.id] > 0 && <NotificationDot count={unreadCounts[channel.id]} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Main Chat Area */}
  <div className={`flex-1 flex flex-col min-h-0 min-w-0 ${!selectedChannel ? 'hidden md:flex' : ''}`}>
        {/* Chat Header */}
  <div className="bg-black px-2 w-full">
          <div className="px-4 pb-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center">
              {/* Mobile Back Button */}
              <button onClick={() => { prevSelectedChannelRef.current = selectedChannel; setSelectedChannel(null); }} className="md:hidden mr-3 p-2 hover:text-sca-purple hover:bg-gray-800 rounded-lg transition-colors mobile-touch-target">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h2 className="text-lg md:text-xl font-bold truncate">{selectedChannel ? selectedChannel.name : 'Select a Channel'}</h2>
            </div>
            <div className="hidden md:flex items-center">
              <div className="w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: user?.name ? generateColor(user.name, user?.avatarColor || null) : '#471a67' }}>
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
              </div>
              <div>
                <p className="font-semibold">{user?.name}</p>
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
  <div className="flex-1 min-w-0 p-4 overflow-y-auto overflow-x-hidden pb-20 md:pb-4">
          {isMessagesLoading ? (
            <div className="flex items-center justify-center h-full"><NebulaLoader size={64} /></div>
          ) : selectedChannel ? (
            messages.length > 0 ? (
              <div className="flex flex-col justify-end min-h-full">
                {messages.map((message, idx) => {
                  const isOwn = !!user && message.sender_id === user.id;
                  const prev = idx > 0 ? messages[idx - 1] : null;
                  const next = idx < messages.length - 1 ? messages[idx + 1] : null;
                  const TWO_MIN = 120000;
                  const thisTs = new Date(message.timestamp).getTime();
                  const prevTs = prev ? new Date(prev.timestamp).getTime() : 0;
                  const nextTs = next ? new Date(next.timestamp).getTime() : 0;
                  const samePrev = !!prev && prev.sender_id === message.sender_id;
                  const sameNext = !!next && next.sender_id === message.sender_id;
                  const closePrev = samePrev && (thisTs - prevTs) <= TWO_MIN;
                  const closeNext = sameNext && (nextTs - thisTs) <= TWO_MIN;
                  const isFirst = !closePrev;
                  const isLast = !closeNext;

                  const avatarColor = message.sender_avatar_color || generateColor(message.sender_username, null);
                  const avatar = (
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg" style={{ backgroundColor: avatarColor }}>
                      {message.sender_username?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '??'}
                    </div>
                  );

                  const bubbleRadius = (() => {
                    const base = (!isOwn && isFirst) ? 'rounded-2xl' : 'rounded-3xl';
                    const mods = [];
                    if (!isFirst) mods.push(isOwn ? 'rounded-tr-md' : 'rounded-tl-md');
                    if (!isLast) mods.push(isOwn ? 'rounded-br-md' : 'rounded-bl-md');
                    return [base, ...mods].join(' ');
                  })();

                  const parsed = parseReplyMarker(message.content);
                  const repliedMsg = parsed.replyId ? messages.find(m => m.id === parsed.replyId) : null;
                  const repliedParsed = repliedMsg ? parseReplyMarker(repliedMsg.content) : null;
                  const repliedSnippet = repliedParsed ? repliedParsed.text : '';

                  return (
                    <div key={message.id} id={`msg-${message.id}`} className={`relative flex items-end gap-2 mb-1 ${isFirst ? 'mt-3' : 'mt-0'} group ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      {!isOwn && (isLast ? (<div className="self-end">{avatar}</div>) : (<div className="w-8 md:w-10" />))}

                      {isOwn && (
                        <div className={`relative flex items-center gap-1 transition-opacity text-gray-400 ${(pickerOpenFor === message.id || infoOpenFor === message.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                          ref={(el) => { if (pickerOpenFor === message.id) pickerContainerRef.current = el; if (infoOpenFor === message.id) infoContainerRef.current = el; }}>
                          <button type="button" className="hover:text-sca-purple" onClick={(e) => { e.stopPropagation(); setInfoOpenFor(infoOpenFor === message.id ? null : message.id); }} title="Message info">
                            <InfoIcon className="w-4 h-4" />
                          </button>
                          <button type="button" className="hover:text-sca-purple" onClick={async (e) => { e.stopPropagation(); const ok = await copyToClipboard(parsed.text); if (ok) { setCopiedFor(message.id); setTimeout(() => setCopiedFor(prev => (prev === message.id ? null : prev)), 1200); } }} title={copiedFor === message.id ? 'Copied!' : 'Copy message'}>
                            <CopyIcon className="w-4 h-4" />
                          </button>
                          {canDeleteMessage(message) && (
                            <button onClick={(e) => handleDeleteMessage(message.id, e)} className={`hover:text-red-400 text-current`} title={`Delete message\n(Hold Shift to skip confirmation)`} disabled={isDeletingMessage}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <button type="button" className="hover:text-sca-purple" onClick={(e) => { e.stopPropagation(); setReplyTo(message); setTimeout(() => inputRef.current?.focus(), 0); }} title="Reply">
                            <ReplyIcon className="w-4 h-4" />
                          </button>
                          <button type="button" className="hover:text-sca-purple" onClick={(e) => { e.stopPropagation(); setPickerOpenFor(pickerOpenFor === message.id ? null : message.id); }} title="Add reaction">
                            <SmilePlus className="w-4 h-4" />
                          </button>
                          {pickerOpenFor === message.id && (
                            <div className="absolute bottom-full right-0 mb-2 z-20">
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-xl whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  {quickIcons.map(({ key, icon, title }) => (
                                    <button key={key} type="button" className="px-1.5 py-1 rounded hover:bg-gray-800" title={title} onClick={() => toggleReaction(message.id, key)}>
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
                                  <div className="mt-1"><span className="text-gray-500">Sent:</span> {new Date(message.timestamp).toLocaleString()}</div>
                                  {selectedChannel && (<div><span className="text-gray-500">Channel:</span> {selectedChannel.name}</div>)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`max-w-[85%] px-3 py-2 ${bubbleRadius} shadow-sm ${isOwn ? 'bg-sca-purple text-white' : 'bg-gray-800 text-gray-100'}`}>
                        {parsed.replyId && (
                          <button type="button" onClick={() => setThreadCenterId(message.id)} className={`mb-1 text-xs rounded-md px-2 py-1 border ${isOwn ? 'bg-white/10 border-white/30 text-white/90' : 'bg-black/20 border-white/10 text-gray-300'}`} title="View replied message">
                            <span className="opacity-80">Replying to {repliedMsg ? repliedMsg.sender_username : 'message'}: {repliedSnippet?.slice(0, 80)}{repliedSnippet && repliedSnippet.length > 80 ? '…' : ''}</span>
                          </button>
                        )}
                        {!isOwn && isFirst && (<div className="text-xs font-semibold mb-1 opacity-90">{message.sender_username}</div>)}
                        <div className={`whitespace-pre-wrap break-words ${isOwn ? 'text-right' : ''}`}>
                          {parsed.text.startsWith('::image::') ? (
                            <img src={parsed.text.replace('::image::','')} alt="attachment" className="max-w-full rounded-lg border border-white/10" />
                          ) : (
                            <span>{parsed.text}</span>
                          )}
                          {isLast && (
                            <span className={`ml-2 text-[10px] ${isOwn ? 'text-white/80' : 'text-gray-400'} whitespace-nowrap align-baseline`}>
                              {formatTimestamp(message.timestamp)}
                              {isOwn && (
                                <span className="ml-1 inline-flex items-center align-baseline">
                                  <FontAwesomeIcon icon={(message.read_by_any || (message.readers && message.readers.length > 0)) ? faCircleCheckSolid : faCircleCheckRegular} className="w-3.5 h-3.5 opacity-90" title={(message.read_by_any || (message.readers && message.readers.length > 0)) ? 'Read' : 'Sent'} />
                                </span>
                              )}
                            </span>
                          )}
                          {Object.keys(message.reaction_counts || {}).length > 0 && (
                            <div className={`mt-1 flex flex-wrap gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              {Object.entries(message.reaction_counts || {}).map(([key, count]) => (
                                <button key={key} type="button" onClick={() => toggleReaction(message.id, key)} className={`px-1.5 py-0.5 rounded-full text-xs border transition-colors ${(message.my_reactions || []).includes(key) ? (isOwn ? 'bg-white/20 border-white/40' : 'bg-white/10 border-white/20') : (isOwn ? 'bg-black/10 border-white/20' : 'bg-black/20 border-white/10')}`} title="Toggle reaction">
                                  <FontAwesomeIcon icon={iconMap[key]} className="w-3.5 h-3.5 mr-1 inline-block" />
                                  <span className="tabular-nums">{count}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {!isOwn && (
                        <div className={`relative flex items-center gap-1 transition-opacity text-gray-400 ${(pickerOpenFor === message.id || infoOpenFor === message.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                          ref={(el) => { if (pickerOpenFor === message.id) pickerContainerRef.current = el; if (infoOpenFor === message.id) infoContainerRef.current = el; }}>
                          <button type="button" className="hover:text-sca-purple" onClick={(e) => { e.stopPropagation(); setPickerOpenFor(pickerOpenFor === message.id ? null : message.id); }} title="Add reaction">
                            <SmilePlus className="w-4 h-4" />
                          </button>
                          <button type="button" className="hover:text-sca-purple" onClick={(e) => { e.stopPropagation(); setReplyTo(message); setTimeout(() => inputRef.current?.focus(), 0); }} title="Reply">
                            <ReplyIcon className="w-4 h-4" />
                          </button>
                          {canDeleteMessage(message) && (
                            <button onClick={(e) => handleDeleteMessage(message.id, e)} className={`hover:text-red-400 text-current`} title={`Delete message\n(Hold Shift to skip confirmation)`} disabled={isDeletingMessage}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <button type="button" className="hover:text-sca-purple" onClick={async (e) => { e.stopPropagation(); const ok = await copyToClipboard(parsed.text); if (ok) { setCopiedFor(message.id); setTimeout(() => setCopiedFor(prev => (prev === message.id ? null : prev)), 1200); } }} title={copiedFor === message.id ? 'Copied!' : 'Copy message'}>
                            <CopyIcon className="w-4 h-4" />
                          </button>
                          <button type="button" className="hover:text-sca-purple" onClick={(e) => { e.stopPropagation(); setInfoOpenFor(infoOpenFor === message.id ? null : message.id); }} title="Message info">
                            <InfoIcon className="w-4 h-4" />
                          </button>
                          {pickerOpenFor === message.id && (
                            <div className="absolute bottom-full left-0 mb-2 z-20">
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-xl whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  {quickIcons.map(({ key, icon, title }) => (
                                    <button key={key} type="button" className="px-1.5 py-1 rounded hover:bg-gray-800" title={title} onClick={() => toggleReaction(message.id, key)}>
                                      <FontAwesomeIcon icon={icon} className="w-4 h-4" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          {copiedFor === message.id && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 text-white text-xs px-2 py-0.5 rounded shadow">Copied</div>
                          )}
                          {infoOpenFor === message.id && (
                            <div className="absolute bottom-full left-full ml-2 mb-2 z-20">
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-sm min-w-[260px] max-w-xs">
                                <div className="text-gray-300 font-medium mb-1">Message info</div>
                                <div className="text-gray-400">
                                  <div><span className="text-gray-500">From:</span> {message.sender_username}</div>
                                  <div><span className="text-gray-500">ID:</span> {message.id}</div>
                                  <div className="mt-1"><span className="text-gray-500">Sent:</span> {new Date(message.timestamp).toLocaleString()}</div>
                                  {selectedChannel && (<div><span className="text-gray-500">Channel:</span> {selectedChannel.name}</div>)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full"><p className="text-gray-400">No messages in this channel yet. Send the first one!</p></div>
            )
          ) : (
            <div className="flex items-center justify-center h-full"><p className="text-gray-400">Please select a channel to start chatting.</p></div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-black px-2 pb-safe sticky bottom-0 left-0 right-0 md:relative md:bottom-auto">
          <div className="p-4 border-t border-gray-700">
            {replyTo && (
              <div className="mb-2 flex items-center gap-2 rounded-md border border-gray-700 bg-gray-900 p-2">
                <ReplyIcon className="w-4 h-4 text-sca-purple" />
                <div className="flex-1 overflow-hidden">
                  <div className="text-xs text-gray-400">Replying to {replyTo.sender_username}</div>
                  <div className="text-sm truncate">{parseReplyMarker(replyTo.content).text}</div>
                </div>
                <button type="button" className="text-gray-400 hover:text-red-400 px-2" title="Cancel reply" onClick={() => setReplyTo(null)}>×</button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileSelected} />
              <button type="button" onClick={handleAttachClick} className="bg-gray-800 hover:bg-gray-700 text-white rounded-lg px-3">
                <PaperclipIcon className="w-5 h-5" />
              </button>
              <input type="text" ref={inputRef} value={messageInput} onChange={(e) => setMessageInput(e.target.value)} placeholder={selectedChannel ? `Message ${selectedChannel.name}` : 'Select a channel to type...'} className="flex-1 min-w-0 bg-gray-800 text-gray-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sca-purple border border-gray-600" disabled={!selectedChannel} />
              <button type="submit" className="bg-sca-purple hover:bg-sca-purple/80 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!selectedChannel || !messageInput.trim()}>
                <span className="hidden sm:inline">Send</span>
                <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{modalType === 'create' ? 'Create New Channel' : 'Edit Channel'}</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateChannel(); }}>
              <div className="mb-4">
                <label htmlFor="channelName" className="block text-sm font-medium mb-1">Channel Name</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-gray-700 text-gray-400 border border-r-0 border-gray-600 rounded-l-md">#</span>
                  <input type="text" id="channelName" value={channelName} onChange={(e) => setChannelName(e.target.value)} className="flex-1 bg-gray-700 text-gray-100 border border-gray-600 rounded-r-md px-3 py-2 focus:outline-none" placeholder="channel-name" required />
                </div>
              </div>
              <div className="mb-4">
                <div className="flex items-center">
                  <div className="relative">
                    <input type="checkbox" id="isPrivate" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="sr-only" />
                    <label htmlFor="isPrivate" className={`w-4 h-4 border-2 rounded flex items-center justify-center cursor-pointer ${isPrivate ? 'bg-sca-purple border-sca-purple' : 'border-gray-300 bg-transparent'}`}>
                      {isPrivate && (<svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>)}
                    </label>
                  </div>
                  <label htmlFor="isPrivate" className="ml-2 cursor-pointer">Private channel</label>
                </div>
              </div>
              {isPrivate && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Select members</label>
                  <div className="max-h-40 overflow-y-auto bg-gray-700 border border-gray-600 rounded-md p-2">
                    {availableUsers.length === 0 && <p className="text-gray-400 text-sm">No users found.</p>}
                    {availableUsers.map((u) => (
                      <div key={u.id} className="flex items-center space-x-2 py-1">
                        <div className="relative">
                          <input type="checkbox" id={`channel-user-${u.id}`} checked={selectedMembers.includes(u.id)} onChange={() => { setSelectedMembers((prev) => prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]); }} className="sr-only" />
                          <label htmlFor={`channel-user-${u.id}`} className={`w-4 h-4 border-2 rounded flex items-center justify-center cursor-pointer ${selectedMembers.includes(u.id) ? 'bg-sca-purple border-sca-purple' : 'border-gray-300 bg-transparent'}`}>
                            {selectedMembers.includes(u.id) && (<svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>)}
                          </label>
                        </div>
                        <label htmlFor={`channel-user-${u.id}`} className="cursor-pointer">{u.username}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {error && (<div className="mb-4 bg-red-500/25 border border-red-500 text-red-100 p-2 rounded">{error}</div>)}
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-transparent hover:text-sca-purple text-white font-medium rounded-md transition-colors disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={!channelName.trim() || isLoading} className="px-4 py-2 bg-transparent hover:text-sca-purple text-white font-medium rounded-md transition-colors disabled:opacity-50">{isLoading ? 'Processing...' : modalType === 'create' ? 'Create' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {threadCenterId != null && (() => {
        const { items } = buildThread(threadCenterId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setThreadCenterId(null)}>
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Thread</h3>
                <button className="text-gray-400 hover:text-white" onClick={() => setThreadCenterId(null)} title="Close">×</button>
              </div>
              <div className="space-y-3">
                {items.map(m => {
                  const isOwnMsg = !!user && m.sender_id === user.id;
                  const p = parseReplyMarker(m.content);
                  return (
                    <div key={`thread-${m.id}`} className={`p-3 rounded-xl border ${isOwnMsg ? 'bg-sca-purple/10 border-sca-purple/40' : 'bg-black/30 border-white/10'}`}>
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
