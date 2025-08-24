import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import frcAPI from '@/utils/frcApiClient';
import { generateColor } from '@/utils/color';
import NebulaLoader from '@/components/common/NebulaLoader';
import NotificationDot from '@/components/common/NotificationDot';
import { SmilePlus, Trash2, Reply as ReplyIcon, Copy as CopyIcon, Info as InfoIcon, Paperclip as PaperclipIcon, Image as ImageIcon } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faThumbsUp, faThumbsDown, faFaceLaughSquint, faCircleCheck as faCircleCheckRegular } from '@fortawesome/free-regular-svg-icons';
import { faExclamation, faQuestion, faCircleCheck as faCircleCheckSolid } from '@fortawesome/free-solid-svg-icons';

const DirectMessages = () => {
  const { user } = useAuth();
  const { unreadCounts, markChannelAsRead, refreshNotifications, setActiveChannel } = useNotifications();

  const [chatItems, setChatItems] = useState([]); // users and groups
  const [selectedChat, setSelectedChat] = useState(null); // {type:'dm'|'group', id, ...}
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isChatsLoading, setIsChatsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const prevSelectedChatRef = useRef(null);

  const [pickerOpenFor, setPickerOpenFor] = useState(null);
  const [infoOpenFor, setInfoOpenFor] = useState(null);
  const [copiedFor, setCopiedFor] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [threadCenterId, setThreadCenterId] = useState(null);
  const pickerContainerRef = useRef(null);
  const infoContainerRef = useRef(null);

  // Group chat modal state (create/edit)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupModalMode, setGroupModalMode] = useState('create'); // 'create' | 'edit'
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState([]); // user ids (excluding implicit self)
  const [allUsers, setAllUsers] = useState([]);
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [groupError, setGroupError] = useState('');

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

  const getConversationId = (a, b) => {
    const [x, y] = [a, b].sort((m, n) => m - n);
    return `dm_${x}_${y}`;
  };

  const sortAsc = (arr) => [...arr].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const formatTs = (iso) => {
    const d = new Date(iso); const n = new Date();
    const same = d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
    return same ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }) : d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
  };

  const fetchChats = async (maintainSelection = false) => {
    if (!user) return;
    try {
      if (!maintainSelection) setIsChatsLoading(true);
      setError(null);
      // Merge recent users with all users so non-recent don't disappear
      let recent = [];
      let allUsers = [];
      try {
        const recentResp = await frcAPI.get(`/chat/users/recent?user_id=${user.id}`);
        if (recentResp.ok) recent = await recentResp.json();
      } catch {}
      try {
        const allResp = await frcAPI.get('/chat/users');
        if (allResp.ok) allUsers = (await allResp.json()).filter(u => u.id !== user.id);
      } catch {}
      // De-duplicate by id, prefer recent entries (with last_message_time)
      const byId = new Map();
      for (const r of recent) byId.set(r.id, r);
      for (const a of allUsers) if (!byId.has(a.id)) byId.set(a.id, a);
      const users = Array.from(byId.values());
      // Group chats membership
      let groups = [];
      const groupsResp = await frcAPI.get(`/chat/groups?user_id=${user.id}`);
      if (groupsResp.ok) groups = await groupsResp.json();
      const combined = [
        ...groups.map(g => ({ ...g, type: 'group' })),
        ...users.map(u => ({ ...u, type: 'dm' }))
      ];
      combined.sort((a, b) => {
        const at = a.type === 'group' ? (a.last_activity || a.created_at || '') : (a.last_message_time || '');
        const bt = b.type === 'group' ? (b.last_activity || b.created_at || '') : (b.last_message_time || '');
        if (at && bt) return bt.localeCompare(at);
        if (at) return -1; if (bt) return 1;
        const an = a.type === 'group' ? a.name : a.username;
        const bn = b.type === 'group' ? b.name : b.username;
        return an.localeCompare(bn, undefined, { sensitivity: 'base' });
      });
      setChatItems(combined);
      // Auto-select the top chat when landing on this page
      if (!maintainSelection) {
        const hasCurrent = selectedChat && combined.some(c => c.type === selectedChat.type && c.id === selectedChat.id);
        if (!hasCurrent && combined.length > 0) {
          // Use existing handler to set active channel and mark as read
          handleChatClick(combined[0]);
        }
      }
    } catch (e) {
      setError('Error loading chats');
    } finally {
      if (!maintainSelection) setIsChatsLoading(false);
    }
  };

  useEffect(() => { if (user) fetchChats(); }, [user]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat || !user) return;
      setIsMessagesLoading(true); setError(null);
      try {
        let endpoint = '';
        if (selectedChat.type === 'dm') {
          endpoint = `/chat/messages/dm/${getConversationId(user.id, selectedChat.id)}?user_id=${user.id}`;
        } else {
          endpoint = `/chat/messages/${selectedChat.id}?user_id=${user.id}`;
        }
        const r = await frcAPI.get(endpoint);
        if (r.ok) setMessages(sortAsc(await r.json())); else setMessages([]);
      } catch {
        setMessages([]);
      } finally {
        setIsMessagesLoading(false);
      }
    };
    fetchMessages();
  }, [selectedChat, user]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => () => setActiveChannel(null), [setActiveChannel]);
  useEffect(() => { if (selectedChat && user) { const id = selectedChat.type === 'dm' ? getConversationId(user.id, selectedChat.id) : selectedChat.id.toString(); setActiveChannel(id); } }, [selectedChat, user, setActiveChannel]);

  useEffect(() => {
    const onDoc = (e) => {
      const t = e.target;
      const inPick = pickerContainerRef.current && t ? pickerContainerRef.current.contains(t) : false;
      const inInfo = infoContainerRef.current && t ? infoContainerRef.current.contains(t) : false;
      if (!inPick) setPickerOpenFor(null);
      if (!inInfo) setInfoOpenFor(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [pickerOpenFor, infoOpenFor]);

  const loadAllUsers = async () => {
    try {
      const resp = await frcAPI.get('/chat/users');
      if (resp.ok) setAllUsers(await resp.json()); else setAllUsers([]);
    } catch { setAllUsers([]); }
  };

  const openGroupModal = async () => {
    setGroupModalMode('create');
    setEditingGroupId(null);
    setGroupName('');
    setGroupMembers([]);
    setGroupError('');
    await loadAllUsers();
    setIsGroupModalOpen(true);
  };

  const openEditGroupModal = async (group) => {
    setGroupModalMode('edit');
    setEditingGroupId(group.id);
    setGroupName(group.name || '');
    setGroupMembers([]);
    setGroupError('');
    await loadAllUsers();
    try {
      const m = await frcAPI.get(`/chat/channels/${group.id}/members`);
      if (m.ok) {
        const arr = await m.json();
        const ids = (arr || []).map(x => x.user_id).filter(id => id !== user?.id);
        setGroupMembers(ids);
      }
    } catch {}
    setIsGroupModalOpen(true);
  };

  const toggleMember = (id) => {
    setGroupMembers((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const saveGroup = async () => {
    if (!user) return;
    setGroupError('');
    const name = groupName.trim();
    if (!name) { setGroupError('Group name is required'); return; }
    if (groupMembers.length === 0 && groupModalMode === 'create') { setGroupError('Select at least one member'); return; }
    setIsSavingGroup(true);
    try {
      if (groupModalMode === 'create') {
        const resp = await frcAPI.post('/chat/groups', { name, created_by: user.id, members: groupMembers });
        if (resp.ok) {
          const data = await resp.json();
          setIsGroupModalOpen(false);
          await fetchChats(true);
          const newChat = { type: 'group', id: data.id, name: data.name };
          setSelectedChat(newChat);
        } else {
          const t = await resp.text();
          setGroupError(t || 'Failed to create group');
        }
      } else {
        const members = Array.from(new Set([...(groupMembers || []), user.id]));
        const resp = await frcAPI.put(`/chat/groups/${editingGroupId}`, { name, members });
        if (resp.ok) {
          setIsGroupModalOpen(false);
          await fetchChats(true);
          setChatItems((cur) => cur.map(c => (c.type === 'group' && c.id === editingGroupId) ? { ...c, name } : c));
          setSelectedChat((cur) => cur && cur.type === 'group' && cur.id === editingGroupId ? { ...cur, name } : cur);
        } else {
          const t = await resp.text();
          setGroupError(t || 'Failed to update group');
        }
      }
    } catch {
      setGroupError(groupModalMode === 'create' ? 'Error creating group' : 'Error updating group');
    } finally {
      setIsSavingGroup(false);
    }
  };

  const deleteGroup = async (group) => {
    if (!user || group.type !== 'group') return;
    if (!window.confirm(`Delete group "${group.name}"? All messages will be permanently deleted.`)) return;
    try {
      const resp = await frcAPI.delete(`/chat/groups/${group.id}`);
      if (resp.ok) {
        setChatItems(prev => prev.filter(c => !(c.type === 'group' && c.id === group.id)));
        if (selectedChat && selectedChat.type === 'group' && selectedChat.id === group.id) setSelectedChat(null);
      }
    } catch {}
  };

  const handleChatClick = (chat) => {
    setSelectedChat(chat);
    if (!user) return;
    const channelId = chat.type === 'dm' ? getConversationId(user.id, chat.id) : chat.id.toString();
    setActiveChannel(channelId);
    markChannelAsRead(channelId);
  };

  const parseReplyMarker = (content) => {
    const m = content.match(/^::reply\[(\d+)\]::([\s\S]*)$/);
    return m ? { replyId: parseInt(m[1], 10), text: m[2] } : { replyId: null, text: content };
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChat || !user) return;
    try {
      const content = replyTo ? `::reply[${replyTo.id}]::${messageInput.trim()}` : messageInput.trim();
      let endpoint = '';
      if (selectedChat.type === 'dm') {
        endpoint = `/chat/messages/dm/${getConversationId(user.id, selectedChat.id)}?user_id=${user.id}`;
      } else {
        endpoint = `/chat/messages/${selectedChat.id}?user_id=${user.id}`;
      }
      const resp = await frcAPI.post(endpoint, { content, sender_id: user.id });
      if (resp.ok) {
        const upd = await frcAPI.get(endpoint);
        if (upd.ok) setMessages(sortAsc(await upd.json()));
        setMessageInput(''); setReplyTo(null); refreshNotifications();
        setChatItems((cur) => {
          const idx = cur.findIndex(c => c.type === selectedChat.type && c.id === selectedChat.id);
          if (idx >= 0) {
            const copy = [...cur];
            const [moved] = copy.splice(idx, 1);
            const now = new Date().toISOString();
            if (moved.type === 'dm') moved.last_message_time = now; else moved.last_activity = now;
            copy.unshift(moved);
            return copy;
          }
          return cur;
        });
      }
    } catch {
      setError('Error sending message');
    }
  };

  const handleDeleteMessage = async (id, ev) => {
    if (!user) return;
    if (!(ev?.shiftKey) && !window.confirm('Delete this message?')) return;
    setIsDeletingMessage(true);
    try {
      const r = await frcAPI.request('DELETE', `/chat/messages/${id}`, { user_id: user.id });
      if (r.ok) setMessages(prev => prev.filter(m => m.id !== id));
    } catch {} finally { setIsDeletingMessage(false); }
  };

  const copyToClipboard = async (text) => {
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch {}
    try { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.focus(); ta.select(); const ok = document.execCommand('copy'); document.body.removeChild(ta); return ok; } catch { return false; }
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
    if (!file || !user || !selectedChat) return;
    try {
      const { base64, contentType } = await readFileAsBase64(file);
      const res = await frcAPI.post('/uploads/image', { dataBase64: base64, contentType, filename: file.name || 'image' });
      if (res.ok) {
        const { url } = await res.json();
        // Send as an image message with a special prefix to render as image
        const endpoint = selectedChat.type === 'dm'
          ? `/chat/messages/dm/${getConversationId(user.id, selectedChat.id)}?user_id=${user.id}`
          : `/chat/messages/${selectedChat.id}?user_id=${user.id}`;
        await frcAPI.post(endpoint, { content: `::image::${url}`, sender_id: user.id });
        const upd = await frcAPI.get(endpoint);
        if (upd.ok) setMessages(sortAsc(await upd.json()));
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
      if (seen.has(cur)) break; seen.add(cur);
      const p = parentOf.get(cur);
      if (p != null) { const pm = byId.get(p); if (pm) ancestors.unshift(pm); cur = p; } else break;
    }
    const descendants = [];
    const q = [centerId];
    const visited = new Set([centerId]);
    while (q.length) {
      const id = q.shift();
      const kids = childrenOf.get(id) || [];
      for (const k of kids) { if (visited.has(k)) continue; visited.add(k); const m = byId.get(k); if (m) descendants.push(m); q.push(k); }
    }
    descendants.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const center = byId.get(centerId);
    return { items: [...ancestors, ...(center ? [center] : []), ...descendants] };
  };

  const canDelete = (m) => !!user && (user.isAdmin || m.sender_id === user.id);

  return (
    <div className="flex h-full w-full min-w-0 bg-black text-gray-100 overflow-hidden">
      {/* Desktop sidebar: chats list */}
      <div className="hidden md:flex w-64 bg-black flex-col">
        <div className="px-2">
          <div className="px-4 pb-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold">Messages</h2>
            <button onClick={openGroupModal} className="bg-black hover:bg-sca-purple text-sca-purple hover:text-white rounded-full p-1" title="Create group chat">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        {isChatsLoading ? (
          <div className="flex items-center justify-center p-4"><NebulaLoader size={48} /></div>
        ) : (
          <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
            {chatItems.map((chat) => {
              const key = `${chat.type}-${chat.id}`;
              const label = chat.type === 'group' ? chat.name : chat.username;
              const color = chat.type === 'group' ? '#4b5563' : (chat.avatar_color || generateColor(label, null));
              const channelId = chat.type === 'dm' && user ? getConversationId(user.id, chat.id) : chat.id.toString();
              const unread = unreadCounts[channelId] || 0;
              const isSelected = selectedChat?.type === chat.type && selectedChat?.id === chat.id;
              return (
                <div key={key} className={`flex items-center justify-between w-full py-2 px-3 rounded-md ${isSelected ? 'bg-sca-purple text-white' : 'hover:text-sca-purple'}`}>
                  <button onClick={() => handleChatClick(chat)} className="flex items-center gap-3 flex-1 text-left">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: color }}>
                        {label?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                      </div>
                      {unread > 0 && <NotificationDot count={unread} position="top-right" size="medium" />}
                    </div>
                    <span className="truncate">{label}</span>
                  </button>
                  {user?.isAdmin && chat.type === 'group' && (
                    <div className="flex gap-2 pl-2">
                      <button onClick={(e) => { e.stopPropagation(); openEditGroupModal(chat); }} className="text-gray-400 hover:text-white" title="Edit group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteGroup(chat); }} className="text-gray-400 hover:text-red-400" title="Delete group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        )}
      </div>

      {/* Mobile list selector */}
      <div
        className={`md:hidden ${!selectedChat ? 'flex-1 min-h-0' : 'hidden'}`}
        onClick={(e) => {
          if (selectedChat) return; // only active when menu is open
          if (e.target.closest('button, a, input, textarea, select, label, [role="button"]')) return;
          const prev = prevSelectedChatRef.current;
          if (prev) setSelectedChat(prev);
        }}
      >
        {!selectedChat ? (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Messages</h2>
              <button onClick={openGroupModal} className="bg-black hover:bg-sca-purple text-sca-purple hover:text-white rounded-full p-2" title="Create group chat">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              </button>
            </div>
            {isChatsLoading ? (
              <div className="flex items-center justify-center p-8"><NebulaLoader size={48} /></div>
            ) : (
              <div className="space-y-3">
                {chatItems.map((chat) => {
                  const key = `${chat.type}-${chat.id}`;
                  const label = chat.type === 'group' ? chat.name : chat.username;
                  const color = chat.type === 'group' ? '#4b5563' : (chat.avatar_color || generateColor(label, null));
                  const channelId = chat.type === 'dm' && user ? getConversationId(user.id, chat.id) : chat.id.toString();
                  const unread = unreadCounts[channelId] || 0;
                  return (
                    <div key={key} className="w-full py-4 px-4 rounded-xl border border-gray-700 hover:border-sca-purple hover:bg-gray-800 active:bg-gray-700 transition-all duration-200 flex items-center justify-between mobile-touch-target">
                      <button onClick={() => handleChatClick(chat)} className="flex items-center gap-3 flex-1 text-left">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base" style={{ backgroundColor: color }}>
                            {label?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                          </div>
                          {unread > 0 && <NotificationDot count={unread} position="top-right" size="medium" />}
                        </div>
                        <span className="font-medium text-base">{label}</span>
                      </button>
                      {user?.isAdmin && chat.type === 'group' && (
                        <div className="flex gap-3 pl-2">
                          <button onClick={(e) => { e.stopPropagation(); openEditGroupModal(chat); }} className="text-gray-400 hover:text-white" title="Edit group">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deleteGroup(chat); }} className="text-gray-400 hover:text-red-400" title="Delete group">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Chat area */}
  <div className={`flex-1 flex flex-col min-h-0 min-w-0 ${!selectedChat ? 'hidden md:flex' : ''}`}>
  <div className="bg-black px-2 w-full">
          <div className="px-4 pb-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => { prevSelectedChatRef.current = selectedChat; setSelectedChat(null); }} className="md:hidden mr-3 p-2 hover:text-sca-purple hover:bg-gray-800 rounded-lg transition-colors mobile-touch-target">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h2 className="text-lg md:text-xl font-bold truncate">{selectedChat ? (selectedChat.type === 'group' ? selectedChat.name : selectedChat.username) : 'Select a chat'}</h2>
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

        {error && (
          <div className="bg-red-500 text-white p-2 text-sm text-center">{error}<button onClick={() => setError(null)} className="ml-2 font-bold">×</button></div>
        )}

  <div className="flex-1 min-w-0 p-4 overflow-y-auto overflow-x-hidden pb-20 md:pb-4">
          {isMessagesLoading ? (
            <div className="flex items-center justify-center h-full"><NebulaLoader size={64} /></div>
          ) : selectedChat ? (
            messages.length > 0 ? (
              <div className="flex flex-col justify-end min-h-full">
                {messages.map((m, idx) => {
                  const isOwn = !!user && m.sender_id === user.id;
                  const prev = idx > 0 ? messages[idx - 1] : null;
                  const next = idx < messages.length - 1 ? messages[idx + 1] : null;
                  const isGroup = selectedChat?.type === 'group';
                  const TWO_MIN = 120000; const thisTs = new Date(m.timestamp).getTime();
                  const prevTs = prev ? new Date(prev.timestamp).getTime() : 0;
                  const nextTs = next ? new Date(next.timestamp).getTime() : 0;
                  const samePrev = !!prev && prev.sender_id === m.sender_id;
                  const sameNext = !!next && next.sender_id === m.sender_id;
                  const isFirst = !(samePrev && (thisTs - prevTs) <= TWO_MIN);
                  const isLast = !(sameNext && (nextTs - thisTs) <= TWO_MIN);

                  const avatar = (
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg" style={{ backgroundColor: m.sender_avatar_color || generateColor(m.sender_username, null) }}>
                      {m.sender_username?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                  );

                  const bubbleRadius = (() => {
                    const base = (!isOwn && isFirst && isGroup) ? 'rounded-2xl' : 'rounded-3xl';
                    const mods = [];
                    if (!isFirst) mods.push(isOwn ? 'rounded-tr-md' : 'rounded-tl-md');
                    if (!isLast) mods.push(isOwn ? 'rounded-br-md' : 'rounded-bl-md');
                    return [base, ...mods].join(' ');
                  })();

                  const parsed = parseReplyMarker(m.content);
                  const repliedMsg = parsed.replyId ? messages.find(x => x.id === parsed.replyId) : null;
                  const repliedParsed = repliedMsg ? parseReplyMarker(repliedMsg.content) : null;
                  const repliedSnippet = repliedParsed ? repliedParsed.text : '';

                  return (
                    <div key={m.id} id={`msg-${m.id}`} className={`relative flex items-end gap-2 mb-1 ${isFirst ? 'mt-3' : 'mt-0'} group ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      {!isOwn && isGroup && (isLast ? (<div className="self-end">{avatar}</div>) : (<div className="w-8 md:w-10" />))}

                      {isOwn && (
                        <div className={`relative flex items-center gap-1 transition-opacity text-gray-400 ${(pickerOpenFor === m.id || infoOpenFor === m.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                          ref={(el) => { if (pickerOpenFor === m.id) pickerContainerRef.current = el; if (infoOpenFor === m.id) infoContainerRef.current = el; }}>
                          <button type="button" className="hover:text-sca-purple" onClick={(e) => { e.stopPropagation(); setInfoOpenFor(infoOpenFor === m.id ? null : m.id); }} title="Message info">
                            <InfoIcon className="w-4 h-4" />
                          </button>
                          <button type="button" className="hover:text-sca-purple" onClick={async (e) => { e.stopPropagation(); const ok = await copyToClipboard(parsed.text); if (ok) { setCopiedFor(m.id); setTimeout(() => setCopiedFor(prev => (prev === m.id ? null : prev)), 1200); } }} title={copiedFor === m.id ? 'Copied!' : 'Copy message'}>
                            <CopyIcon className="w-4 h-4" />
                          </button>
                          {canDelete(m) && (
                            <button onClick={(e) => handleDeleteMessage(m.id, e)} className={`hover:text-red-400 text-current`} title={`Delete message\n(Hold Shift to skip confirmation)`} disabled={isDeletingMessage}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <button type="button" className="hover:text-sca-purple" onClick={(e) => { e.stopPropagation(); setReplyTo(m); setTimeout(() => inputRef.current?.focus(), 0); }} title="Reply">
                            <ReplyIcon className="w-4 h-4" />
                          </button>
                          <button type="button" className="hover:text-sca-purple" onClick={(e) => { e.stopPropagation(); setPickerOpenFor(pickerOpenFor === m.id ? null : m.id); }} title="Add reaction">
                            <SmilePlus className="w-4 h-4" />
                          </button>
                          {pickerOpenFor === m.id && (
                            <div className="absolute bottom-full right-0 mb-2 z-20">
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-xl whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  {quickIcons.map(({ key, icon, title }) => (
                                    <button key={key} type="button" className="px-1.5 py-1 rounded hover:bg-gray-800" title={title} onClick={() => toggleReaction(m.id, key)}>
                                      <FontAwesomeIcon icon={icon} className="w-4 h-4" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          {infoOpenFor === m.id && (
                            <div className="absolute bottom-full right-full mr-2 mb-2 z-20">
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-sm min-w-[260px] max-w-xs">
                                <div className="text-gray-300 font-medium mb-1">Message info</div>
                                <div className="text-gray-400">
                                  <div><span className="text-gray-500">From:</span> {m.sender_username}</div>
                                  <div><span className="text-gray-500">ID:</span> {m.id}</div>
                                  <div className="mt-1"><span className="text-gray-500">Sent:</span> {new Date(m.timestamp).toLocaleString()}</div>
                                  {selectedChat && (<div><span className="text-gray-500">Chat:</span> {selectedChat.type === 'group' ? selectedChat.name : selectedChat.username}</div>)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`max-w-[85%] px-3 py-2 ${bubbleRadius} shadow-sm ${isOwn ? 'bg-sca-purple text-white' : 'bg-gray-800 text-gray-100'}`}>
                        {parsed.replyId && (
                          <button type="button" onClick={() => setThreadCenterId(m.id)} className={`mb-1 text-xs rounded-md px-2 py-1 border ${isOwn ? 'bg-white/10 border-white/30 text-white/90' : 'bg-black/20 border-white/10 text-gray-300'}`} title="View replied message">
                            <span className="opacity-80">Replying to {repliedMsg ? repliedMsg.sender_username : 'message'}: {repliedSnippet?.slice(0, 80)}{repliedSnippet && repliedSnippet.length > 80 ? '…' : ''}</span>
                          </button>
                        )}
                        {!isOwn && isFirst && isGroup && (<div className="text-xs font-semibold mb-1 opacity-90">{m.sender_username}</div>)}
                        <div className={`whitespace-pre-wrap break-words ${isOwn ? 'text-right' : ''}`}>
                          {parsed.text.startsWith('::image::') ? (
                            <img src={parsed.text.replace('::image::','')} alt="attachment" className="max-w-full rounded-lg border border-white/10" />
                          ) : (
                            <span>{parsed.text}</span>
                          )}
                          {isLast && (
                            <span className={`ml-2 text-[10px] ${isOwn ? 'text-white/80' : 'text-gray-400'} whitespace-nowrap align-baseline`}>
                              {formatTs(m.timestamp)}
                              {isOwn && (
                                <span className="ml-1 inline-flex items-center align-baseline">
                                  <FontAwesomeIcon icon={m.read_by_any ? faCircleCheckSolid : faCircleCheckRegular} className="w-3.5 h-3.5 opacity-90" title={m.read_by_any ? 'Read' : 'Sent'} />
                                </span>
                              )}
                            </span>
                          )}
                          {Object.keys(m.reaction_counts || {}).length > 0 && (
                            <div className={`mt-1 flex flex-wrap gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              {Object.entries(m.reaction_counts || {}).map(([key, count]) => (
                                <button key={key} type="button" onClick={() => toggleReaction(m.id, key)} className={`px-1.5 py-0.5 rounded-full text-xs border transition-colors ${(m.my_reactions || []).includes(key) ? (isOwn ? 'bg-white/20 border-white/40' : 'bg-white/10 border-white/20') : (isOwn ? 'bg-black/10 border-white/20' : 'bg-black/20 border-white/10')}`} title="Toggle reaction">
                                  <FontAwesomeIcon icon={iconMap[key]} className="w-3.5 h-3.5 mr-1 inline-block" />
                                  <span className="tabular-nums">{count}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {!isOwn && (
                        <div className={`relative flex items-center gap-1 transition-opacity text-gray-400 ${(pickerOpenFor === m.id || infoOpenFor === m.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                          ref={(el) => { if (pickerOpenFor === m.id) pickerContainerRef.current = el; if (infoOpenFor === m.id) infoContainerRef.current = el; }}>
                          <button type="button" className="hover:text-sca-purple" onClick={(e) => { e.stopPropagation(); setPickerOpenFor(pickerOpenFor === m.id ? null : m.id); }} title="Add reaction">
                            <SmilePlus className="w-4 h-4" />
                          </button>
                          <button type="button" className="hover:text-sca-purple" onClick={(e) => { e.stopPropagation(); setReplyTo(m); setTimeout(() => inputRef.current?.focus(), 0); }} title="Reply">
                            <ReplyIcon className="w-4 h-4" />
                          </button>
                          {canDelete(m) && (
                            <button onClick={(e) => handleDeleteMessage(m.id, e)} className={`hover:text-red-400 text-current`} title={`Delete message\n(Hold Shift to skip confirmation)`} disabled={isDeletingMessage}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <button type="button" className="hover:text-sca-purple" onClick={async (e) => { e.stopPropagation(); const ok = await copyToClipboard(parsed.text); if (ok) { setCopiedFor(m.id); setTimeout(() => setCopiedFor(prev => (prev === m.id ? null : prev)), 1200); } }} title={copiedFor === m.id ? 'Copied!' : 'Copy message'}>
                            <CopyIcon className="w-4 h-4" />
                          </button>
                          <button type="button" className="hover:text-sca-purple" onClick={(e) => { e.stopPropagation(); setInfoOpenFor(infoOpenFor === m.id ? null : m.id); }} title="Message info">
                            <InfoIcon className="w-4 h-4" />
                          </button>
                          {pickerOpenFor === m.id && (
                            <div className="absolute bottom-full left-0 mb-2 z-20">
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-xl whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  {quickIcons.map(({ key, icon, title }) => (
                                    <button key={key} type="button" className="px-1.5 py-1 rounded hover:bg-gray-800" title={title} onClick={() => toggleReaction(m.id, key)}>
                                      <FontAwesomeIcon icon={icon} className="w-4 h-4" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          {infoOpenFor === m.id && (
                            <div className="absolute bottom-full left-full ml-2 mb-2 z-20">
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-sm min-w-[260px] max-w-xs">
                                <div className="text-gray-300 font-medium mb-1">Message info</div>
                                <div className="text-gray-400">
                                  <div><span className="text-gray-500">From:</span> {m.sender_username}</div>
                                  <div><span className="text-gray-500">ID:</span> {m.id}</div>
                                  <div className="mt-1"><span className="text-gray-500">Sent:</span> {new Date(m.timestamp).toLocaleString()}</div>
                                  {selectedChat && (<div><span className="text-gray-500">Chat:</span> {selectedChat.type === 'group' ? selectedChat.name : selectedChat.username}</div>)}
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
              <div className="flex items-center justify-center h-full"><p className="text-gray-400">No messages yet. Say hi!</p></div>
            )
          ) : (
            <div className="flex items-center justify-center h-full"><p className="text-gray-400">Select a chat to start messaging.</p></div>
          )}
          <div ref={messagesEndRef} />
        </div>

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
            <form onSubmit={handleSend} className="flex space-x-2">
              <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileSelected} />
              <button type="button" onClick={handleAttachClick} className="bg-gray-800 hover:bg-gray-700 text-white rounded-lg px-3">
                <PaperclipIcon className="w-5 h-5" />
              </button>
              <input type="text" ref={inputRef} value={messageInput} onChange={(e) => setMessageInput(e.target.value)} placeholder={selectedChat ? `Message ${selectedChat.type === 'group' ? selectedChat.name : selectedChat.username}` : 'Select a chat...'} className="flex-1 min-w-0 bg-gray-800 text-gray-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sca-purple border border-gray-600" disabled={!selectedChat} />
              <button type="submit" className="bg-sca-purple hover:bg-sca-purple/80 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!selectedChat || !messageInput.trim()}>
                <span className="hidden sm:inline">Send</span>
                <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </div>
        </div>
      </div>

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
                        <span>{formatTs(m.timestamp)}</span>
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

      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setIsGroupModalOpen(false)}>
          <div className="bg-gray-900 border border-white/10 rounded-lg p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">{groupModalMode === 'create' ? 'New Group Chat' : 'Edit Group Chat'}</h3>
            {groupError && (<div className="mb-2 bg-red-500/20 text-red-200 border border-red-500/40 rounded p-2">{groupError}</div>)}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400">Group name</label>
                <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Project Tigers" className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Select members</label>
                <div className="max-h-48 overflow-y-auto bg-gray-800 border border-white/10 rounded p-2">
                  {allUsers.length === 0 && <p className="text-gray-400 text-sm">No users found.</p>}
                  {allUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-2 py-1 text-sm">
                      <input type="checkbox" disabled={u.id === user?.id} checked={u.id === user?.id ? true : groupMembers.includes(u.id)} onChange={() => toggleMember(u.id)} />
                      <span className="inline-flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: u.avatar_color || generateColor(u.username, null) }}>
                          {u.username?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </span>
                        {u.username}
                        {u.id === user?.id && (<span className="text-xs text-gray-400">(you)</span>)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setIsGroupModalOpen(false)} className="px-4 py-2 rounded bg-white/10">Cancel</button>
              <button onClick={saveGroup} disabled={isSavingGroup} className="px-4 py-2 rounded bg-sca-purple disabled:opacity-50">{isSavingGroup ? (groupModalMode === 'create' ? 'Creating…' : 'Saving…') : (groupModalMode === 'create' ? 'Create Group' : 'Save Changes')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectMessages;
