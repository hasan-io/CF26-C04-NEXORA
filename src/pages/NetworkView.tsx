import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { PageHeader, SeverityBadge } from '@/components/shared';
import { useAppStore } from '@/lib/store';
import { DEVICES, NETWORK_EDGES, FLOORS } from '@/lib/mockData';

interface NodePos {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  device: typeof DEVICES[0];
}

export function NetworkView() {
  const navigate = useNavigate();
  const { incidents, showAttackPath, setShowAttackPath } = useAppStore();
  const [layout, setLayout] = useState('force');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedEdge, setSelectedEdge] = useState<typeof NETWORK_EDGES[0] | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<NodePos[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const activeIncident = incidents.find(i => i.status === 'active');
  const attackPathSet = useMemo(() => new Set(activeIncident?.attackPath ?? []), [activeIncident]);

  // Filter devices
  const filteredDevices = useMemo(() => {
    return DEVICES.filter(d => {
      if (filterDept !== 'all' && d.department !== filterDept) return false;
      if (filterStatus !== 'all' && d.status !== filterStatus) return false;
      return true;
    }).slice(0, 60); // limit for performance
  }, [filterDept, filterStatus]);

  // Initialize node positions
  useEffect(() => {
    const w = 900, h = 600;
    const newNodes: NodePos[] = filteredDevices.map((device, i) => {
      if (layout === 'circular') {
        const angle = (i / filteredDevices.length) * Math.PI * 2;
        return { id: device.id, x: w/2 + Math.cos(angle) * 220, y: h/2 + Math.sin(angle) * 220, vx: 0, vy: 0, device };
      }
      if (layout === 'hierarchical') {
        const floorGroup = Math.floor(device.floor / 3);
        const col = (i % 8) * 100 + 60;
        const row = floorGroup * 160 + 80;
        return { id: device.id, x: col, y: row, vx: 0, vy: 0, device };
      }
      // force-directed random start
      return { id: device.id, x: Math.random() * (w - 100) + 50, y: Math.random() * (h - 100) + 50, vx: 0, vy: 0, device };
    });
    setNodes(newNodes);
  }, [filteredDevices, layout]);

  // Force simulation
  useEffect(() => {
    if (layout !== 'force') return;
    let raf: number;
    const tick = () => {
      setNodes(prev => {
        const w = 900, h = 600;
        const next = prev.map(n => ({ ...n }));
        // Repulsion
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const dx = next[j].x - next[i].x;
            const dy = next[j].y - next[i].y;
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;
            const force = 2000 / (dist * dist);
            next[i].vx -= (dx / dist) * force;
            next[i].vy -= (dy / dist) * force;
            next[j].vx += (dx / dist) * force;
            next[j].vy += (dy / dist) * force;
          }
        }
        // Attraction (edges)
        NETWORK_EDGES.forEach(e => {
          const s = next.find(n => n.id === e.source);
          const t = next.find(n => n.id === e.target);
          if (!s || !t) return;
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          const force = (dist - 150) * 0.01;
          s.vx += (dx / dist) * force;
          s.vy += (dy / dist) * force;
          t.vx -= (dx / dist) * force;
          t.vy -= (dy / dist) * force;
        });
        // Apply velocity with damping
        next.forEach(n => {
          if (dragging === n.id) return;
          n.vx *= 0.85;
          n.vy *= 0.85;
          n.x += n.vx;
          n.y += n.vy;
          n.x = Math.max(30, Math.min(w - 30, n.x));
          n.y = Math.max(30, Math.min(h - 30, n.y));
        });
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [layout, dragging]);

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    const node = nodes.find(n => n.id === id);
    if (!node || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left - node.x, y: e.clientY - rect.top - node.y };
    setDragging(id);
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.current.x;
      const y = e.clientY - rect.top - dragOffset.current.y;
      setNodes(prev => prev.map(n => n.id === dragging ? { ...n, x, y, vx: 0, vy: 0 } : n));
    };
    const handleUp = () => setDragging(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [dragging]);

  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--cyber-bg)' }}>
      <PageHeader title="Network Topology View" subtitle="Device relationships and connection analysis">
        <div className="flex items-center gap-2">
          <select
            className="px-3 py-1.5 rounded text-xs font-medium outline-none"
            style={{ background: 'var(--muted)', color: 'var(--cyber-text)', border: '1px solid var(--cyber-border)' }}
            value={layout}
            onChange={e => setLayout(e.target.value)}
          >
            <option value="force">Force-Directed</option>
            <option value="hierarchical">Hierarchical</option>
            <option value="circular">Circular</option>
          </select>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              background: showAttackPath ? 'rgba(255,71,87,0.15)' : 'var(--muted)',
              color: showAttackPath ? 'var(--cyber-critical)' : 'var(--cyber-text-muted)',
              border: `1px solid ${showAttackPath ? 'rgba(255,71,87,0.3)' : 'var(--cyber-border)'}`,
            }}
            onClick={() => setShowAttackPath(!showAttackPath)}
          >
            <Eye className="w-3 h-3" /> Attack Path
          </button>
        </div>
      </PageHeader>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Filters */}
        <div className="w-52 flex-shrink-0 border-r overflow-y-auto p-3 space-y-4" style={{ borderColor: 'var(--cyber-border)', background: 'var(--sidebar)' }}>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cyber-text-muted)' }}>Department</div>
            <select
              className="w-full px-2 py-1.5 rounded text-xs outline-none"
              style={{ background: 'var(--muted)', color: 'var(--cyber-text)', border: '1px solid var(--cyber-border)' }}
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
            >
              <option value="all">All Departments</option>
              {FLOORS.map(f => <option key={f.floor} value={f.department}>{f.department}</option>)}
            </select>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cyber-text-muted)' }}>Status</div>
            <select
              className="w-full px-2 py-1.5 rounded text-xs outline-none"
              style={{ background: 'var(--muted)', color: 'var(--cyber-text)', border: '1px solid var(--cyber-border)' }}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="alert">Alert</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <div className="pt-3 border-t" style={{ borderColor: 'var(--cyber-border)' }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cyber-text-muted)' }}>Stats</div>
            <div className="space-y-1.5">
              {[
                { label: 'Total Connections', value: NETWORK_EDGES.length, color: 'var(--cyber-text)' },
                { label: 'Suspicious', value: NETWORK_EDGES.filter(e => e.suspicious).length, color: 'var(--cyber-critical)' },
                { label: 'Attack Path', value: NETWORK_EDGES.filter(e => e.attackPath).length, color: 'var(--cyber-warning)' },
                { label: 'Normal', value: NETWORK_EDGES.filter(e => !e.suspicious).length, color: 'var(--cyber-success)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span style={{ color: 'var(--cyber-text-muted)' }}>{label}</span>
                  <span className="mono font-bold" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t" style={{ borderColor: 'var(--cyber-border)' }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cyber-text-muted)' }}>Legend</div>
            <div className="space-y-1.5">
              {[
                { color: '#2ed573', label: 'Normal' },
                { color: '#ffa502', label: 'Elevated' },
                { color: '#ff4757', label: 'Compromised' },
                { color: '#0984e3', label: 'Data Center' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                  <span className="text-[10px]" style={{ color: 'var(--cyber-text-muted)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Graph */}
        <div className="flex-1 relative overflow-hidden">
          <svg ref={svgRef} width="100%" height="100%" style={{ background: 'var(--cyber-bg)' }}>
            {/* Edges */}
            {NETWORK_EDGES.map((edge, i) => {
              const s = nodeMap.get(edge.source);
              const t = nodeMap.get(edge.target);
              if (!s || !t) return null;
              const isAttack = showAttackPath && edge.attackPath;
              const color = isAttack ? '#ff4757' : edge.suspicious ? '#ffa502' : 'rgba(168,181,196,0.2)';
              const width = edge.attackPath ? 2.5 : edge.suspicious ? 2 : 1;
              return (
                <g key={i} onClick={() => setSelectedEdge(edge)} style={{ cursor: 'pointer' }}>
                  <line
                    x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                    stroke={color} strokeWidth={width}
                    strokeDasharray={edge.suspicious && !edge.attackPath ? '4 4' : undefined}
                  />
                  {isAttack && (
                    <line
                      x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                      stroke="#ff4757" strokeWidth={4} opacity={0.3}
                      style={{ animation: 'pulse-cyan 1.5s infinite' }}
                    />
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map(n => {
              const isAttack = attackPathSet.has(n.id);
              const isSelected = selectedNode === n.id;
              const color = n.device.status === 'alert' ? '#ff4757' : isAttack ? '#ff4757' : n.device.floor === 9 ? '#0984e3' : n.device.status === 'blocked' ? '#ff6b6b' : '#2ed573';
              const size = n.device.type === 'server' ? 10 : n.device.type === 'router' ? 8 : 6;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x},${n.y})`}
                  style={{ cursor: 'pointer' }}
                  onMouseDown={(e) => handleMouseDown(e, n.id)}
                  onClick={() => { setSelectedNode(n.id); }}
                  onDoubleClick={() => navigate(`/device/${n.id}`)}
                >
                  {n.device.type === 'server' ? (
                    <rect x={-size} y={-size} width={size*2} height={size*2} rx={2}
                      fill={color} fillOpacity={0.2} stroke={color} strokeWidth={isSelected ? 2.5 : 1.5}
                      style={{ filter: isAttack ? `drop-shadow(0 0 6px ${color})` : 'none' }}
                    />
                  ) : (
                    <circle r={size} fill={color} fillOpacity={0.3} stroke={color} strokeWidth={isSelected ? 2.5 : 1.5}
                      style={{ filter: isAttack ? `drop-shadow(0 0 6px ${color})` : 'none' }}
                    />
                  )}
                  {isSelected && (
                    <text y={size + 12} textAnchor="middle" fontSize={9} fill="#00d4ff" fontFamily="Monaco">
                      {n.id}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right sidebar - Connection details */}
        {selectedEdge && (
          <div className="w-64 flex-shrink-0 border-l p-4 overflow-y-auto" style={{ borderColor: 'var(--cyber-border)', background: 'var(--sidebar)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cyber-text-muted)' }}>Connection</div>
              <button onClick={() => setSelectedEdge(null)} className="text-xs" style={{ color: 'var(--cyber-text-muted)' }}>✕</button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Source', value: selectedEdge.source, color: 'var(--cyber-info)' },
                { label: 'Destination', value: selectedEdge.target, color: 'var(--cyber-info)' },
                { label: 'Protocol', value: selectedEdge.protocol },
                { label: 'Port', value: String(selectedEdge.port) },
                { label: 'Traffic Volume', value: `${selectedEdge.volume} KB/s` },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span style={{ color: 'var(--cyber-text-muted)' }}>{label}</span>
                  <span className="mono" style={{ color: color ?? 'var(--cyber-text)' }}>{value}</span>
                </div>
              ))}
              <div>
                <span style={{ color: 'var(--cyber-text-muted)' }}>Status: </span>
                {selectedEdge.attackPath ? <SeverityBadge severity="critical" size="sm" /> : selectedEdge.suspicious ? <SeverityBadge severity="warning" size="sm" /> : <SeverityBadge severity="normal" size="sm" />}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
