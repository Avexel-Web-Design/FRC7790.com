import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationContext';
import { Hash, MessagesSquare, Calendar, Users, FileText, Settings, Shield, ClipboardList, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

const Item = React.forwardRef(({ to, title, icon: Icon, showDot }, ref) => {
  return (
    <NavLink
      to={to}
      title={title}
      className="relative z-10 group flex items-center justify-center w-12 h-12 rounded-full"
      ref={ref}
    >
      {({ isActive }) => (
        <>
          <Icon
            className={`w-5 h-5 transition-colors ${
              isActive ? 'text-white group-hover:text-sca-gold' : 'text-gray-400 group-hover:text-sca-gold'
            }`}
          />
          {showDot ? (
            <span className="absolute -top-0.5 -right-0.5 inline-block w-4 h-4 rounded-full bg-sca-gold shadow" />
          ) : null}
        </>
      )}
    </NavLink>
  );
});
Item.displayName = 'Item';

export default function DashboardSidebar() {
  const { channelsHaveUnread, messagesHaveUnread, plannerHaveUnread } = useNotifications();
  const { user, clearSession } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    try { clearSession(); } catch {}
    window.location.href = '/';
  };

  const location = useLocation();
  // Persist last visited dashboard route
  useEffect(() => {
    const p = location.pathname;
    if (p.startsWith('/channels') || p.startsWith('/messages') || p.startsWith('/calendar') || p.startsWith('/planner') || p.startsWith('/profile') || p.startsWith('/admin')) {
      localStorage.setItem('frc7598_last_dashboard_route', p);
    }
  }, [location.pathname]);
  const itemsContainerRef = useRef(null);
  const refsMap = useRef(new Map());
  const setItemRef = (path) => (el) => {
    if (el) refsMap.current.set(path, el);
    else refsMap.current.delete(path);
  };

  const menuItems = useMemo(() => {
    const base = [
      { to: '/channels', title: 'Channels', icon: Hash, dot: channelsHaveUnread },
      { to: '/messages', title: 'Direct Messages', icon: MessagesSquare, dot: messagesHaveUnread },
      { to: '/calendar', title: 'Calendar', icon: Calendar },
      { to: '/planner', title: 'Planner', icon: ClipboardList, dot: plannerHaveUnread },
      { to: '/profile', title: 'Profile', icon: UserIcon },
    ];
    if (user?.isAdmin) base.push({ to: '/admin/users', title: 'Admin Users', icon: Shield });
    return base;
  }, [channelsHaveUnread, messagesHaveUnread, plannerHaveUnread, user?.isAdmin]);

  const [cursorTop, setCursorTop] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(false);
  const hasMountedRef = useRef(false);

  // Initial measurement without animation
  useLayoutEffect(() => {
    if (hasMountedRef.current) return;
    const activePath = menuItems.find((m) => location.pathname.startsWith(m.to))?.to;
    const container = itemsContainerRef.current;
    const targetEl = activePath ? refsMap.current.get(activePath) : undefined;
    if (!container || !targetEl) return;
    const containerRect = container.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    setCursorTop(targetRect.top - containerRect.top);
    setCursorVisible(true);
    hasMountedRef.current = true;
  }, [location.pathname, menuItems]);

  // Subsequent updates with animation
  useEffect(() => {
    if (!hasMountedRef.current) return;
    const activePath = menuItems.find((m) => location.pathname.startsWith(m.to))?.to;
    const container = itemsContainerRef.current;
    const targetEl = activePath ? refsMap.current.get(activePath) : undefined;
    if (!container || !targetEl) return;
    const containerRect = container.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    setCursorTop(targetRect.top - containerRect.top);
  }, [location.pathname, menuItems]);

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      // Recalculate on resize to keep alignment
      const activePath = menuItems.find((m) => location.pathname.startsWith(m.to))?.to;
      const container = itemsContainerRef.current;
      const targetEl = activePath ? refsMap.current.get(activePath) : undefined;
      if (!container || !targetEl) return;
      const containerRect = container.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      setCursorTop(targetRect.top - containerRect.top);
    });
    if (itemsContainerRef.current) ro.observe(itemsContainerRef.current);
    return () => ro.disconnect();
  }, [location.pathname, menuItems]);

  return (
    <aside className="hidden md:flex md:flex-col items-center gap-3 py-4 px-2 border-r border-white/10 bg-black">
      <Link to="/" title="Home" className="mb-1">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors">
          <img src="/Star.png" alt="Team 7598" className="w-8 h-8" />
        </div>
      </Link>

      {/* Items container with persistent animated cursor */}
      <div className="relative flex flex-col items-center gap-3" ref={itemsContainerRef}>
        {/* Animated cursor */}
        {cursorVisible && (
          <motion.span
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-sca-purple"
            initial={false}
            animate={{ top: cursorTop }}
            transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.5 }}
            aria-hidden="true"
          />
        )}

        {menuItems.slice(0, 5).map((m) => (
          <Item
            key={m.to}
            to={m.to}
            title={m.title}
            icon={m.icon}
            showDot={m.dot}
            ref={setItemRef(m.to)}
          />
        ))}

        <div className="h-px w-8 bg-white/10 my-2" />

        {menuItems.length > 5 && (
          <Item
            key="/admin/users"
            to="/admin/users"
            title="Admin Users"
            icon={Shield}
            ref={setItemRef('/admin/users')}
          />
        )}
      </div>

      {/* Bottom section: divider + logout button */}
      <div className="mt-auto w-full flex flex-col items-center">
        <div className="h-px w-8 bg-white/10 my-2" />
        <button
          title="Logout"
          onClick={handleLogout}
          className="relative group flex items-center justify-center w-12 h-12 rounded-xl text-gray-400 hover:text-sca-gold transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
