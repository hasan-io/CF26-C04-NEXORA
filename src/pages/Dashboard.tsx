import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { Shield, AlertTriangle, CheckCircle, Activity, Eye, Network as NetworkIcon, RefreshCw } from 'lucide-react';
import { PageHeader, StatCard, SeverityBadge, StatusDot } from '@/components/shared';
import { useAppStore } from '@/lib/store';
import { FLOORS } from '@/lib/mockData';
import { cn } from '@/lib/utils';

function generateTimelineData() {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    normal: Math.floor(Math.random() * 80 + 20),
    threats: Math.floor(Math.random() * 15),
  }));
}

export function Dashboard() {
  const navigate = useNavigate();
  const { incidents, events, devices, setSelectedIncident } = useAppStore();
  const [timelineData] = useState(generateTimelineData);
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 2000);
    return () => clearInterval(t);
  }, []);

  const activeThreats = incidents.filter(i => i.status === 'active').length;
  const blockedCount = incidents.filter(i => i.status === 'blocked').length;
  const onlineDevices = devices.filter(d => d.status === 'online' || d.status === 'alert').length;

  const floorThreats = FLOORS.map(f => ({
    name: f.department.replace(' ', '\n'),
    shortName: `F${f.floor}`,
    value: f.threats,
    fill: f.threats > 1 ? '#ff4757' : f.threats === 1 ? '#ffa502' : '#2ed573',
  })).filter(f => f.value > 0);

  const segmentData = FLOORS.map(f => ({
    name: `F${f.floor}: ${f.department}`,
    status: f.status,
    devices: f.devices,
    threats: f.threats,
  }));

  const topAffected = devices
    .filter(d => d.status === 'alert')
    .slice(0, 6)
    .map(d => ({ ...d, threatCount: Math.floor(Math.random() * 5 + 1) }));

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      <PageHeader
        title="Security Operations Dashboard"
        subtitle="C-04 Spatial Cyber Threat Reconstruction Engine — Real-time Overview"
      >
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs mono" style={{ background: 'rgba(0,212,255,0.06)', color: 'var(--cyber-accent)', border: '1px solid rgba(0,212,255,0.15)' }}>
          <RefreshCw className="w-3 h-3 animate-spin" />
          Live — {new Date().toLocaleTimeString()}
        </div>
      </PageHeader>

      <div className="flex-1 p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Devices Online"
            value={onlineDevices}
            sub={`${devices.length} total registered`}
            color="cyan"
            icon={<Shield className="w-4 h-4" />}
          />
          <StatCard
            label="Active Threats"
            value={activeThreats}
            sub={activeThreats > 0 ? 'Immediate attention required' : 'No active threats'}
            color={activeThreats > 0 ? 'red' : 'green'}
            pulse={activeThreats > 0}
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <StatCard
            label="Blocked Incidents"
            value={blockedCount}
            sub="Successfully neutralized"
            color="green"
            icon={<CheckCircle className="w-4 h-4" />}
          />
          <StatCard
            label="Events (24h)"
            value={events.length}
            sub="Correlated & analyzed"
            color="blue"
            icon={<Activity className="w-4 h-4" />}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-2 gap-4">
          {/* Alert Timeline */}
          <div className="card-cyber p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Real-time Alert Timeline</h3>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Last 24 hours — 2s refresh</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}><span className="w-2 h-2 rounded-full bg-[#2ed573]" />Normal</span>
                <span className="flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}><span className="w-2 h-2 rounded-full bg-[#ff4757]" />Threats</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={timelineData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2ed573" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2ed573" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="threatGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4757" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ff4757" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#a1a1aa' }} interval={3} />
                <YAxis tick={{ fontSize: 9, fill: '#a1a1aa' }} />
                <Tooltip
                  contentStyle={{ background: '#151517', border: '1px solid #2a2a2d', borderRadius: 6, fontSize: 11 }}
                  labelStyle={{ color: '#f4f4f5' }}
                />
                <Area type="monotone" dataKey="normal" stroke="#2ed573" fill="url(#normalGrad)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="threats" stroke="#ff4757" fill="url(#threatGrad)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Threat Distribution */}
          <div className="card-cyber p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Threat Distribution by Floor</h3>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Active incidents per department</p>
              </div>
            </div>
            {floorThreats.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={floorThreats} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                      {floorThreats.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#151517', border: '1px solid #2a2a2d', borderRadius: 6, fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {floorThreats.map((f, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: f.fill }} />
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{f.shortName}</span>
                      </div>
                      <span className="text-xs font-bold mono" style={{ color: f.fill }}>{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40">
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No active threats detected</p>
              </div>
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-2 gap-4">
          {/* Top Affected Devices */}
          <div className="card-cyber p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Top Affected Devices</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-4 text-[10px] font-medium uppercase tracking-wider pb-2 border-b" style={{ color: 'var(--muted-foreground)', borderColor: 'var(--cyber-border)' }}>
                <span>Device ID</span>
                <span>Floor</span>
                <span className="text-center">Threats</span>
                <span className="text-right">Status</span>
              </div>
              {topAffected.length > 0 ? topAffected.map(d => (
                <div
                  key={d.id}
                  className="grid grid-cols-4 py-2 text-xs cursor-pointer hover:bg-white/5 rounded transition-colors"
                  onClick={() => navigate(`/device/${d.id}`)}
                >
                  <span className="mono text-[11px]" style={{ color: 'var(--cyber-accent)' }}>{d.id}</span>
                  <span style={{ color: 'var(--muted-foreground)' }}>F{d.floor}</span>
                  <span className="text-center font-bold" style={{ color: 'var(--cyber-critical)' }}>{d.threatCount}</span>
                  <span className="text-right"><SeverityBadge severity={d.status} size="sm" /></span>
                </div>
              )) : (
                <p className="text-xs text-center py-4" style={{ color: 'var(--muted-foreground)' }}>No affected devices</p>
              )}
            </div>
          </div>

          {/* Network Segment Health */}
          <div className="card-cyber p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Network Segment Health</h3>
            <div className="grid grid-cols-2 gap-2">
              {segmentData.slice(0, 6).map(seg => (
                <div
                  key={seg.name}
                  className="flex items-center gap-2 p-2.5 rounded-md border transition-colors"
                  style={{
                    borderColor: seg.status === 'critical' ? 'rgba(255,71,87,0.25)' : seg.status === 'warning' ? 'rgba(255,165,2,0.25)' : 'var(--cyber-border)',
                    background: seg.status === 'critical' ? 'rgba(255,71,87,0.04)' : seg.status === 'warning' ? 'rgba(255,165,2,0.04)' : 'var(--muted)',
                  }}
                >
                  <StatusDot status={seg.status} />
                  <div className="min-w-0">
                    <div className="text-[10px] font-medium truncate" style={{ color: 'var(--foreground)' }}>{seg.name}</div>
                    <div className="text-[9px] mono" style={{ color: 'var(--muted-foreground)' }}>{seg.devices} dev · {seg.threats} threats</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Incidents Feed */}
        <div className="card-cyber p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Active Incidents Feed</h3>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{incidents.length} total incidents</span>
          </div>

          {/* Table header */}
          <div className="grid text-[10px] font-medium uppercase tracking-wider pb-2 border-b px-3" style={{ color: 'var(--muted-foreground)', borderColor: 'var(--cyber-border)', gridTemplateColumns: '1.2fr 1.8fr 0.8fr 1.5fr 0.8fr 2fr' }}>
            <span>Incident ID</span>
            <span>Threat Type</span>
            <span>Severity</span>
            <span>Affected Devices</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="space-y-1 mt-1">
            {incidents.map(inc => (
              <div
                key={inc.id}
                className={cn(
                  'grid px-3 py-3 rounded-md text-xs transition-colors cursor-pointer hover:bg-white/5',
                  inc.status === 'active' ? 'border-l-2 border-[var(--cyber-critical)]' : 'border-l-2 border-transparent'
                )}
                style={{ gridTemplateColumns: '1.2fr 1.8fr 0.8fr 1.5fr 0.8fr 2fr', background: inc.status === 'active' ? 'rgba(255,71,87,0.03)' : 'transparent' }}
                onClick={() => { setSelectedIncident(inc); navigate(`/incidents/${inc.id}`); }}
              >
                <span className="mono font-bold" style={{ color: 'var(--cyber-accent)' }}>{inc.id}</span>
                <span style={{ color: 'var(--foreground)' }}>{inc.type}</span>
                <span><SeverityBadge severity={inc.severity} size="sm" /></span>
                <span className="mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{inc.affectedDevices.length} device(s)</span>
                <span><SeverityBadge severity={inc.status} size="sm" /></span>
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors"
                    style={{ background: 'rgba(0,212,255,0.08)', color: 'var(--cyber-accent)', border: '1px solid rgba(0,212,255,0.15)' }}
                    onClick={(e) => { e.stopPropagation(); navigate(`/incidents/${inc.id}`); }}
                  >
                    <Eye className="w-2.5 h-2.5" /> View
                  </button>
                  <button
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors"
                    style={{ background: 'rgba(9,132,227,0.08)', color: 'var(--cyber-info)', border: '1px solid rgba(9,132,227,0.15)' }}
                    onClick={(e) => { e.stopPropagation(); navigate('/network'); }}
                  >
                    <NetworkIcon className="w-2.5 h-2.5" /> Network
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
