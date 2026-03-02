import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { LayoutDashboard, ClipboardCheck, Clipboard, LineChart, Users, Layers, PenSquare, Archive, User as UserIcon, Shield } from 'lucide-react';

function Item({ to, label, icon: Icon, showDot }: { to: string; label: string; icon: ComponentType<{ className?: string }>; showDot?: boolean }) {
  return (
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
        {showDot && (
          <span className="absolute -top-1 -right-2 w-2.5 h-2.5 rounded-full bg-baywatch-orange shadow" />
        )}
      </div>
      <span className="text-[11px] mt-0.5">{label}</span>
    </NavLink>
  );
}

export default function MobileDashboardNav() {
  const { channelsHaveUnread, messagesHaveUnread } = useNotifications();
  const { user } = useAuth();

  return (
    <nav 
      className="md:hidden fixed left-0 right-0 z-40 border-t border-white/10 bg-black"
      style={{
        bottom: '4vh'
      }}
    >
      <div className="max-w-screen-sm mx-auto flex items-stretch">
        <Item to="/dashboard" label="Overview" icon={LayoutDashboard} showDot={channelsHaveUnread} />
        <Item to="/dashboard/match" label="Match" icon={ClipboardCheck} showDot={messagesHaveUnread} />
        <Item to="/dashboard/pit" label="Pit" icon={Clipboard} />
        <Item to="/dashboard/archive" label="Archive" icon={Archive} />
        {user?.isAdmin && <Item to="/dashboard/analytics" label="Stats" icon={LineChart} />}
        {user?.isAdmin && <Item to="/dashboard/alliances" label="Allies" icon={Users} />}
        {user?.isAdmin && <Item to="/dashboard/simulations" label="Sims" icon={Layers} />}
        {user?.isAdmin && <Item to="/dashboard/strategy" label="Draw" icon={PenSquare} />}
        <Item to="/profile" label="Profile" icon={UserIcon} />
        {user?.isAdmin && (
          <>
            <Item to="/admin/users" label="Users" icon={Users} />
            <Item to="/admin/public-users" label="Public" icon={Shield} />
          </>
        )}
      </div>
    </nav>
  );
}
