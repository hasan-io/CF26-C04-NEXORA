import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Pause, Square, Zap, Gauge, Activity, Terminal,
  Laptop, Server, ArrowRight, Cpu
} from 'lucide-react';
import { PageHeader, StatusDot } from '@/components/shared';
import { useAppStore } from '@/lib/store';
import { DEVICES, FLOORS, generateEvent, type EventType } from '@/lib/mockData';

const SCENARIOS = [
  { id: 's1', title: 'Employee Laptop → Finance Server', desc: 'Login anomaly → lateral movement → sensitive access', icon: Laptop, color: 'var(--cyber-warning)' },
  { id: 's2', title: 'Compromised Dev → Research Server', desc: 'Dev environment compromise → research data access', icon: Cpu, color: 'var(--cyber-info)' },
  { id: 's3', title: 'External → Executive Workstation', desc: 'VPN breach → privilege escalation → executive access', icon: Server, color: 'var(--cyber-critical)' },
  { id: 's4', title: 'Brute Force Attack', desc: 'Multiple failed logins → account lockout', icon: Activity, color: 'var(--cyber-warning)' },
  { id: 's5', title: 'Random Chaos', desc: 'Randomly triggers events across all floors', icon: Zap, color: 'var(--cyber-accent)' },
];

export function SimulationPanel() {
  const navigate = useNavigate();
  const { simulation, startSimulation, stopSimulation, generateManualEvent, events } = useAppStore();
  const [selectedScenario, setSelectedScenario] = useState('s1');
  const [speed, setSpeed] = useState(1);
  const [intensity, setIntensity] = useState(1);
  const [manualSource, setManualSource] = useState(DEVICES[0].id);
  const [manualDest, setManualDest] = useState(DEVICES[1].id);
  const [manualType, setManualType] = useState<EventType>('login');
  const [manualUser, setManualUser] = useState('admin');
  const [logLines, setLogLines] = useState<Array<{ id: string; text: string; color: string }>>([]);
  const logRef = useRef<HTMLDivElement>(null);

  // Track new events for log
  const prevEventCount = useRef(events.length);
  useEffect(() => {
    if (events.length > prevEventCount.current) {
      const newEvents = events.slice(0, events.length - prevEventCount.current);
      newEvents.forEach(evt => {
        const isAlert = evt.status === 'alert' || evt.status === 'blocked';
        const color = isAlert ? 'var(--cyber-critical)' : evt.status === 'warning' ? 'var(--cyber-warning)' : 'var(--cyber-success)';
        setLogLines(prev => [{
          id: evt.id,
          text: `[${new Date(evt.timestamp).toLocaleTimeString()}] ${evt.type.toUpperCase()} ${evt.source} → ${evt.destination} | ${evt.action} | ${evt.status.toUpperCase()}`,
          color,
        }, ...prev].slice(0, 100));
      });
    }
    prevEventCount.current = events.length;
  }, [events]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0;
  }, [logLines]);

  const handleStart = () => {
    const scenario = SCENARIOS.find(s => s.id === selectedScenario);
    if (scenario) startSimulation(scenario.title, speed, intensity);
  };

  const handleManual = () => {
    generateManualEvent({
      source: manualSource,
      destination: manualDest,
      type: manualType,
      user: manualUser,
    });
  };

  const accuracy = simulation.eventsGenerated > 0
    ? Math.round((simulation.eventsDetected / simulation.eventsGenerated) * 100)
    : 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--cyber-bg)' }}>
      <PageHeader title="Simulation Control Panel" subtitle="Generate demo events and test C-04 detection capabilities">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs mono" style={{
            background: simulation.running ? 'rgba(46,213,115,0.1)' : 'var(--muted)',
            color: simulation.running ? 'var(--cyber-success)' : 'var(--cyber-text-muted)',
            border: `1px solid ${simulation.running ? 'rgba(46,213,115,0.3)' : 'var(--cyber-border)'}`,
          }}>
            {simulation.running ? <><Activity className="w-3 h-3 animate-pulse" /> RUNNING</> : 'IDLE'}
          </div>
        </div>
      </PageHeader>

      <div className="flex flex-1 overflow-hidden">
        {/* Left column - Preset Scenarios */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--cyber-text)' }}>Preset Attack Scenarios</h3>
            <div className="space-y-2">
              {SCENARIOS.map(s => {
                const Icon = s.icon;
                const isSelected = selectedScenario === s.id;
                return (
                  <button
                    key={s.id}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all"
                    style={{
                      background: isSelected ? 'rgba(0,212,255,0.08)' : 'var(--cyber-card)',
                      border: `1px solid ${isSelected ? 'rgba(0,212,255,0.4)' : 'var(--cyber-border)'}`,
                    }}
                    onClick={() => setSelectedScenario(s.id)}
                  >
                    <div
                      className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: s.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold" style={{ color: 'var(--cyber-text)' }}>{s.title}</div>
                      <div className="text-[10px]" style={{ color: 'var(--cyber-text-muted)' }}>{s.desc}</div>
                    </div>
                    {isSelected && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--cyber-accent)' }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Speed & Intensity */}
          <div className="card-cyber p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--cyber-text)' }}>Speed</span>
                <span className="mono text-xs" style={{ color: 'var(--cyber-accent)' }}>{speed}x</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 5, 10].map(s => (
                  <button
                    key={s}
                    className="flex-1 py-1.5 rounded text-xs font-medium transition-colors"
                    style={{
                      background: speed === s ? 'rgba(0,212,255,0.15)' : 'var(--muted)',
                      color: speed === s ? 'var(--cyber-accent)' : 'var(--cyber-text-muted)',
                      border: `1px solid ${speed === s ? 'rgba(0,212,255,0.3)' : 'var(--cyber-border)'}`,
                    }}
                    onClick={() => setSpeed(s)}
                  >{s}x</button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--cyber-text)' }}>Intensity</span>
                <span className="mono text-xs" style={{ color: 'var(--cyber-accent)' }}>{['Light', 'Medium', 'Heavy'][intensity - 1]}</span>
              </div>
              <div className="flex gap-1">
                {['Light', 'Medium', 'Heavy'].map((label, i) => (
                  <button
                    key={label}
                    className="flex-1 py-1.5 rounded text-xs font-medium transition-colors"
                    style={{
                      background: intensity === i + 1 ? 'rgba(0,212,255,0.15)' : 'var(--muted)',
                      color: intensity === i + 1 ? 'var(--cyber-accent)' : 'var(--cyber-text-muted)',
                      border: `1px solid ${intensity === i + 1 ? 'rgba(0,212,255,0.3)' : 'var(--cyber-border)'}`,
                    }}
                    onClick={() => setIntensity(i + 1)}
                  >{label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Start/Stop buttons */}
          <div className="flex gap-3">
            {!simulation.running ? (
              <button
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all"
                style={{ background: 'rgba(46,213,115,0.15)', color: 'var(--cyber-success)', border: '1px solid rgba(46,213,115,0.4)' }}
                onClick={handleStart}
              >
                <Play className="w-4 h-4" /> START SIMULATION
              </button>
            ) : (
              <>
                <button
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all"
                  style={{ background: 'rgba(255,165,2,0.15)', color: 'var(--cyber-warning)', border: '1px solid rgba(255,165,2,0.4)' }}
                  onClick={() => { if (simulation.running) stopSimulation(); else handleStart(); }}
                >
                  <Pause className="w-4 h-4" /> PAUSE
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all"
                  style={{ background: 'rgba(255,71,87,0.15)', color: 'var(--cyber-critical)', border: '1px solid rgba(255,71,87,0.4)' }}
                  onClick={stopSimulation}
                >
                  <Square className="w-4 h-4" /> STOP
                </button>
              </>
            )}
          </div>

          {/* Manual Event Generator */}
          <div className="card-cyber p-4 space-y-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--cyber-text)' }}>Manual Event Generator</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--cyber-text-muted)' }}>Source Device</label>
                <select
                  className="w-full px-2 py-1.5 rounded text-xs outline-none mono"
                  style={{ background: 'var(--muted)', color: 'var(--cyber-text)', border: '1px solid var(--cyber-border)' }}
                  value={manualSource}
                  onChange={e => setManualSource(e.target.value)}
                >
                  {DEVICES.slice(0, 40).map(d => <option key={d.id} value={d.id}>{d.id}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--cyber-text-muted)' }}>Destination</label>
                <select
                  className="w-full px-2 py-1.5 rounded text-xs outline-none mono"
                  style={{ background: 'var(--muted)', color: 'var(--cyber-text)', border: '1px solid var(--cyber-border)' }}
                  value={manualDest}
                  onChange={e => setManualDest(e.target.value)}
                >
                  {DEVICES.slice(0, 40).map(d => <option key={d.id} value={d.id}>{d.id}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--cyber-text-muted)' }}>Event Type</label>
                <select
                  className="w-full px-2 py-1.5 rounded text-xs outline-none"
                  style={{ background: 'var(--muted)', color: 'var(--cyber-text)', border: '1px solid var(--cyber-border)' }}
                  value={manualType}
                  onChange={e => setManualType(e.target.value as EventType)}
                >
                  <option value="login">Login</option>
                  <option value="connection">Connection</option>
                  <option value="process">Process Spawn</option>
                  <option value="file_access">File Access</option>
                  <option value="privilege_escalation">Privilege Escalation</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--cyber-text-muted)' }}>User</label>
                <select
                  className="w-full px-2 py-1.5 rounded text-xs outline-none"
                  style={{ background: 'var(--muted)', color: 'var(--cyber-text)', border: '1px solid var(--cyber-border)' }}
                  value={manualUser}
                  onChange={e => setManualUser(e.target.value)}
                >
                  {['admin', 'system', 'root', 'alice.wang', 'bob.smith', 'carol.jones'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <button
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: 'rgba(0,212,255,0.15)', color: 'var(--cyber-accent)', border: '1px solid rgba(0,212,255,0.3)' }}
              onClick={handleManual}
            >
              <ArrowRight className="w-3.5 h-3.5" /> Generate Event
            </button>
          </div>
        </div>

        {/* Right column - Status & Log */}
        <div className="w-96 flex-shrink-0 border-l overflow-y-auto p-5 space-y-4" style={{ borderColor: 'var(--cyber-border)' }}>
          {/* Simulation Status */}
          <div className="card-cyber p-4 space-y-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--cyber-text)' }}>Simulation Status</h3>
            {simulation.scenario && (
              <div className="text-xs" style={{ color: 'var(--cyber-accent)' }}>
                Scenario: <span className="font-semibold">{simulation.scenario}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Events Generated', value: simulation.eventsGenerated, color: 'var(--cyber-accent)' },
                { label: 'Events Detected', value: simulation.eventsDetected, color: 'var(--cyber-info)' },
                { label: 'Detection Accuracy', value: `${accuracy}%`, color: accuracy > 90 ? 'var(--cyber-success)' : 'var(--cyber-warning)' },
                { label: 'Status', value: simulation.running ? 'ACTIVE' : 'IDLE', color: simulation.running ? 'var(--cyber-success)' : 'var(--cyber-text-muted)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-2.5 rounded-md" style={{ background: 'var(--muted)', border: '1px solid var(--cyber-border)' }}>
                  <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--cyber-text-muted)' }}>{label}</div>
                  <div className="text-lg font-bold mono" style={{ color }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Log Display */}
          <div className="card-cyber p-0 overflow-hidden flex flex-col" style={{ maxHeight: '400px' }}>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: 'var(--cyber-border)' }}>
              <Terminal className="w-3.5 h-3.5" style={{ color: 'var(--cyber-accent)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--cyber-text)' }}>Event Log</span>
              <span className="ml-auto text-[10px] mono" style={{ color: 'var(--cyber-text-muted)' }}>{logLines.length} lines</span>
            </div>
            <div ref={logRef} className="flex-1 overflow-y-auto p-3 space-y-0.5 mono text-[10px]" style={{ background: '#0a0d12' }}>
              {logLines.length === 0 ? (
                <div style={{ color: 'var(--cyber-text-muted)' }}>No events generated yet. Start a simulation or generate a manual event.</div>
              ) : (
                logLines.map(line => (
                  <div key={line.id} className="slide-in-top" style={{ color: line.color }}>
                    {line.text}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick navigation */}
          <div className="flex gap-2">
            <button
              className="flex-1 py-2 rounded text-xs font-semibold transition-colors"
              style={{ background: 'var(--muted)', color: 'var(--cyber-accent)', border: '1px solid var(--cyber-border)' }}
              onClick={() => navigate('/events')}
            >
              View Live Events
            </button>
            <button
              className="flex-1 py-2 rounded text-xs font-semibold transition-colors"
              style={{ background: 'var(--muted)', color: 'var(--cyber-critical)', border: '1px solid var(--cyber-border)' }}
              onClick={() => navigate('/incidents')}
            >
              View Incidents
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
