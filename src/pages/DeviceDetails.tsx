import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Ban, Eye, Shield,
  Download, AlertTriangle, Monitor, Server, Router, Laptop
} from 'lucide-react';
import { StatusDot, SeverityBadge } from '@/components/shared';
import { useAppStore } from '@/lib/store';

const DEVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  laptop: Laptop,
  desktop: Monitor,
  server: Server,
  router: Router,
  firewall: Shield,
};

function Gauge({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  const circumference = 2 * Math.PI * 30;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg width="80" height="80" className="-rotate-90">
          <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(45,52,54,0.8)" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="30" fill="none"
            stroke={color} strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold mono" style={{ color }}>{value}{unit}</span>
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--cyber-text-muted)' }}>{label}</span>
    </div>
  );
}

export function DeviceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { devices, events, blockDevice, addNotification } = useAppStore();
  const [cpu, setCpu] = useState(45);
  const [mem, setMem] = useState(62);
  const [net, setNet] = useState(30);
  const [conn, setConn] = useState(12);

  const deviceId = id ?? devices.find(d => d.status === 'alert')?.id ?? devices[0]?.id;
  const device = devices.find(d => d.id === deviceId) ?? devices[0];

  useEffect(() => {
    const t = setInterval(() => {
      setCpu(v => Math.max(10, Math.min(95, v + Math.floor(Math.random() * 10 - 5))));
      setMem(v => Math.max(20, Math.min(90, v + Math.floor(Math.random() * 8 - 4))));
      setNet(v => Math.max(5, Math.min(80, v + Math.floor(Math.random() * 12 - 6))));
      setConn(v => Math.max(3, Math.min(25, v + Math.floor(Math.random() * 4 - 2))));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  if (!device) {
    return <div className="flex items-center justify-center h-screen" style={{ background: 'var(--cyber-bg)' }}><p style={{ color: 'var(--cyber-text-muted)' }}>No device found.</p></div>;
  }

  const Icon = DEVICE_ICONS[device.type] ?? Monitor;
  const deviceEvents = events.filter(e => e.source === device.id || e.destination === device.id).slice(0, 10);
  const connectedDevices = device.connectedTo.map(cid => devices.find(d => d.id === cid)).filter(Boolean);

  const baseline = [
    { metric: 'Connected Servers', baseline: '2', current: '5', deviation: '+150%', critical: true },
    { metric: 'Active Processes', baseline: '8', current: '12', deviation: '+50%', critical: false },
    { metric: 'Network Activity', baseline: '500MB', current: '2.5GB', deviation: '+400%', critical: true },
    { metric: 'Login User', baseline: device.user, current: 'admin', deviation: 'DIFFERENT USER', critical: true },
    { metric: 'Time of Activity', baseline: '9AM-6PM', current: '2:30 AM', deviation: 'OFF-HOURS', critical: true },
  ];

  const handleBlock = () => {
    blockDevice(device.id);
    addNotification(`Device ${device.id} blocked successfully`, 'success');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--cyber-bg)' }}>
      {/* Device Banner */}
      <div
        className="px-6 py-4 border-b flex items-center gap-4"
        style={{
          borderColor: 'var(--cyber-border)',
          background: device.status === 'alert' ? 'rgba(255,71,87,0.05)' : 'var(--cyber-card)',
        }}
      >
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)' }}
        >
          <Icon className="w-6 h-6 text-[var(--cyber-accent)]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="mono text-xl font-bold" style={{ color: 'var(--cyber-text)' }}>{device.id}</h1>
            <SeverityBadge severity={device.status} />
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--cyber-text-muted)' }}>
            {device.type.toUpperCase()} · Floor {device.floor} · {device.department} · Room {device.room}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--cyber-text-muted)' }}>Last Seen</div>
          <div className="mono text-xs" style={{ color: 'var(--cyber-text)' }}>{new Date(device.lastSeen).toLocaleTimeString()}</div>
        </div>
      </div>

      {device.status === 'alert' && (
        <div className="px-6 py-2 flex items-center gap-2 text-xs font-semibold" style={{ background: 'rgba(255,71,87,0.1)', color: 'var(--cyber-critical)' }}>
          <AlertTriangle className="w-4 h-4" />
          CRITICAL ALERT: This device is involved in an active security incident
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left column */}
        <div className="w-96 flex-shrink-0 overflow-y-auto p-4 space-y-4 border-r" style={{ borderColor: 'var(--cyber-border)' }}>
          {/* Baseline */}
          <div className="card-cyber p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--cyber-text)' }}>Device Baseline (Normal Behavior)</h3>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Normal Servers', value: 'Finance-Server-1, Finance-Server-2' },
                { label: 'Normal Processes', value: 'Word, Excel, Chrome, Outlook' },
                { label: 'Active Hours', value: '9 AM - 6 PM, Mon-Fri' },
                { label: 'Avg Data Volume', value: '500 MB/day' },
                { label: 'Assigned User', value: device.user },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--cyber-text-muted)' }}>{label}</span>
                  <span className="mono" style={{ color: 'var(--cyber-text)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Current vs Baseline */}
          <div className="card-cyber p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--cyber-text)' }}>Current vs Baseline</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-4 text-[10px] font-semibold uppercase tracking-wider pb-1 border-b" style={{ color: 'var(--cyber-text-muted)', borderColor: 'var(--cyber-border)' }}>
                <span className="col-span-2">Metric</span>
                <span>Current</span>
                <span className="text-right">Deviation</span>
              </div>
              {baseline.map(({ metric, current, deviation, critical }) => (
                <div key={metric} className="grid grid-cols-4 text-xs py-1">
                  <span className="col-span-2" style={{ color: 'var(--cyber-text)' }}>{metric}</span>
                  <span className="mono" style={{ color: 'var(--cyber-text-muted)' }}>{current}</span>
                  <span className="text-right mono text-[10px] font-bold" style={{ color: critical ? 'var(--cyber-critical)' : 'var(--cyber-warning)' }}>
                    {deviation}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Real-time metrics */}
          <div className="card-cyber p-4">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--cyber-text)' }}>Real-time Metrics</h3>
            <div className="flex items-center justify-around">
              <Gauge label="CPU" value={cpu} unit="%" color={cpu > 80 ? 'var(--cyber-critical)' : 'var(--cyber-accent)'} />
              <Gauge label="Memory" value={mem} unit="%" color={mem > 80 ? 'var(--cyber-critical)' : 'var(--cyber-info)'} />
              <Gauge label="Network" value={net} unit="%" color={net > 70 ? 'var(--cyber-warning)' : 'var(--cyber-success)'} />
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ border: '3px solid var(--cyber-accent)', background: 'rgba(0,212,255,0.05)' }}>
                  <span className="text-2xl font-bold mono" style={{ color: 'var(--cyber-accent)' }}>{conn}</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--cyber-text-muted)' }}>Connections</span>
              </div>
            </div>
          </div>

          {/* Connected Devices */}
          <div className="card-cyber p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--cyber-text)' }}>Connected Devices</h3>
            <div className="space-y-1">
              <div className="grid grid-cols-5 text-[10px] font-semibold uppercase tracking-wider pb-1 border-b" style={{ color: 'var(--cyber-text-muted)', borderColor: 'var(--cyber-border)' }}>
                <span className="col-span-2">Device</span>
                <span>Floor</span>
                <span>Dept</span>
                <span className="text-right">Status</span>
              </div>
              {connectedDevices.map(d => d && (
                <div
                  key={d.id}
                  className="grid grid-cols-5 text-xs py-2 cursor-pointer hover:bg-white/5 rounded transition-colors"
                  onClick={() => navigate(`/device/${d.id}`)}
                >
                  <span className="col-span-2 mono text-[11px]" style={{ color: 'var(--cyber-accent)' }}>{d.id}</span>
                  <span style={{ color: 'var(--cyber-text-muted)' }}>F{d.floor}</span>
                  <span className="text-[10px]" style={{ color: 'var(--cyber-text-muted)' }}>{d.department.slice(0, 8)}</span>
                  <span className="text-right"><StatusDot status={d.status} /></span>
                </div>
              ))}
              {connectedDevices.length === 0 && (
                <p className="text-xs text-center py-3" style={{ color: 'var(--cyber-text-muted)' }}>No active connections</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card-cyber p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--cyber-text)' }}>Recent Activity Timeline</h3>
            <div className="space-y-1">
              {deviceEvents.map(evt => (
                <div
                  key={evt.id}
                  className="flex items-center gap-3 text-xs py-1.5 px-2 rounded hover:bg-white/5 transition-colors"
                  style={{ borderLeft: `2px solid ${evt.status === 'alert' ? 'var(--cyber-critical)' : evt.status === 'warning' ? 'var(--cyber-warning)' : 'var(--cyber-success)'}` }}
                >
                  <span className="mono text-[10px]" style={{ color: 'var(--cyber-text-muted)' }}>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  <span style={{ color: 'var(--cyber-text)' }}>{evt.action}</span>
                  <span className="mono text-[10px]" style={{ color: 'var(--cyber-info)' }}>{evt.source === device.id ? `→ ${evt.destination}` : `← ${evt.source}`}</span>
                  <span className="ml-auto"><SeverityBadge severity={evt.status} size="sm" /></span>
                </div>
              ))}
              {deviceEvents.length === 0 && (
                <p className="text-xs text-center py-3" style={{ color: 'var(--cyber-text-muted)' }}>No recent events</p>
              )}
            </div>
          </div>
        </div>

        {/* Action panel */}
        <div className="w-52 flex-shrink-0 border-l p-4 space-y-3 overflow-y-auto" style={{ borderColor: 'var(--cyber-border)', background: 'var(--sidebar)' }}>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cyber-text-muted)' }}>Actions</div>

          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all"
            style={{ background: 'rgba(255,71,87,0.15)', color: 'var(--cyber-critical)', border: '1px solid rgba(255,71,87,0.3)' }}
            onClick={handleBlock}
          >
            <Ban className="w-3.5 h-3.5" /> Block Device
          </button>

          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'rgba(255,165,2,0.1)', color: 'var(--cyber-warning)', border: '1px solid rgba(255,165,2,0.3)' }}
          >
            <Eye className="w-3.5 h-3.5" /> Monitor
          </button>

          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'var(--muted)', color: 'var(--cyber-text-muted)', border: '1px solid var(--cyber-border)' }}
          >
            <Shield className="w-3.5 h-3.5" /> Whitelist
          </button>

          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'rgba(255,71,87,0.1)', color: 'var(--cyber-critical)', border: '1px solid rgba(255,71,87,0.2)' }}
            onClick={() => navigate('/incidents')}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> View Incident
          </button>

          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'rgba(9,132,227,0.1)', color: 'var(--cyber-info)', border: '1px solid rgba(9,132,227,0.3)' }}
          >
            <Download className="w-3.5 h-3.5" /> Export Report
          </button>

          {/* Quick info */}
          <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--cyber-border)' }}>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--cyber-text-muted)' }}>Quick Info</div>
            {[
              { label: 'IP', value: device.ip },
              { label: 'MAC', value: device.mac },
              { label: 'Type', value: device.type },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-[9px] uppercase" style={{ color: 'var(--cyber-text-muted)' }}>{label}</div>
                <div className="mono text-[10px]" style={{ color: 'var(--cyber-text)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
