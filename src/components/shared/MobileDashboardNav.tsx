import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Hash, MessagesSquare, ClipboardList, Calendar as CalendarIcon, User as UserIcon, Shield } from 'lucide-react';

export default function MobileDashboardNav() {
  const { channelsHaveUnread, messagesHaveUnread } = useNotifications();
  const { user } = useAuth();

  const Item = ({ to, label, icon: Icon, showDot }: { to: string; label: string; icon: any; showDot?: boolean }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex-1 flex flex-col items-center justify-center py-2 ${
          isActive ? 'text-white' : 'text-gray-400'
        }`
      }
    >
      <div className="relative">
        <Icon className="w-5 h-5" />
        {showDot ? (
          <span className="absolute -top-1 -right-2 w-2.5 h-2.5 rounded-full bg-baywatch-orange shadow" />
        ) : null}
      </div>
      <span className="text-[11px] mt-0.5">{label}</span>
    </NavLink>
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black">
      <div className="max-w-screen-sm mx-auto flex items-stretch">
        <Item to="/dashboard" label="Channels" icon={Hash} showDot={channelsHaveUnread} />
        <Item to="/messages" label="Messages" icon={MessagesSquare} showDot={messagesHaveUnread} />
        <Item to="/calendar" label="Calendar" icon={CalendarIcon} />
        <Item to="/tasks" label="Tasks" icon={ClipboardList} />
        <Item to="/profile" label="Profile" icon={UserIcon} />
        {user?.isAdmin && (
          <>
            <Item to="/admin/users" label="Users" icon={Shield} />
            <Item to="/admin/public-users" label="Public" icon={Shield} />
          </>
        )}
      </div>
    </nav>
  );
}
