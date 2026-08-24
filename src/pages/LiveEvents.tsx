import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ChevronDown, ChevronRight, LogIn, Network, Cpu,
  FileText, ShieldAlert, ScanLine, Ban, Activity
} from 'lucide-react';
import { PageHeader, SeverityBadge, StatusDot } from '@/components/shared';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const EVENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  login: LogIn,
  connection: Network,
  process: Cpu,
  file_access: FileText,
  privilege_escalation: ShieldAlert,
  network_scan: ScanLine,
  alert: ShieldAlert,
  block: Ban,
};

const EVENT_COLORS: Record<string, string> = {
  login: 'var(--cyber-info)',
  connection: 'var(--cyber-accent)',
  process: 'var(--cyber-text-muted)',
  file_access: 'var(--cyber-warning)',
  privilege_escalation: 'var(--cyber-critical)',
  network_scan: 'var(--cyber-warning)',
  alert: 'var(--cyber-critical)',
  block: 'var(--cyber-critical)',
};

export function LiveEvents() {
  const navigate = useNavigate();
  const { events } = useAppStore();
  const [timeRange, setTimeRange] = useState('1h');
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      if (severityFilter !== 'all') {
        if (severityFilter === 'critical' && e.status !== 'alert' && e.status !== 'blocked') return false;
        if (severityFilter === 'warning' && e.status !== 'warning') return false;
        if (severityFilter === 'info' && e.status !== 'normal') return false;
      }
      if (search) {
        const s = search.toLowerCase();
        if (!e.source.toLowerCase().includes(s) && !e.destination.toLowerCase().includes(s) && !e.user.toLowerCase().includes(s) && !e.id.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [events, typeFilter, severityFilter, search]);

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--cyber-bg)' }}>
      <PageHeader title="Live Events Timeline" subtitle="Real-time security event stream — raw evidence feed">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs mono" style={{ background: 'rgba(46,213,115,0.08)', color: 'var(--cyber-success)', border: '1px solid rgba(46,213,115,0.2)' }}>
            <Activity className="w-3 h-3" />
            {filteredEvents.length} events
          </div>
        </div>
      </PageHeader>

      {/* Filter bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b flex-wrap" style={{ borderColor: 'var(--cyber-border)' }}>
        <div className="flex items-center gap-1">
          {['1h', '6h', '24h'].map(t => (
            <button
              key={t}
              className="px-2.5 py-1 rounded text-xs font-medium transition-colors"
              style={{
                background: timeRange === t ? 'rgba(0,212,255,0.15)' : 'var(--muted)',
                color: timeRange === t ? 'var(--cyber-accent)' : 'var(--cyber-text-muted)',
                border: `1px solid ${timeRange === t ? 'rgba(0,212,255,0.3)' : 'var(--cyber-border)'}`,
              }}
              onClick={() => setTimeRange(t)}
            >{t}</button>
          ))}
        </div>

        <select
          className="px-2.5 py-1 rounded text-xs outline-none"
          style={{ background: 'var(--muted)', color: 'var(--cyber-text)', border: '1px solid var(--cyber-border)' }}
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="login">Login</option>
          <option value="connection">Connection</option>
          <option value="process">Process</option>
          <option value="file_access">File Access</option>
          <option value="privilege_escalation">Privilege Escalation</option>
          <option value="network_scan">Network Scan</option>
          <option value="alert">Alert</option>
          <option value="block">Block</option>
        </select>

        <select
          className="px-2.5 py-1 rounded text-xs outline-none"
          style={{ background: 'var(--muted)', color: 'var(--cyber-text)', border: '1px solid var(--cyber-border)' }}
          value={severityFilter}
          onChange={e => setSeverityFilter(e.target.value)}
        >
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>

        <div className="flex items-center gap-1.5 flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--cyber-text-muted)' }} />
          <input
            type="text"
            placeholder="Search device, user, event ID..."
            className="flex-1 px-2 py-1 rounded text-xs outline-none"
            style={{ background: 'var(--muted)', color: 'var(--cyber-text)', border: '1px solid var(--cyber-border)' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-2">
          {filteredEvents.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm" style={{ color: 'var(--cyber-text-muted)' }}>No events match your filters</p>
            </div>
          ) : (
            filteredEvents.map((evt, idx) => {
              const Icon = EVENT_ICONS[evt.type] ?? Activity;
              const color = EVENT_COLORS[evt.type] ?? 'var(--cyber-text-muted)';
              const borderColor = evt.status === 'alert' ? 'var(--cyber-critical)' : evt.status === 'blocked' ? 'var(--cyber-critical)' : evt.status === 'warning' ? 'var(--cyber-warning)' : 'var(--cyber-success)';
              const isExpanded = expanded === evt.id;
              const isNew = idx === 0;

              return (
                <div
                  key={evt.id}
                  className={cn('rounded-lg border-l-2 transition-all', isNew && 'slide-in-top')}
                  style={{
                    borderLeftColor: borderColor,
                    background: 'var(--cyber-card)',
                    border: `1px solid var(--cyber-border)`,
                    borderLeft: `3px solid ${borderColor}`,
                  }}
                >
                  <div
                    className="flex items-start gap-3 p-3 cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : evt.id)}
                  >
                    {/* Icon */}
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="mono text-xs font-bold" style={{ color: 'var(--cyber-text)' }}>
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-xs font-medium" style={{ color }}>{evt.action}</span>
                        {evt.incidentId && (
                          <button
                            className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                            style={{ background: 'rgba(255,71,87,0.15)', color: 'var(--cyber-critical)', border: '1px solid rgba(255,71,87,0.3)' }}
                            onClick={(e) => { e.stopPropagation(); navigate(`/incidents/${evt.incidentId}`); }}
                          >
                            {evt.incidentId}
                          </button>
                        )}
                        <span className="ml-auto"><SeverityBadge severity={evt.status} size="sm" /></span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span style={{ color: 'var(--cyber-text-muted)' }}>Source:</span>
                        <button className="mono hover:underline" style={{ color: 'var(--cyber-info)' }} onClick={(e) => { e.stopPropagation(); navigate(`/device/${evt.source}`); }}>{evt.source}</button>
                        <ChevronRight className="w-3 h-3" style={{ color: 'var(--cyber-text-muted)' }} />
                        <span style={{ color: 'var(--cyber-text-muted)' }}>Dest:</span>
                        <button className="mono hover:underline" style={{ color: 'var(--cyber-info)' }} onClick={(e) => { e.stopPropagation(); navigate(`/device/${evt.destination}`); }}>{evt.destination}</button>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] mt-0.5" style={{ color: 'var(--cyber-text-muted)' }}>
                        <span>User: <span className="mono" style={{ color: 'var(--cyber-warning)' }}>{evt.user}</span></span>
                        <span>·</span>
                        <span>F{evt.floor} · {evt.department}</span>
                      </div>
                    </div>

                    {/* Expand indicator */}
                    {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0 mt-1" style={{ color: 'var(--cyber-text-muted)' }} /> : <ChevronRight className="w-4 h-4 shrink-0 mt-1" style={{ color: 'var(--cyber-text-muted)' }} />}
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t" style={{ borderColor: 'var(--cyber-border)' }}>
                      <div className="grid grid-cols-2 gap-2 text-[11px] mt-2">
                        <div><span style={{ color: 'var(--cyber-text-muted)' }}>Event ID: </span><span className="mono" style={{ color: 'var(--cyber-accent)' }}>{evt.id}</span></div>
                        <div><span style={{ color: 'var(--cyber-text-muted)' }}>Type: </span><span style={{ color: 'var(--cyber-text)' }}>{evt.type}</span></div>
                        <div className="col-span-2"><span style={{ color: 'var(--cyber-text-muted)' }}>Details: </span><span className="mono" style={{ color: 'var(--cyber-text)' }}>{evt.details}</span></div>
                        <div><span style={{ color: 'var(--cyber-text-muted)' }}>Timestamp: </span><span className="mono" style={{ color: 'var(--cyber-text)' }}>{new Date(evt.timestamp).toISOString()}</span></div>
                        <div><span style={{ color: 'var(--cyber-text-muted)' }}>Status: </span><StatusDot status={evt.status} label={evt.status} /></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
