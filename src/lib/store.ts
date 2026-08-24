import { create } from 'zustand';
import { type Device, type Incident, type SecurityEvent, DEVICES, INCIDENTS, INITIAL_EVENTS, generateEvent } from './mockData';

interface SimulationState {
  running: boolean;
  scenario: string | null;
  speed: number;
  intensity: number;
  eventsGenerated: number;
  eventsDetected: number;
}

interface AppState {
  // Data
  devices: Device[];
  incidents: Incident[];
  events: SecurityEvent[];
  
  // UI State
  selectedDevice: Device | null;
  selectedIncident: Incident | null;
  activeFloors: number[];
  showAttackPath: boolean;
  layerView: string;
  
  // Simulation
  simulation: SimulationState;
  simulationInterval: ReturnType<typeof setInterval> | null;
  
  // Notifications
  notifications: Array<{ id: string; message: string; type: 'success' | 'warning' | 'error' | 'info'; timestamp: number }>;
  
  // Actions
  setSelectedDevice: (device: Device | null) => void;
  setSelectedIncident: (incident: Incident | null) => void;
  toggleFloor: (floor: number) => void;
  setAllFloors: () => void;
  setShowAttackPath: (show: boolean) => void;
  setLayerView: (view: string) => void;
  addEvent: (event: SecurityEvent) => void;
  blockDevice: (deviceId: string) => void;
  blockIncident: (incidentId: string) => void;
  startSimulation: (scenario: string, speed?: number, intensity?: number) => void;
  stopSimulation: () => void;
  generateManualEvent: (overrides: Partial<SecurityEvent>) => void;
  addNotification: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  dismissNotification: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  devices: DEVICES,
  incidents: INCIDENTS,
  events: INITIAL_EVENTS,
  selectedDevice: null,
  selectedIncident: null,
  activeFloors: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  showAttackPath: true,
  layerView: 'all',
  simulation: {
    running: false,
    scenario: null,
    speed: 1,
    intensity: 1,
    eventsGenerated: 0,
    eventsDetected: 0,
  },
  simulationInterval: null,
  notifications: [],

  setSelectedDevice: (device) => set({ selectedDevice: device }),
  setSelectedIncident: (incident) => set({ selectedIncident: incident }),

  toggleFloor: (floor) => set((state) => ({
    activeFloors: state.activeFloors.includes(floor)
      ? state.activeFloors.filter(f => f !== floor)
      : [...state.activeFloors, floor]
  })),

  setAllFloors: () => set({ activeFloors: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }),

  setShowAttackPath: (show) => set({ showAttackPath: show }),
  setLayerView: (view) => set({ layerView: view }),

  addEvent: (event) => set((state) => ({
    events: [event, ...state.events].slice(0, 200),
  })),

  blockDevice: (deviceId) => set((state) => ({
    devices: state.devices.map(d =>
      d.id === deviceId ? { ...d, status: 'blocked' as const } : d
    ),
  })),

  blockIncident: (incidentId) => set((state) => ({
    incidents: state.incidents.map(i =>
      i.id === incidentId ? { ...i, status: 'blocked' as const } : i
    ),
  })),

  startSimulation: (scenario, speed = 1, intensity = 1) => {
    const existing = get().simulationInterval;
    if (existing) clearInterval(existing);

    const intervalMs = Math.max(500, 2000 / speed);
    const interval = setInterval(() => {
      const state = get();
      if (!state.simulation.running) return;

      const count = intensity === 3 ? 3 : intensity === 2 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const event = generateEvent();
        get().addEvent(event);
      }

      set((state) => ({
        simulation: {
          ...state.simulation,
          eventsGenerated: state.simulation.eventsGenerated + count,
          eventsDetected: state.simulation.eventsDetected + count,
        }
      }));
    }, intervalMs);

    set({
      simulation: {
        running: true,
        scenario,
        speed,
        intensity,
        eventsGenerated: 0,
        eventsDetected: 0,
      },
      simulationInterval: interval,
    });

    get().addNotification(`Simulation started: ${scenario}`, 'info');
  },

  stopSimulation: () => {
    const interval = get().simulationInterval;
    if (interval) clearInterval(interval);
    set((state) => ({
      simulation: { ...state.simulation, running: false },
      simulationInterval: null,
    }));
    get().addNotification('Simulation stopped', 'warning');
  },

  generateManualEvent: (overrides) => {
    const event = generateEvent(overrides);
    get().addEvent(event);
    get().addNotification('Manual event generated', 'success');
  },

  addNotification: (message, type) => {
    const id = `notif-${Date.now()}`;
    set((state) => ({
      notifications: [...state.notifications, { id, message, type, timestamp: Date.now() }],
    }));
    setTimeout(() => get().dismissNotification(id), 5000);
  },

  dismissNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id),
  })),
}));
