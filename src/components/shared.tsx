import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, children, className }: PageHeaderProps) {
  return (
    <div
      className={cn('flex items-center justify-between px-6 py-4 border-b', className)}
      style={{ borderColor: 'var(--cyber-border)', background: 'var(--background)' }}
    >
      <div>
        <h1 className="text-base font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>{title}</h1>
        {subtitle && <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'cyan' | 'red' | 'green' | 'orange' | 'blue';
  pulse?: boolean;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, sub, color = 'cyan', pulse, icon }: StatCardProps) {
  const colorMap = {
    cyan: 'var(--cyber-accent)',
    red: 'var(--cyber-critical)',
    green: 'var(--cyber-success)',
    orange: 'var(--cyber-warning)',
    blue: 'var(--cyber-info)',
  };
  const c = colorMap[color];

  return (
    <div className="card-cyber p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
        {icon && <span style={{ color: c }}>{icon}</span>}
      </div>
      <div className={cn('text-3xl font-bold mono tracking-tight', pulse && 'pulse-red')} style={{ color: c }}>
        {value}
      </div>
      {sub && <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{sub}</div>}
    </div>
  );
}

interface SeverityBadgeProps {
  severity: string;
  size?: 'sm' | 'md';
}

export function SeverityBadge({ severity, size = 'md' }: SeverityBadgeProps) {
  const map: Record<string, { color: string; bg: string }> = {
    critical: { color: 'var(--cyber-critical)', bg: 'rgba(255,71,87,0.12)' },
    high: { color: 'var(--cyber-warning)', bg: 'rgba(255,165,2,0.12)' },
    medium: { color: '#f39c12', bg: 'rgba(243,156,18,0.12)' },
    low: { color: 'var(--cyber-success)', bg: 'rgba(46,213,115,0.12)' },
    active: { color: 'var(--cyber-critical)', bg: 'rgba(255,71,87,0.12)' },
    blocked: { color: 'var(--cyber-success)', bg: 'rgba(46,213,115,0.12)' },
    investigating: { color: 'var(--cyber-warning)', bg: 'rgba(255,165,2,0.12)' },
    resolved: { color: 'var(--muted-foreground)', bg: 'rgba(168,181,196,0.1)' },
  };
  const s = map[severity.toLowerCase()] ?? { color: 'var(--muted-foreground)', bg: 'rgba(168,181,196,0.08)' };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-medium uppercase tracking-wider',
        size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-1'
      )}
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}33` }}
    >
      {severity}
    </span>
  );
}

interface StatusDotProps {
  status: string;
  label?: string;
}

export function StatusDot({ status, label }: StatusDotProps) {
  const map: Record<string, string> = {
    online: 'var(--cyber-success)',
    offline: 'var(--muted-foreground)',
    alert: 'var(--cyber-critical)',
    blocked: '#ff6b6b',
    active: 'var(--cyber-critical)',
    warning: 'var(--cyber-warning)',
    safe: 'var(--cyber-success)',
    normal: 'var(--cyber-success)',
  };
  const c = map[status.toLowerCase()] ?? 'var(--muted-foreground)';

  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block w-2 h-2 rounded-full shrink-0"
        style={{ background: c }}
      />
      {label && <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{label}</span>}
    </span>
  );
}
