import { Routes, Route } from 'react-router-dom';
import { NavSidebar } from './components/NavSidebar';
import { Dashboard } from './pages/Dashboard';
import { BuildingModel } from './pages/BuildingModel';
import { IncidentReconstruction } from './pages/IncidentReconstruction';
import { NetworkView } from './pages/NetworkView';
import { LiveEvents } from './pages/LiveEvents';
import { DeviceDetails } from './pages/DeviceDetails';
import { SimulationPanel } from './pages/SimulationPanel';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <NavSidebar />
      <main className="flex-1 ml-[220px] min-h-screen overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/building" element={<BuildingModel />} />
          <Route path="/incidents" element={<IncidentReconstruction />} />
          <Route path="/incidents/:id" element={<IncidentReconstruction />} />
          <Route path="/network" element={<NetworkView />} />
          <Route path="/events" element={<LiveEvents />} />
          <Route path="/device" element={<DeviceDetails />} />
          <Route path="/device/:id" element={<DeviceDetails />} />
          <Route path="/simulation" element={<SimulationPanel />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
