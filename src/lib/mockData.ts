// Mock data and types for C-04 Cyber Dashboard

export type DeviceStatus = 'online' | 'offline' | 'alert' | 'blocked';
export type ThreatSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'active' | 'blocked' | 'investigating' | 'resolved';
export type EventType = 'login' | 'connection' | 'process' | 'file_access' | 'privilege_escalation' | 'network_scan' | 'alert' | 'block';

export interface Device {
  id: string;
  name: string;
  type: 'laptop' | 'desktop' | 'server' | 'router' | 'firewall';
  floor: number;
  room: string;
  department: string;
  status: DeviceStatus;
  ip: string;
  mac: string;
  user: string;
  lastSeen: string;
  connectedTo: string[];
  x: number;
  y: number;
  z: number;
}

export interface Incident {
  id: string;
  type: string;
  severity: ThreatSeverity;
  score: number;
  status: IncidentStatus;
  detectedAt: string;
  duration: string;
  affectedDevices: string[];
  attackPath: string[];
  confidence: number;
  evidenceCount: number;
  description: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: EventType;
  source: string;
  destination: string;
  user: string;
  action: string;
  status: 'normal' | 'warning' | 'alert' | 'blocked';
  details: string;
  incidentId?: string;
  floor: number;
  department: string;
}

export interface FloorData {
  floor: number;
  name: string;
  department: string;
  devices: number;
  threats: number;
  color: string;
  status: 'safe' | 'warning' | 'critical';
}

// --- FLOORS ---
export const FLOORS: FloorData[] = [
  { floor: 0, name: 'Ground Floor', department: 'Reception', devices: 8, threats: 0, color: '#636e72', status: 'safe' },
  { floor: 1, name: 'Floor 1', department: 'IT Operations', devices: 15, threats: 1, color: '#0984e3', status: 'warning' },
  { floor: 2, name: 'Floor 2', department: 'Finance', devices: 18, threats: 2, color: '#6c5ce7', status: 'critical' },
  { floor: 3, name: 'Floor 3', department: 'HR/Admin', devices: 14, threats: 0, color: '#e17055', status: 'safe' },
  { floor: 4, name: 'Floor 4', department: 'Sales', devices: 20, threats: 0, color: '#00b894', status: 'safe' },
  { floor: 5, name: 'Floor 5', department: 'R&D Software', devices: 16, threats: 1, color: '#00cec9', status: 'warning' },
  { floor: 6, name: 'Floor 6', department: 'R&D Research', devices: 16, threats: 0, color: '#00cec9', status: 'safe' },
  { floor: 7, name: 'Floor 7', department: 'QA/Testing', devices: 18, threats: 0, color: '#fdcb6e', status: 'safe' },
  { floor: 8, name: 'Floor 8', department: 'Management', devices: 12, threats: 1, color: '#d63031', status: 'warning' },
  { floor: 9, name: 'Floor 9', department: 'Data Center', devices: 25, threats: 3, color: '#c0392b', status: 'critical' },
];

// --- DEVICES ---
const makeDevices = (): Device[] => {
  const departments = [
    { floor: 0, dept: 'Reception', count: 8 },
    { floor: 1, dept: 'IT Operations', count: 15 },
    { floor: 2, dept: 'Finance', count: 18 },
    { floor: 3, dept: 'HR/Admin', count: 14 },
    { floor: 4, dept: 'Sales', count: 20 },
    { floor: 5, dept: 'R&D Software', count: 16 },
    { floor: 6, dept: 'R&D Research', count: 16 },
    { floor: 7, dept: 'QA/Testing', count: 18 },
    { floor: 8, dept: 'Management', count: 12 },
    { floor: 9, dept: 'Data Center', count: 25 },
  ];
  const types: Device['type'][] = ['laptop', 'desktop', 'server', 'router'];
  const users = ['alice.wang', 'bob.smith', 'carol.jones', 'dave.lee', 'eve.chen', 'frank.miller', 'grace.kim', 'henry.park', 'iris.tan', 'jack.wu'];
  const devices: Device[] = [];

  departments.forEach(({ floor, dept, count }) => {
    for (let i = 0; i < count; i++) {
      const type = floor === 9 ? 'server' : types[i % types.length];
      const id = `${dept.slice(0, 3).toUpperCase().replace('/', '')}-F${floor}-${String(i + 1).padStart(3, '0')}`;
      devices.push({
        id,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)}-${id}`,
        type,
        floor,
        room: `${floor}${String(Math.floor(i / 4) + 1).padStart(2, '0')}`,
        department: dept,
        status: (floor === 2 && i < 3) ? 'alert' : (floor === 9 && i < 4) ? 'alert' : 'online',
        ip: `192.168.${floor}.${100 + i}`,
        mac: `00:1A:2B:${floor.toString(16).padStart(2, '0').toUpperCase()}:${i.toString(16).padStart(2, '0').toUpperCase()}:FF`,
        user: users[i % users.length],
        lastSeen: new Date(Date.now() - Math.random() * 60000).toISOString(),
        connectedTo: [],
        x: (i % 5) * 2.5 - 5,
        y: floor * 3.5,
        z: Math.floor(i / 5) * 2.5 - 2.5,
      });
    }
  });
  return devices;
};

export const DEVICES: Device[] = makeDevices();

// Set up connections
DEVICES.forEach((d, idx) => {
  if (d.floor === 9) {
    d.connectedTo = DEVICES.filter(x => x.floor !== 9 && Math.random() > 0.7).slice(0, 3).map(x => x.id);
  } else {
    const serverOnFloor = DEVICES.find(x => x.floor === 9 && x.type === 'server');
    if (serverOnFloor) d.connectedTo = [serverOnFloor.id];
  }
});

// --- INCIDENTS ---
export const INCIDENTS: Incident[] = [
  {
    id: 'INC-2024-001',
    type: 'Lateral Movement',
    severity: 'critical',
    score: 87,
    status: 'active',
    detectedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    duration: '8m 23s',
    affectedDevices: ['FIN-F2-003', 'FIN-F2-007', 'DAT-F9-001'],
    attackPath: ['FIN-F2-003', 'ITO-F1-005', 'DAT-F9-001', 'DAT-F9-004'],
    confidence: 91,
    evidenceCount: 9,
    description: 'Suspicious lateral movement detected from Finance floor to Data Center. Multiple authentication anomalies and unauthorized privilege escalation attempts observed.',
  },
  {
    id: 'INC-2024-002',
    type: 'Privilege Escalation',
    severity: 'high',
    score: 72,
    status: 'investigating',
    detectedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    duration: '25m 10s',
    affectedDevices: ['RDS-F5-002', 'RDS-F5-008'],
    attackPath: ['RDS-F5-002', 'RDS-F5-008'],
    confidence: 78,
    evidenceCount: 6,
    description: 'Privilege escalation detected on R&D Software floor. Admin credentials accessed from developer workstation during off-hours.',
  },
  {
    id: 'INC-2024-003',
    type: 'Data Exfiltration Attempt',
    severity: 'critical',
    score: 94,
    status: 'blocked',
    detectedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    duration: '2m 48s',
    affectedDevices: ['MAN-F8-003', 'DAT-F9-012'],
    attackPath: ['MAN-F8-003', 'DAT-F9-012'],
    confidence: 95,
    evidenceCount: 12,
    description: 'Attempted data exfiltration from Management workstation targeting Data Center. Large file transfer blocked.',
  },
  {
    id: 'INC-2024-004',
    type: 'Brute Force Login',
    severity: 'medium',
    score: 45,
    status: 'resolved',
    detectedAt: new Date(Date.now() - 120 * 60000).toISOString(),
    duration: '4m 15s',
    affectedDevices: ['ITO-F1-009'],
    attackPath: ['ITO-F1-009'],
    confidence: 85,
    evidenceCount: 23,
    description: 'Brute force attack on IT Operations workstation. 47 failed login attempts detected before lockout.',
  },
];

// --- EVENTS ---
const eventTypes: EventType[] = ['login', 'connection', 'process', 'file_access', 'privilege_escalation', 'network_scan', 'alert', 'block'];

export const generateEvent = (overrides?: Partial<SecurityEvent>): SecurityEvent => {
  const sources = ['FIN-F2-003', 'ITO-F1-005', 'DAT-F9-001', 'RDS-F5-002', 'SAL-F4-008', 'MAN-F8-003'];
  const destinations = ['DAT-F9-001', 'DAT-F9-004', 'ITO-F1-001', 'FIN-F2-001', 'RDS-F6-001'];
  const users = ['alice.wang', 'bob.smith', 'carol.jones', 'admin', 'system', 'root'];
  const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const isAlert = Math.random() < 0.15;

  return {
    id: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    type,
    source: sources[Math.floor(Math.random() * sources.length)],
    destination: destinations[Math.floor(Math.random() * destinations.length)],
    user: users[Math.floor(Math.random() * users.length)],
    action: type === 'login' ? 'Authentication attempt' : type === 'connection' ? 'TCP connection established' : 'Event recorded',
    status: isAlert ? 'alert' : Math.random() < 0.05 ? 'warning' : 'normal',
    details: `Port 443, encrypted, ${Math.floor(Math.random() * 1024)}KB transferred`,
    floor: Math.floor(Math.random() * 10),
    department: FLOORS[Math.floor(Math.random() * 10)].department,
    ...overrides,
  };
};

export const INITIAL_EVENTS: SecurityEvent[] = Array.from({ length: 50 }, (_, i) => ({
  ...generateEvent(),
  timestamp: new Date(Date.now() - i * 45000).toISOString(),
}));

// Attack path events for INC-2024-001
export const INCIDENT_EVENTS: SecurityEvent[] = [
  {
    id: 'IEVT-001',
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    type: 'login',
    source: 'FIN-F2-003',
    destination: 'Active Directory',
    user: 'admin',
    action: 'Authentication',
    status: 'warning',
    details: 'Login from unusual IP, outside business hours',
    incidentId: 'INC-2024-001',
    floor: 2,
    department: 'Finance',
  },
  {
    id: 'IEVT-002',
    timestamp: new Date(Date.now() - 7.5 * 60000).toISOString(),
    type: 'network_scan',
    source: 'FIN-F2-003',
    destination: '192.168.1.0/24',
    user: 'admin',
    action: 'Internal Network Scan',
    status: 'alert',
    details: 'Rapid port scanning detected — 200+ ports/sec',
    incidentId: 'INC-2024-001',
    floor: 2,
    department: 'Finance',
  },
  {
    id: 'IEVT-003',
    timestamp: new Date(Date.now() - 7 * 60000).toISOString(),
    type: 'connection',
    source: 'FIN-F2-003',
    destination: 'ITO-F1-005',
    user: 'admin',
    action: 'Lateral Connection',
    status: 'alert',
    details: 'New connection to IT Operations — TCP/445 (SMB)',
    incidentId: 'INC-2024-001',
    floor: 1,
    department: 'IT Operations',
  },
  {
    id: 'IEVT-004',
    timestamp: new Date(Date.now() - 6.5 * 60000).toISOString(),
    type: 'privilege_escalation',
    source: 'ITO-F1-005',
    destination: 'Kerberos KDC',
    user: 'admin',
    action: 'Kerberoasting',
    status: 'alert',
    details: 'TGS request for high-privilege SPN detected',
    incidentId: 'INC-2024-001',
    floor: 1,
    department: 'IT Operations',
  },
  {
    id: 'IEVT-005',
    timestamp: new Date(Date.now() - 6 * 60000).toISOString(),
    type: 'connection',
    source: 'ITO-F1-005',
    destination: 'DAT-F9-001',
    user: 'svc_account',
    action: 'Server Access',
    status: 'alert',
    details: 'Connection to Data Center server via elevated credentials',
    incidentId: 'INC-2024-001',
    floor: 9,
    department: 'Data Center',
  },
  {
    id: 'IEVT-006',
    timestamp: new Date(Date.now() - 5.5 * 60000).toISOString(),
    type: 'file_access',
    source: 'DAT-F9-001',
    destination: 'DAT-F9-004',
    user: 'svc_account',
    action: 'File Transfer',
    status: 'blocked',
    details: 'Attempted bulk file copy — BLOCKED by DLP policy',
    incidentId: 'INC-2024-001',
    floor: 9,
    department: 'Data Center',
  },
];

// Network topology edges
export interface NetworkEdge {
  source: string;
  target: string;
  volume: number;
  protocol: string;
  port: number;
  suspicious: boolean;
  attackPath: boolean;
}

export const NETWORK_EDGES: NetworkEdge[] = [
  { source: 'FIN-F2-003', target: 'ITO-F1-005', volume: 850, protocol: 'SMB', port: 445, suspicious: true, attackPath: true },
  { source: 'ITO-F1-005', target: 'DAT-F9-001', volume: 1200, protocol: 'RDP', port: 3389, suspicious: true, attackPath: true },
  { source: 'FIN-F2-003', target: 'FIN-F2-001', volume: 200, protocol: 'HTTPS', port: 443, suspicious: false, attackPath: false },
  { source: 'DAT-F9-001', target: 'DAT-F9-004', volume: 450, protocol: 'NFS', port: 2049, suspicious: true, attackPath: true },
  { source: 'SAL-F4-008', target: 'DAT-F9-001', volume: 120, protocol: 'HTTPS', port: 443, suspicious: false, attackPath: false },
  { source: 'RDS-F5-002', target: 'RDS-F6-001', volume: 380, protocol: 'SSH', port: 22, suspicious: true, attackPath: false },
  { source: 'MAN-F8-003', target: 'DAT-F9-012', volume: 2300, protocol: 'FTP', port: 21, suspicious: true, attackPath: false },
];
