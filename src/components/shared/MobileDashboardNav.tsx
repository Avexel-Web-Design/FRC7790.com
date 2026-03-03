import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { User as UserIcon, Users, Shield } from 'lucide-react';

function Item({ to, label, icon: Icon }: { to: string; label: string; icon: ComponentType<{ className?: string }> }) {
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
      </div>
      <span className="text-[11px] mt-0.5">{label}</span>
    </NavLink>
  );
}

export default function MobileDashboardNav() {
  const { user } = useAuth();

  return (
    <nav 
      className="md:hidden fixed left-0 right-0 z-40 border-t border-white/10 bg-black"
      style={{
        bottom: '4vh'
      }}
    >
      <div className="max-w-screen-sm mx-auto flex items-stretch">
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
