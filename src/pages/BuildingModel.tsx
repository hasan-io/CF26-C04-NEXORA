import { useRef, useState, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, AlertTriangle, Eye } from 'lucide-react';
import { PageHeader, StatusDot, SeverityBadge } from '@/components/shared';
import { useAppStore } from '@/lib/store';
import { FLOORS, DEVICES, type Device } from '@/lib/mockData';

// ── Device mesh in 3D ──────────────────────────────────────────────────────────
function DeviceMesh({ device, onClick, isHighlighted, isAttackPath }: {
  device: Device;
  onClick: (d: Device) => void;
  isHighlighted: boolean;
  isAttackPath: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (!ref.current) return;
    if (isAttackPath) {
      ref.current.scale.setScalar(1 + 0.15 * Math.sin(Date.now() * 0.004));
    }
  });

  const color = useMemo(() => {
    if (device.status === 'alert') return '#ff4757';
    if (device.status === 'blocked') return '#ff6b6b';
    if (isHighlighted) return '#00d4ff';
    return FLOORS[device.floor]?.color ?? '#636e72';
  }, [device.status, device.floor, isHighlighted]);

  const size = device.type === 'server' ? 0.35 : device.type === 'router' ? 0.3 : 0.22;

  return (
    <mesh
      ref={ref}
      position={[device.x, device.y + 0.5, device.z]}
      onClick={(e) => { e.stopPropagation(); onClick(device); }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {device.type === 'server' ? (
        <boxGeometry args={[size, size * 1.4, size]} />
      ) : device.type === 'laptop' ? (
        <sphereGeometry args={[size, 8, 8]} />
      ) : (
        <boxGeometry args={[size, size, size]} />
      )}
      <meshStandardMaterial
        color={hovered ? '#ffffff' : color}
        emissive={device.status === 'alert' ? new THREE.Color('#ff4757') : isAttackPath ? new THREE.Color('#ffa502') : new THREE.Color(color)}
        emissiveIntensity={device.status === 'alert' ? 0.8 : hovered ? 0.5 : 0.3}
        transparent
        opacity={0.9}
      />
      {(hovered || isAttackPath) && (
        <Html distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: '#1a1f2e',
            border: '1px solid #2d3436',
            borderRadius: 6,
            padding: '6px 8px',
            minWidth: 140,
            fontSize: 10,
            color: '#e1e8ed',
            transform: 'translateX(-50%)',
          }}>
            <div style={{ fontFamily: 'Monaco, monospace', color: '#00d4ff', fontWeight: 'bold', marginBottom: 2 }}>{device.id}</div>
            <div style={{ color: '#a8b5c4' }}>{device.department} · F{device.floor}</div>
            <div style={{ color: '#a8b5c4' }}>{device.type} · {device.user}</div>
            <div style={{
              marginTop: 4, display: 'inline-block', padding: '1px 6px', borderRadius: 8,
              background: device.status === 'alert' ? 'rgba(255,71,87,0.2)' : 'rgba(46,213,115,0.2)',
              color: device.status === 'alert' ? '#ff4757' : '#2ed573',
              fontSize: 9, fontWeight: 'bold',
            }}>{device.status.toUpperCase()}</div>
          </div>
        </Html>
      )}
    </mesh>
  );
}

// ── Floor slab ─────────────────────────────────────────────────────────────────
function FloorSlab({ floor, data, dimmed, onClick }: {
  floor: number;
  data: typeof FLOORS[0];
  dimmed: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color = data.status === 'critical' ? '#ff4757' : data.status === 'warning' ? '#ffa502' : data.color;

  return (
    <group position={[0, floor * 3.5, 0]} onClick={() => onClick()} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
      {/* Floor plate */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[14, 0.15, 8]} />
        <meshStandardMaterial
          color={hovered ? '#2d3436' : '#1a1f2e'}
          transparent
          opacity={dimmed ? 0.2 : 0.85}
          emissive={new THREE.Color(color)}
          emissiveIntensity={data.status === 'critical' ? 0.08 : hovered ? 0.05 : 0.02}
        />
      </mesh>
      {/* Floor outline */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(14, 0.15, 8)]} />
        <lineBasicMaterial color={dimmed ? '#2d3436' : color} transparent opacity={dimmed ? 0.1 : 0.4} />
      </lineSegments>
      {/* Floor label */}
      {!dimmed && (
        <Text
          position={[-5.5, 0.5, 0]}
          rotation={[0, 0, 0]}
          fontSize={0.28}
          color={color}
          anchorX="left"
          anchorY="middle"
        >
          {`F${floor}: ${data.department}`}
        </Text>
      )}
    </group>
  );
}

// ── Attack path line ───────────────────────────────────────────────────────────
function AttackPathLines({ path }: { path: string[] }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    path.forEach(id => {
      const d = DEVICES.find(x => x.id === id);
      if (d) pts.push(new THREE.Vector3(d.x, d.y + 0.5, d.z));
    });
    return pts;
  }, [path]);

  if (points.length < 2) return null;

  return (
    <group>
      {points.slice(1).map((pt, i) => {
        const from = points[i];
        const to = pt;
        const geom = new THREE.BufferGeometry().setFromPoints([from, to]);
        return (
          <primitive key={i} object={new THREE.Line(geom, new THREE.LineBasicMaterial({ color: '#ff4757', linewidth: 2 }))} />
        );
      })}
    </group>
  );
}

// ── Building scene ─────────────────────────────────────────────────────────────
function BuildingScene({ selectedFloors, layerView, showAttackPath, onDeviceClick }: {
  selectedFloors: number[];
  layerView: string;
  showAttackPath: boolean;
  onDeviceClick: (d: Device) => void;
}) {
  const { incidents } = useAppStore();
  const activeIncident = incidents.find(i => i.status === 'active');
  const attackDevices = new Set(activeIncident?.attackPath ?? []);

  const filteredDevices = useMemo(() => {
    return DEVICES.filter(d => {
      if (!selectedFloors.includes(d.floor)) return false;
      if (layerView === 'servers') return d.type === 'server';
      if (layerView === 'critical') return d.status === 'alert' || d.status === 'blocked';
      if (layerView === 'compromised') return attackDevices.has(d.id);
      return true;
    });
  }, [selectedFloors, layerView, attackDevices]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 20, 10]} intensity={0.8} color="#00d4ff" />
      <pointLight position={[-10, 10, -10]} intensity={0.4} color="#ffffff" />
      <directionalLight position={[5, 10, 5]} intensity={0.6} />

      {FLOORS.map((floor, i) => (
        <FloorSlab
          key={i}
          floor={i}
          data={floor}
          dimmed={!selectedFloors.includes(i)}
          onClick={() => { }}
        />
      ))}

      {filteredDevices.map(d => (
        <DeviceMesh
          key={d.id}
          device={d}
          onClick={onDeviceClick}
          isHighlighted={false}
          isAttackPath={showAttackPath && attackDevices.has(d.id)}
        />
      ))}

      {showAttackPath && activeIncident && (
        <AttackPathLines path={activeIncident.attackPath} />
      )}
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function BuildingModel() {
  const navigate = useNavigate();
  const { showAttackPath, setShowAttackPath, layerView, setLayerView, incidents, setSelectedDevice } = useAppStore();
  const [selectedFloors, setSelectedFloors] = useState<number[]>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const [selectedDevice, setLocalDevice] = useState<Device | null>(null);
  const controlsRef = useRef<any>(null);

  const activeIncident = incidents.find(i => i.status === 'active');

  const handleFloorToggle = (floor: number) => {
    setSelectedFloors(prev =>
      prev.includes(floor) ? prev.filter(f => f !== floor) : [...prev, floor]
    );
  };

  const handleDeviceClick = (device: Device) => {
    setLocalDevice(device);
    setSelectedDevice(device);
  };

  const resetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--cyber-bg)' }}>
      <PageHeader title="3D Building Model" subtitle="Spatial visualization of 152 devices across 10 floors">
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{ background: 'var(--muted)', color: 'var(--cyber-text-muted)', border: '1px solid var(--cyber-border)' }}
            onClick={resetView}
          >
            <RotateCcw className="w-3 h-3" /> Reset View
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              background: showAttackPath ? 'rgba(255,71,87,0.15)' : 'var(--muted)',
              color: showAttackPath ? 'var(--cyber-critical)' : 'var(--cyber-text-muted)',
              border: `1px solid ${showAttackPath ? 'rgba(255,71,87,0.3)' : 'var(--cyber-border)'}`,
            }}
            onClick={() => setShowAttackPath(!showAttackPath)}
          >
            <AlertTriangle className="w-3 h-3" /> Attack Path
          </button>
          <select
            className="px-3 py-1.5 rounded text-xs font-medium outline-none"
            style={{ background: 'var(--muted)', color: 'var(--cyber-text)', border: '1px solid var(--cyber-border)' }}
            value={layerView}
            onChange={e => setLayerView(e.target.value)}
          >
            <option value="all">All Devices</option>
            <option value="servers">Servers Only</option>
            <option value="critical">Critical Only</option>
            <option value="compromised">Compromised</option>
          </select>
        </div>
      </PageHeader>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Floor selector */}
        <div className="w-48 flex-shrink-0 border-r overflow-y-auto p-3 space-y-1" style={{ borderColor: 'var(--cyber-border)', background: 'var(--sidebar)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider px-1 mb-2" style={{ color: 'var(--cyber-text-muted)' }}>Floors</div>
          <button
            className="w-full text-left px-2 py-1.5 rounded text-xs mb-2 transition-colors"
            style={{ background: 'rgba(0,212,255,0.1)', color: 'var(--cyber-accent)', border: '1px solid rgba(0,212,255,0.2)' }}
            onClick={() => setSelectedFloors([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])}
          >
            Select All
          </button>
          {FLOORS.map(f => (
            <button
              key={f.floor}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-xs transition-all"
              style={{
                background: selectedFloors.includes(f.floor) ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: selectedFloors.includes(f.floor) ? 'var(--cyber-text)' : 'var(--cyber-text-muted)',
                border: `1px solid ${selectedFloors.includes(f.floor) ? 'var(--cyber-border)' : 'transparent'}`,
              }}
              onClick={() => handleFloorToggle(f.floor)}
            >
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: f.color }} />
              <div className="min-w-0 text-left">
                <div className="truncate font-medium">F{f.floor}: {f.department}</div>
                <div className="text-[9px] mono" style={{ color: 'var(--cyber-text-muted)' }}>{f.devices} dev · {f.threats} threats</div>
              </div>
              {f.threats > 0 && (
                <span className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: f.status === 'critical' ? 'var(--cyber-critical)' : 'var(--cyber-warning)' }} />
              )}
            </button>
          ))}

          {/* Legend */}
          <div className="mt-4 pt-3 border-t space-y-1.5" style={{ borderColor: 'var(--cyber-border)' }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider px-1 mb-2" style={{ color: 'var(--cyber-text-muted)' }}>Legend</div>
            {[
              { color: '#2ed573', label: 'Safe' },
              { color: '#ffa502', label: 'Warning' },
              { color: '#ff4757', label: 'Critical' },
              { color: '#00d4ff', label: 'Selected' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2 px-1">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                <span className="text-[10px]" style={{ color: 'var(--cyber-text-muted)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="flex-1 relative">
          {activeIncident && showAttackPath && (
            <div
              className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.4)', color: 'var(--cyber-critical)' }}
            >
              <AlertTriangle className="w-3 h-3" />
              ACTIVE ATTACK: {activeIncident.type} — {activeIncident.id}
            </div>
          )}
          <Canvas
            camera={{ position: [20, 18, 20], fov: 45 }}
            style={{ background: '#0f1419' }}
          >
            <Suspense fallback={null}>
              <BuildingScene
                selectedFloors={selectedFloors}
                layerView={layerView}
                showAttackPath={showAttackPath}
                onDeviceClick={handleDeviceClick}
              />
              <OrbitControls
                ref={controlsRef}
                enablePan
                enableZoom
                enableRotate
                target={[0, 17, 0]}
                minDistance={5}
                maxDistance={60}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Right sidebar — Device details */}
        {selectedDevice && (
          <div className="w-64 flex-shrink-0 border-l p-4 overflow-y-auto" style={{ borderColor: 'var(--cyber-border)', background: 'var(--sidebar)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cyber-text-muted)' }}>Device Info</div>
              <button onClick={() => setLocalDevice(null)} className="text-xs" style={{ color: 'var(--cyber-text-muted)' }}>✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="mono text-sm font-bold" style={{ color: 'var(--cyber-accent)' }}>{selectedDevice.id}</div>
                <StatusDot status={selectedDevice.status} label={selectedDevice.status.toUpperCase()} />
              </div>

              {[
                { label: 'Type', value: selectedDevice.type },
                { label: 'Floor', value: `F${selectedDevice.floor}` },
                { label: 'Room', value: selectedDevice.room },
                { label: 'Department', value: selectedDevice.department },
                { label: 'IP Address', value: selectedDevice.ip },
                { label: 'MAC', value: selectedDevice.mac },
                { label: 'User', value: selectedDevice.user },
                { label: 'Last Seen', value: new Date(selectedDevice.lastSeen).toLocaleTimeString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span style={{ color: 'var(--cyber-text-muted)' }}>{label}</span>
                  <span className="mono text-right" style={{ color: 'var(--cyber-text)' }}>{value}</span>
                </div>
              ))}

              {selectedDevice.connectedTo.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--cyber-text-muted)' }}>Connected To</div>
                  {selectedDevice.connectedTo.slice(0, 3).map(cid => (
                    <div key={cid} className="mono text-[10px] py-0.5" style={{ color: 'var(--cyber-info)' }}>{cid}</div>
                  ))}
                </div>
              )}

              <div className="pt-3 flex flex-col gap-2">
                <button
                  className="w-full py-2 rounded text-xs font-semibold transition-colors"
                  style={{ background: 'rgba(0,212,255,0.15)', color: 'var(--cyber-accent)', border: '1px solid rgba(0,212,255,0.3)' }}
                  onClick={() => navigate(`/device/${selectedDevice.id}`)}
                >
                  <Eye className="w-3 h-3 inline mr-1" />
                  View Full Details
                </button>
                <button
                  className="w-full py-2 rounded text-xs font-semibold transition-colors"
                  style={{ background: 'rgba(255,71,87,0.15)', color: 'var(--cyber-critical)', border: '1px solid rgba(255,71,87,0.3)' }}
                >
                  Block Device
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
