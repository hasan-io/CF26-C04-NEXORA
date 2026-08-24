import { useState } from 'react';
import { Settings, HelpCircle, Info, Bell, Clock, FileDown, Shield, Code2 } from 'lucide-react';
import { PageHeader } from '@/components/shared';
import { cn } from '@/lib/utils';

type Tab = 'settings' | 'help' | 'about';

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('settings');
  const [refreshRate, setRefreshRate] = useState(2);
  const [timezone, setTimezone] = useState('UTC');
  const [alertSound, setAlertSound] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--cyber-bg)' }}>
      <PageHeader title="Settings & Help" subtitle="Configure C-04 system preferences and access documentation">
        <div className="flex gap-1">
          {([
            { id: 'settings' as Tab, label: 'Settings', icon: Settings },
            { id: 'help' as Tab, label: 'Help', icon: HelpCircle },
            { id: 'about' as Tab, label: 'About', icon: Info },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors')}
              style={{
                background: tab === id ? 'rgba(0,212,255,0.15)' : 'var(--muted)',
                color: tab === id ? 'var(--cyber-accent)' : 'var(--cyber-text-muted)',
                border: `1px solid ${tab === id ? 'rgba(0,212,255,0.3)' : 'var(--cyber-border)'}`,
              }}
              onClick={() => setTab(id)}
            >
              <Icon className="w-3 h-3" /> {label}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-5">
          {tab === 'settings' && (
            <>
              {/* Theme */}
              <div className="card-cyber p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4" style={{ color: 'var(--cyber-accent)' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--cyber-text)' }}>Appearance</h3>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-xs font-medium" style={{ color: 'var(--cyber-text)' }}>Theme</div>
                    <div className="text-[10px]" style={{ color: 'var(--cyber-text-muted)' }}>Dark mode is the production standard for cybersecurity</div>
                  </div>
                  <div className="px-3 py-1.5 rounded text-xs font-semibold" style={{ background: 'rgba(15,20,25,0.8)', color: 'var(--cyber-accent)', border: '1px solid var(--cyber-border)' }}>
                    Dark (Locked)
                  </div>
                </div>
              </div>

              {/* Monitoring */}
              <div className="card-cyber p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: 'var(--cyber-accent)' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--cyber-text)' }}>Monitoring</h3>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium" style={{ color: 'var(--cyber-text)' }}>Refresh Rate</div>
                    <div className="text-[10px]" style={{ color: 'var(--cyber-text-muted)' }}>How often dashboard data updates</div>
                  </div>
                  <div className="flex gap-1">
                    {[2, 5, 10, 30].map(r => (
                      <button
                        key={r}
                        className="px-2.5 py-1 rounded text-xs font-medium transition-colors"
                        style={{
                          background: refreshRate === r ? 'rgba(0,212,255,0.15)' : 'var(--muted)',
                          color: refreshRate === r ? 'var(--cyber-accent)' : 'var(--cyber-text-muted)',
                          border: `1px solid ${refreshRate === r ? 'rgba(0,212,255,0.3)' : 'var(--cyber-border)'}`,
                        }}
                        onClick={() => setRefreshRate(r)}
                      >{r}s</button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium" style={{ color: 'var(--cyber-text)' }}>Timezone</div>
                    <div className="text-[10px]" style={{ color: 'var(--cyber-text-muted)' }}>Display timezone for timestamps</div>
                  </div>
                  <select
                    className="px-3 py-1.5 rounded text-xs outline-none"
                    style={{ background: 'var(--muted)', color: 'var(--cyber-text)', border: '1px solid var(--cyber-border)' }}
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">EST (UTC-5)</option>
                    <option value="PST">PST (UTC-8)</option>
                    <option value="GMT">GMT</option>
                    <option value="CET">CET (UTC+1)</option>
                  </select>
                </div>
              </div>

              {/* Notifications */}
              <div className="card-cyber p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" style={{ color: 'var(--cyber-accent)' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--cyber-text)' }}>Notifications</h3>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium" style={{ color: 'var(--cyber-text)' }}>Alert Sound</div>
                    <div className="text-[10px]" style={{ color: 'var(--cyber-text-muted)' }}>Play sound on critical alerts</div>
                  </div>
                  <button
                    className="relative w-10 h-5 rounded-full transition-colors"
                    style={{ background: alertSound ? 'var(--cyber-success)' : 'var(--muted)' }}
                    onClick={() => setAlertSound(!alertSound)}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                      style={{ transform: alertSound ? 'translateX(20px)' : 'translateX(2px)' }}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium" style={{ color: 'var(--cyber-text)' }}>Email Notifications</div>
                    <div className="text-[10px]" style={{ color: 'var(--cyber-text-muted)' }}>Send incident summaries to email</div>
                  </div>
                  <button
                    className="relative w-10 h-5 rounded-full transition-colors"
                    style={{ background: emailNotif ? 'var(--cyber-success)' : 'var(--muted)' }}
                    onClick={() => setEmailNotif(!emailNotif)}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                      style={{ transform: emailNotif ? 'translateX(20px)' : 'translateX(2px)' }}
                    />
                  </button>
                </div>
              </div>

              {/* Export */}
              <div className="card-cyber p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <FileDown className="w-4 h-4" style={{ color: 'var(--cyber-accent)' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--cyber-text)' }}>Export Preferences</h3>
                </div>
                <div className="space-y-2 text-xs" style={{ color: 'var(--cyber-text-muted)' }}>
                  {['PDF format reports', 'Include charts and visualizations', 'Include raw event data'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-[var(--cyber-accent)]" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'help' && (
            <>
              <div className="card-cyber p-5 space-y-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--cyber-text)' }}>Frequently Asked Questions</h3>
                {[
                  { q: 'What is C-04?', a: 'C-04 is the Spatial Cyber Threat Reconstruction Engine — a system that detects lateral movement attacks by correlating events across time, space, and network relationships.' },
                  { q: 'How does attack detection work?', a: 'C-04 uses the workflow: Observation → Correlation → Evidence → Reconstruction → Risk → Explanation. It correlates events from LabMon and HealNode to identify attack patterns.' },
                  { q: 'What is lateral movement?', a: 'Lateral movement is when an attacker, after gaining initial access, moves through the network to find sensitive targets — escalating privileges and accessing new systems.' },
                  { q: 'How do I interpret the risk score?', a: 'Scores 0-30 are low risk (green), 31-70 are medium (yellow), and 71-100 are critical (red). The score is based on the number and severity of correlated events.' },
                ].map(({ q, a }, i) => (
                  <div key={i} className="border-b pb-3 last:border-0" style={{ borderColor: 'var(--cyber-border)' }}>
                    <div className="text-xs font-semibold mb-1" style={{ color: 'var(--cyber-accent)' }}>Q: {q}</div>
                    <div className="text-xs leading-relaxed" style={{ color: 'var(--cyber-text-muted)' }}>{a}</div>
                  </div>
                ))}
              </div>

              <div className="card-cyber p-5 space-y-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--cyber-text)' }}>Keyboard Shortcuts</h3>
                <div className="space-y-2">
                  {[
                    { key: 'D', action: 'Toggle dark/light theme' },
                    { key: 'Ctrl + B', action: 'Toggle sidebar' },
                    { key: 'Esc', action: 'Close dialogs/panels' },
                  ].map(({ key, action }) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span style={{ color: 'var(--cyber-text-muted)' }}>{action}</span>
                      <kbd className="mono px-2 py-0.5 rounded text-[10px]" style={{ background: 'var(--muted)', color: 'var(--cyber-accent)', border: '1px solid var(--cyber-border)' }}>{key}</kbd>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-cyber p-5">
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--cyber-text)' }}>Contact Support</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--cyber-text-muted)' }}>
                  For technical support, contact the C-04 development team at <span style={{ color: 'var(--cyber-accent)' }}>c04-support@cybersec.lab</span>
                </p>
              </div>
            </>
          )}

          {tab === 'about' && (
            <div className="space-y-5">
              <div className="card-cyber p-6 text-center">
                <div
                  className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)' }}
                >
                  <Shield className="w-8 h-8" style={{ color: 'var(--cyber-accent)' }} />
                </div>
                <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--cyber-text)' }}>C-04 SCTRE</h2>
                <p className="text-xs mb-4" style={{ color: 'var(--cyber-text-muted)' }}>Spatial Cyber Threat Reconstruction Engine</p>
                <div className="flex items-center justify-center gap-4 text-xs">
                  <div><span style={{ color: 'var(--cyber-text-muted)' }}>Version: </span><span className="mono font-bold" style={{ color: 'var(--cyber-accent)' }}>2.4.1</span></div>
                  <div><span style={{ color: 'var(--cyber-text-muted)' }}>Build: </span><span className="mono" style={{ color: 'var(--cyber-text)' }}>20260824</span></div>
                </div>
              </div>

              <div className="card-cyber p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4" style={{ color: 'var(--cyber-accent)' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--cyber-text)' }}>Technical Information</h3>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { label: 'Data Sources', value: 'LabMon + HealNode' },
                    { label: 'Detection Engine', value: 'C-04 Correlation Core v2.4' },
                    { label: 'Building Coverage', value: '10 floors · 152 devices' },
                    { label: 'Architecture', value: 'React + TypeScript + Three.js' },
                    { label: 'Database', value: 'Supabase (PostgreSQL)' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span style={{ color: 'var(--cyber-text-muted)' }}>{label}</span>
                      <span className="mono" style={{ color: 'var(--cyber-text)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-cyber p-5">
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--cyber-text)' }}>Workflow</h3>
                <div className="flex items-center gap-1.5 text-[10px] flex-wrap">
                  {['Observation', 'Correlation', 'Evidence', 'Reconstruction', 'Risk', 'Explanation'].map((step, i, arr) => (
                    <div key={step} className="flex items-center gap-1.5">
                      <span
                        className="px-2 py-1 rounded font-semibold"
                        style={{ background: 'rgba(0,212,255,0.1)', color: 'var(--cyber-accent)', border: '1px solid rgba(0,212,255,0.2)' }}
                      >
                        {step}
                      </span>
                      {i < arr.length - 1 && <span style={{ color: 'var(--cyber-text-muted)' }}>→</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
