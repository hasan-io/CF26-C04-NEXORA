import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  AlertTriangle,
  Network,
  Activity,
  Monitor,
  Play,
  Settings,
  Shield,
  Search,
  Bell,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { useState } from 'react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/building', label: '3D Building', icon: Building2 },
  { path: '/incidents', label: 'Incident Reconstruction', icon: AlertTriangle },
  { path: '/network', label: 'Network View', icon: Network },
  { path: '/events', label: 'Live Events', icon: Activity },
  { path: '/device', label: 'Device Details', icon: Monitor },
  { path: '/simulation', label: 'Simulation', icon: Play },
  { path: '/settings', label: 'Settings & Help', icon: Settings },
];

export function NavSidebar() {
  const location = useLocation();
  const { notifications, dismissNotification } = useAppStore();
  const [searchOpen, setSearchOpen] = useState(false);

  const activeIncidents = useAppStore(s => s.incidents.filter(i => i.status === 'active').length);

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[220px] flex flex-col z-50"
      style={{ background: 'var(--sidebar)', borderRight: '1px solid var(--sidebar-border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)' }}
        >
          <Shield className="w-5 h-5" style={{ color: 'var(--cyber-accent)' }} />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-widest" style={{ color: 'var(--foreground)' }}>C-04</div>
          <div className="text-[10px] leading-none" style={{ color: 'var(--muted-foreground)' }}>SCTRE</div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <button
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors"
          style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
          onClick={() => setSearchOpen(!searchOpen)}
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-xs">Search devices, incidents...</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
            const showBadge = path === '/incidents' && activeIncidents > 0;

            return (
              <NavLink
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors duration-150 relative group',
                  isActive
                    ? 'text-[var(--cyber-accent)] bg-[rgba(0,212,255,0.08)]'
                    : 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-xs font-medium leading-tight">{label}</span>
                {showBadge && (
                  <span
                    className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'var(--cyber-critical)', color: '#fff', minWidth: '18px', textAlign: 'center' }}
                  >
                    {activeIncidents}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* System Status */}
      <div className="px-3 pb-4 border-t pt-3" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-md"
          style={{ background: 'var(--muted)', border: '1px solid var(--cyber-border)' }}
        >
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: 'var(--cyber-success)' }}
          />
          <div>
            <div className="text-[10px] font-medium" style={{ color: 'var(--foreground)' }}>MONITORING ACTIVE</div>
            <div className="text-[9px]" style={{ color: 'var(--muted-foreground)' }}>152 devices online</div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {notifications.length > 0 && (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-[100] max-w-xs">
          {notifications.map(n => (
            <div
              key={n.id}
              className="flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg slide-in-top"
              style={{
                background: 'var(--popover)',
                border: `1px solid ${n.type === 'error' ? 'var(--cyber-critical)' : n.type === 'warning' ? 'var(--cyber-warning)' : n.type === 'success' ? 'var(--cyber-success)' : 'var(--cyber-info)'}`,
                minWidth: '250px',
              }}
            >
              <Bell className="w-4 h-4 mt-0.5 shrink-0" style={{ color: n.type === 'error' ? 'var(--cyber-critical)' : n.type === 'warning' ? 'var(--cyber-warning)' : n.type === 'success' ? 'var(--cyber-success)' : 'var(--cyber-info)' }} />
              <span className="text-xs flex-1" style={{ color: 'var(--popover-foreground)' }}>{n.message}</span>
              <button onClick={() => dismissNotification(n.id)} className="shrink-0">
                <X className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
