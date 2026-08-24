import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle, Clock, Activity,
  ChevronRight, Download, Crosshair, XCircle
} from 'lucide-react';
import { PageHeader, SeverityBadge, StatusDot } from '@/components/shared';
import { useAppStore } from '@/lib/store';
import { INCIDENT_EVENTS, DEVICES } from '@/lib/mockData';
import { cn } from '@/lib/utils';

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 71 ? 'var(--cyber-critical)' : score >= 31 ? 'var(--cyber-warning)' : 'var(--cyber-success)';
  const label = score >= 71 ? 'CRITICAL' : score >= 31 ? 'MEDIUM' : 'LOW';
  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg width="112" height="112" className="absolute top-0 left-0 -rotate-90">
        <circle cx="56" cy="56" r="44" fill="none" stroke="rgba(45,52,54,0.8)" strokeWidth="8" />
        <circle
          cx="56" cy="56" r="44" fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-2xl font-extrabold mono" style={{ color }}>{score}</div>
        <div className="text-[9px] font-bold tracking-widest" style={{ color }}>{label}</div>
      </div>
    </div>
  );
}

function AttackPathGraph({ path }: { path: string[] }) {
  const devices = path.map(id => DEVICES.find(d => d.id === id)).filter(Boolean);

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {devices.map((device, idx) => {
        if (!device) return null;
        const isSource = idx === 0;
        const isTarget = idx === devices.length - 1;
        const color = isTarget ? 'var(--cyber-critical)' : isSource ? 'var(--cyber-warning)' : 'var(--cyber-info)';
        const bgColor = isTarget ? 'rgba(255,71,87,0.1)' : isSource ? 'rgba(255,165,2,0.1)' : 'rgba(9,132,227,0.1)';

        return (
          <div key={device.id} className="flex flex-col items-center w-full">
            <div
              className="w-full rounded-lg p-3 border cursor-pointer transition-all hover:scale-[1.01]"
              style={{ background: bgColor, borderColor: `${color}40` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: `${color}20`, border: `1px solid ${color}60` }}
                >
                  {isTarget ? <XCircle className="w-4 h-4" style={{ color }} /> : isSource ? <Crosshair className="w-4 h-4" style={{ color }} /> : <ChevronRight className="w-4 h-4" style={{ color }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mono text-xs font-bold" style={{ color }}>{device.id}</div>
                  <div className="text-[10px]" style={{ color: 'var(--cyber-text-muted)' }}>F{device.floor} · {device.department}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] uppercase font-semibold" style={{ color: 'var(--cyber-text-muted)' }}>
                    {isSource ? 'SOURCE' : isTarget ? 'TARGET' : 'HOP'}
                  </div>
                  <StatusDot status={device.status} />
                </div>
              </div>
            </div>
            {idx < devices.length - 1 && (
              <div className="flex flex-col items-center my-1">
                <div className="w-0.5 h-4" style={{ background: 'var(--cyber-border)' }} />
                <div
                  className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,71,87,0.15)', color: 'var(--cyber-critical)', border: '1px solid rgba(255,71,87,0.3)' }}
                >
                  LATERAL MOVE
                </div>
                <div className="w-0.5 h-4" style={{ background: 'var(--cyber-border)' }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function IncidentReconstruction() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { blockIncident, addNotification } = useAppStore();
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const incidents = useAppStore(s => s.incidents);
  const incident = id
    ? incidents.find(i => i.id === id)
    : incidents.find(i => i.status === 'active') ?? incidents[0];

  const handleBlock = () => {
    if (!incident) return;
    if (!showConfirm) { setShowConfirm(true); return; }
    blockIncident(incident.id);
    addNotification(`Attack blocked: ${incident.id}`, 'success');
    setShowConfirm(false);
  };

  if (!incident) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--cyber-bg)' }}>
        <p style={{ color: 'var(--cyber-text-muted)' }}>No incident found.</p>
      </div>
    );
  }

  const evidenceItems = [
    { label: 'Unusual authentication', met: true },
    { label: 'New internal connection', met: true },
    { label: 'Multiple hops detected', met: incident.attackPath.length > 2 },
    { label: 'Privileged access attempt', met: true },
    { label: 'Sensitive destination', met: true },
    { label: 'Off-hours activity', met: Math.random() > 0.5 },
    { label: 'Lateral movement pattern', met: true },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--cyber-bg)' }}>
      <PageHeader
        title="Incident Reconstruction"
        subtitle={`Attack path analysis — C-04 Correlated Evidence`}
      >
        {/* Incident selector */}
        <div className="flex items-center gap-2">
          {incidents.map(i => (
            <button
              key={i.id}
              className="px-2.5 py-1 rounded text-[10px] font-semibold transition-colors"
              style={{
                background: i.id === incident.id ? 'rgba(0,212,255,0.15)' : 'var(--muted)',
                color: i.id === incident.id ? 'var(--cyber-accent)' : 'var(--cyber-text-muted)',
                border: `1px solid ${i.id === incident.id ? 'rgba(0,212,255,0.3)' : 'var(--cyber-border)'}`,
              }}
              onClick={() => navigate(`/incidents/${i.id}`)}
            >
              {i.id}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">

          {/* ── LEFT COLUMN: Summary ──────────────────────────────── */}
          <div className="w-72 flex-shrink-0 border-r overflow-y-auto p-4 space-y-4" style={{ borderColor: 'var(--cyber-border)' }}>

            {/* Incident ID header */}
            <div
              className="rounded-lg p-4"
              style={{
                background: incident.status === 'active' ? 'rgba(255,71,87,0.05)' : 'var(--muted)',
                border: `1px solid ${incident.status === 'active' ? 'rgba(255,71,87,0.3)' : 'var(--cyber-border)'}`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" style={{ color: 'var(--cyber-critical)' }} />
                <span className="mono text-xs font-bold" style={{ color: 'var(--cyber-text-muted)' }}>{incident.id}</span>
                <span className="ml-auto"><SeverityBadge severity={incident.status} /></span>
              </div>
              <div className="text-sm font-bold mb-1" style={{ color: 'var(--cyber-text)' }}>{incident.type}</div>
              <div className="text-xs" style={{ color: 'var(--cyber-text-muted)' }}>{incident.description}</div>
            </div>

            {/* Score gauge */}
            <div className="card-cyber p-4 flex items-center gap-4">
              <ScoreGauge score={incident.score} />
              <div className="space-y-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--cyber-text-muted)' }}>Risk Score</div>
                  <div className="text-lg font-black" style={{ color: incident.score >= 71 ? 'var(--cyber-critical)' : 'var(--cyber-warning)' }}>{incident.score}/100</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--cyber-text-muted)' }}>Duration</div>
                  <div className="mono text-xs font-semibold" style={{ color: 'var(--cyber-text)' }}>{incident.duration}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--cyber-text-muted)' }}>Detected</div>
                  <div className="mono text-xs" style={{ color: 'var(--cyber-text)' }}>{new Date(incident.detectedAt).toLocaleTimeString()}</div>
                </div>
              </div>
            </div>

            {/* Confidence & Evidence */}
            <div className="card-cyber p-4 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cyber-text-muted)' }}>Confidence & Evidence</div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold" style={{ color: 'var(--cyber-accent)' }}>
                  {incident.confidence}% Confidence
                </div>
                <div className="text-xs" style={{ color: 'var(--cyber-text-muted)' }}>
                  {incident.evidenceCount} correlated events
                </div>
              </div>
              {/* Confidence bar */}
              <div className="h-1.5 rounded-full" style={{ background: 'var(--muted)' }}>
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${incident.confidence}%`, background: 'var(--cyber-accent)', boxShadow: '0 0 8px rgba(0,212,255,0.5)' }}
                />
              </div>
              {/* Evidence items */}
              <div className="space-y-1.5 mt-2">
                {evidenceItems.map(({ label, met }) => (
                  <div key={label} className="flex items-center gap-2">
                    <CheckCircle
                      className="w-3 h-3 shrink-0"
                      style={{ color: met ? 'var(--cyber-success)' : 'var(--cyber-border)' }}
                    />
                    <span className="text-[11px]" style={{ color: met ? 'var(--cyber-text)' : 'var(--cyber-text-muted)' }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── MIDDLE COLUMN: Attack path + Timeline ──────────────── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="card-cyber p-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4" style={{ color: 'var(--cyber-accent)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--cyber-text)' }}>Attack Path Visualization</h3>
              </div>
              <AttackPathGraph path={incident.attackPath} />
            </div>

            {/* Timeline */}
            <div className="card-cyber p-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4" style={{ color: 'var(--cyber-accent)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--cyber-text)' }}>Event Timeline</h3>
              </div>

              {/* Column headers */}
              <div
                className="grid text-[10px] font-semibold uppercase tracking-wider pb-2 border-b mb-2 px-2"
                style={{ gridTemplateColumns: '80px 110px 100px 100px 80px', color: 'var(--cyber-text-muted)', borderColor: 'var(--cyber-border)' }}
              >
                <span>Time</span>
                <span>Event</span>
                <span>Source</span>
                <span>Destination</span>
                <span>Status</span>
              </div>

              <div className="space-y-1">
                {INCIDENT_EVENTS.map(evt => (
                  <div
                    key={evt.id}
                    className={cn(
                      'rounded-md transition-all cursor-pointer',
                      expandedEvent === evt.id ? 'bg-white/5' : 'hover:bg-white/5'
                    )}
                    style={{
                      borderLeft: `2px solid ${evt.status === 'alert' ? 'var(--cyber-critical)' : evt.status === 'blocked' ? 'var(--cyber-warning)' : 'var(--cyber-border)'}`,
                    }}
                    onClick={() => setExpandedEvent(expandedEvent === evt.id ? null : evt.id)}
                  >
                    <div
                      className="grid text-xs px-3 py-2.5"
                      style={{ gridTemplateColumns: '80px 110px 100px 100px 80px' }}
                    >
                      <span className="mono text-[10px]" style={{ color: 'var(--cyber-text-muted)' }}>
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                      <span style={{ color: 'var(--cyber-text)' }}>{evt.action}</span>
                      <span className="mono text-[10px]" style={{ color: 'var(--cyber-info)' }}>{evt.source}</span>
                      <span className="mono text-[10px]" style={{ color: 'var(--cyber-info)' }}>{evt.destination}</span>
                      <SeverityBadge severity={evt.status} size="sm" />
                    </div>
                    {expandedEvent === evt.id && (
                      <div className="px-3 pb-3 space-y-1 border-t mt-0" style={{ borderColor: 'var(--cyber-border)' }}>
                        <div className="text-[10px] pt-2" style={{ color: 'var(--cyber-text-muted)' }}>
                          <span className="font-semibold" style={{ color: 'var(--cyber-text)' }}>Details: </span>{evt.details}
                        </div>
                        <div className="text-[10px]" style={{ color: 'var(--cyber-text-muted)' }}>
                          <span className="font-semibold" style={{ color: 'var(--cyber-text)' }}>User: </span>
                          <span className="mono" style={{ color: 'var(--cyber-warning)' }}>{evt.user}</span>
                        </div>
                        <div className="text-[10px]" style={{ color: 'var(--cyber-text-muted)' }}>
                          <span className="font-semibold" style={{ color: 'var(--cyber-text)' }}>Department: </span>{evt.department}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Actions ──────────────────────────────── */}
          <div className="w-72 flex-shrink-0 border-l overflow-y-auto p-4 space-y-4" style={{ borderColor: 'var(--cyber-border)' }}>

            {/* Admin Actions */}
            <div className="card-cyber p-4 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cyber-text-muted)' }}>Admin Actions</div>

              {incident.status === 'blocked' ? (
                <div className="flex items-center gap-2 px-3 py-3 rounded-lg" style={{ background: 'rgba(46,213,115,0.1)', border: '1px solid rgba(46,213,115,0.3)' }}>
                  <CheckCircle className="w-4 h-4" style={{ color: 'var(--cyber-success)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--cyber-success)' }}>Attack Blocked</span>
                </div>
              ) : (
                <button
                  className={cn(
                    'w-full py-3 rounded-lg text-sm font-bold transition-all',
                    showConfirm ? 'animate-pulse' : ''
                  )}
                  style={{
                    background: showConfirm ? 'rgba(255,71,87,0.3)' : 'rgba(255,71,87,0.15)',
                    color: 'var(--cyber-critical)',
                    border: `2px solid ${showConfirm ? 'var(--cyber-critical)' : 'rgba(255,71,87,0.4)'}`,
                    boxShadow: showConfirm ? '0 0 20px rgba(255,71,87,0.4)' : 'none',
                  }}
                  onClick={handleBlock}
                >
                  {showConfirm ? '⚠ CONFIRM BLOCK' : 'BLOCK ATTACK'}
                </button>
              )}

              {showConfirm && (
                <button
                  className="w-full py-2 rounded text-xs transition-all"
                  style={{ background: 'var(--muted)', color: 'var(--cyber-text-muted)', border: '1px solid var(--cyber-border)' }}
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </button>
              )}

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Monitor', color: 'var(--cyber-warning)' },
                  { label: 'Investigate', color: 'var(--cyber-info)' },
                  { label: 'Whitelist', color: 'var(--cyber-text-muted)' },
                ].map(({ label, color }) => (
                  <button
                    key={label}
                    className="py-2 rounded text-[10px] font-semibold transition-colors"
                    style={{ background: 'var(--muted)', color, border: '1px solid var(--cyber-border)' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Affected Devices */}
            <div className="card-cyber p-4 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cyber-text-muted)' }}>Affected Devices</div>
              {incident.affectedDevices.map(devId => {
                const device = DEVICES.find(d => d.id === devId);
                return (
                  <div
                    key={devId}
                    className="flex items-center justify-between cursor-pointer hover:bg-white/5 px-2 py-1.5 rounded transition-colors"
                    onClick={() => navigate(`/device/${devId}`)}
                  >
                    <div>
                      <div className="mono text-xs" style={{ color: 'var(--cyber-accent)' }}>{devId}</div>
                      <div className="text-[10px]" style={{ color: 'var(--cyber-text-muted)' }}>
                        {device ? `F${device.floor} · ${device.department}` : 'Unknown'}
                      </div>
                    </div>
                    <SeverityBadge severity={device?.status ?? 'unknown'} size="sm" />
                  </div>
                );
              })}
            </div>

            {/* Recommendations */}
            <div className="card-cyber p-4 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cyber-text-muted)' }}>Recommendations</div>
              {[
                `Isolate ${incident.affectedDevices[0]} immediately`,
                'Review Active Directory authentication logs',
                'Check for lateral movement to Finance servers',
                'Reset credentials for compromised accounts',
                'Enable enhanced monitoring on Data Center',
              ].map((rec, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5"
                    style={{ background: 'rgba(0,212,255,0.15)', color: 'var(--cyber-accent)' }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-[11px] leading-relaxed" style={{ color: 'var(--cyber-text-muted)' }}>{rec}</span>
                </div>
              ))}
            </div>

            {/* Export */}
            <button
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: 'rgba(9,132,227,0.1)', color: 'var(--cyber-info)', border: '1px solid rgba(9,132,227,0.3)' }}
            >
              <Download className="w-3.5 h-3.5" />
              Export Full Report (PDF)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
