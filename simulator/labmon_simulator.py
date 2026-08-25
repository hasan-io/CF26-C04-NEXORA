"""
LabMon Simulator - Event Generator for C-04 Cybersecurity Threat Detection System
Generates realistic device events in real-time for 152 devices across 10-floor IT building
"""

import asyncio
import json
import random
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from enum import Enum

import psycopg2
from psycopg2.extras import execute_values
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv
import os

from scenario_definitions import get_scenario, list_scenarios, SCENARIOS

# ============================================================================
# CONFIGURATION
# ============================================================================
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_USER = os.getenv("DB_USER", "c04")
DB_PASSWORD = os.getenv("DB_PASSWORD", "secure_password")
DB_NAME = os.getenv("DB_NAME", "c04_events")

APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
APP_PORT = int(os.getenv("APP_PORT", "8000"))
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

NORMAL_EVENTS_PER_SECOND = int(os.getenv("NORMAL_EVENTS_PER_SECOND", "15"))
SCENARIO_DURATION_SECONDS = int(os.getenv("SCENARIO_DURATION_SECONDS", "120"))

# ============================================================================
# LOGGING
# ============================================================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# MODELS
# ============================================================================
class SimulationStatus(str, Enum):
    IDLE = "idle"
    RUNNING_NORMAL = "running_normal"
    RUNNING_SCENARIO = "running_scenario"
    STOPPED = "stopped"


class SimulationState(BaseModel):
    status: SimulationStatus
    current_scenario: Optional[int] = None
    events_generated: int = 0
    events_sent_to_db: int = 0
    uptime_seconds: int = 0


class StartScenarioRequest(BaseModel):
    scenario: int


# ============================================================================
# DATABASE
# ============================================================================
class DatabaseManager:
    def __init__(self):
        self.connection = None
        self.cursor = None

    def connect(self):
        """Connect to PostgreSQL database"""
        try:
            self.connection = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME
            )
            self.cursor = self.connection.cursor()
            logger.info(f"Connected to PostgreSQL: {DB_HOST}:{DB_PORT}/{DB_NAME}")
            self._create_tables()
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise

    def _create_tables(self):
        """Create events table if it doesn't exist"""
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            timestamp TIMESTAMP NOT NULL,
            device_id VARCHAR(100) NOT NULL,
            floor INTEGER,
            department VARCHAR(100),
            event_type VARCHAR(50) NOT NULL,
            source_ip VARCHAR(15),
            destination_ip VARCHAR(15),
            destination_device VARCHAR(100),
            port INTEGER,
            protocol VARCHAR(10),
            user_name VARCHAR(100),
            process_name VARCHAR(255),
            file_path VARCHAR(500),
            status VARCHAR(100),
            risk_level VARCHAR(20),
            scenario_id INTEGER,
            raw_data JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT idx_timestamp_device UNIQUE (timestamp, device_id, event_type)
        );
        
        CREATE INDEX IF NOT EXISTS idx_timestamp ON events (timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_device_id ON events (device_id);
        CREATE INDEX IF NOT EXISTS idx_event_type ON events (event_type);
        CREATE INDEX IF NOT EXISTS idx_risk_level ON events (risk_level);
        CREATE INDEX IF NOT EXISTS idx_scenario_id ON events (scenario_id);
        """
        try:
            self.cursor.execute(create_table_sql)
            self.connection.commit()
            logger.info("Events table ready")
        except psycopg2.Error as e:
            logger.warning(f"Table creation: {e}")
            self.connection.rollback()

    def insert_event(self, event: Dict[str, Any]):
        """Insert a single event into database"""
        try:
            insert_sql = """
            INSERT INTO events (
                timestamp, device_id, floor, department, event_type,
                source_ip, destination_ip, destination_device, port, protocol,
                user_name, process_name, file_path, status, risk_level,
                scenario_id, raw_data
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (timestamp, device_id, event_type) DO NOTHING;
            """
            
            self.cursor.execute(insert_sql, (
                event.get('timestamp'),
                event.get('device_id'),
                event.get('floor'),
                event.get('department'),
                event.get('event_type'),
                event.get('source_ip'),
                event.get('destination_ip'),
                event.get('destination_device'),
                event.get('port'),
                event.get('protocol'),
                event.get('user'),
                event.get('process_name'),
                event.get('file_path'),
                event.get('status'),
                event.get('risk_level', 'normal'),
                event.get('scenario_id'),
                json.dumps(event)
            ))
            self.connection.commit()
            return True
        except psycopg2.Error as e:
            logger.error(f"Insert error: {e}")
            self.connection.rollback()
            return False

    def insert_events_batch(self, events: List[Dict[str, Any]]):
        """Insert multiple events efficiently"""
        if not events:
            return 0
        
        try:
            insert_sql = """
            INSERT INTO events (
                timestamp, device_id, floor, department, event_type,
                source_ip, destination_ip, destination_device, port, protocol,
                user_name, process_name, file_path, status, risk_level,
                scenario_id, raw_data
            ) VALUES %s
            ON CONFLICT (timestamp, device_id, event_type) DO NOTHING;
            """
            
            values = []
            for event in events:
                values.append((
                    event.get('timestamp'),
                    event.get('device_id'),
                    event.get('floor'),
                    event.get('department'),
                    event.get('event_type'),
                    event.get('source_ip'),
                    event.get('destination_ip'),
                    event.get('destination_device'),
                    event.get('port'),
                    event.get('protocol'),
                    event.get('user'),
                    event.get('process_name'),
                    event.get('file_path'),
                    event.get('status'),
                    event.get('risk_level', 'normal'),
                    event.get('scenario_id'),
                    json.dumps(event)
                ))
            
            execute_values(self.cursor, insert_sql, values)
            self.connection.commit()
            return len(events)
        except psycopg2.Error as e:
            logger.error(f"Batch insert error: {e}")
            self.connection.rollback()
            return 0

    def close(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
        logger.info("Database connection closed")


# ============================================================================
# EVENT GENERATOR
# ============================================================================
class EventGenerator:
    def __init__(self, devices_config: Dict[str, Any]):
        self.devices = devices_config['devices']
        self.servers = devices_config['servers']
        self.device_map = {d['device_id']: d for d in self.devices}

    def generate_normal_event(self) -> Dict[str, Any]:
        """Generate a realistic normal event"""
        device = random.choice(self.devices)
        device_id = device['device_id']
        
        event_types = ['process_spawned', 'network_connection', 'authentication', 'file_access']
        event_type = random.choice(event_types)
        
        timestamp = datetime.utcnow().isoformat() + 'Z'
        
        if event_type == 'process_spawned':
            processes = ['explorer.exe', 'chrome.exe', 'cmd.exe', 'notepad.exe', 'svchost.exe']
            return {
                'timestamp': timestamp,
                'device_id': device_id,
                'floor': device['floor'],
                'department': device['department'],
                'event_type': 'process_spawned',
                'process_name': random.choice(processes),
                'parent_process': 'explorer.exe',
                'user': random.choice(device['baseline_behavior']['normal_users']),
                'status': 'started',
                'risk_level': 'normal'
            }
        
        elif event_type == 'network_connection':
            baseline = device['baseline_behavior']
            allowed_dest = baseline['allowed_destinations']
            
            if 'all' in allowed_dest:
                dest_device = random.choice([d['device_id'] for d in self.devices if d['device_id'] != device_id])
            elif 'external' in allowed_dest:
                dest_device = random.choice([random.choice(allowed_dest), f"external-{random.randint(1,100)}"])
            else:
                dest_device = random.choice(allowed_dest) if allowed_dest else random.choice([d['device_id'] for d in self.devices])
            
            dest = self.device_map.get(dest_device)
            dest_ip = dest['ip_address'] if dest else f"203.0.113.{random.randint(1,254)}"
            
            return {
                'timestamp': timestamp,
                'device_id': device_id,
                'source_ip': device['ip_address'],
                'destination_device': dest_device,
                'destination_ip': dest_ip,
                'port': random.choice(device['baseline_behavior']['normal_ports']),
                'protocol': random.choice(['TCP', 'UDP']),
                'user': random.choice(device['baseline_behavior']['normal_users']),
                'status': 'connection_established',
                'risk_level': 'normal',
                'floor': device['floor'],
                'department': device['department'],
                'event_type': 'network_connection'
            }
        
        elif event_type == 'authentication':
            return {
                'timestamp': timestamp,
                'device_id': device_id,
                'floor': device['floor'],
                'department': device['department'],
                'event_type': 'authentication',
                'user': random.choice(device['baseline_behavior']['normal_users']),
                'login_type': random.choice(['local', 'domain', 'vpn']),
                'status': 'success',
                'risk_level': 'normal'
            }
        
        else:  # file_access
            return {
                'timestamp': timestamp,
                'device_id': device_id,
                'floor': device['floor'],
                'department': device['department'],
                'event_type': 'file_access',
                'file_path': random.choice(['C:\\Users\\Documents', '/home/user/files', 'D:\\Data']),
                'access_type': random.choice(['read', 'write', 'execute']),
                'user': random.choice(device['baseline_behavior']['normal_users']),
                'status': 'accessed',
                'risk_level': 'normal'
            }


# ============================================================================
# SIMULATION ENGINE
# ============================================================================
class SimulationEngine:
    def __init__(self, db_manager: DatabaseManager, event_generator: EventGenerator):
        self.db = db_manager
        self.generator = event_generator
        
        self.status = SimulationStatus.IDLE
        self.current_scenario: Optional[Any] = None
        self.events_generated = 0
        self.events_sent = 0
        self.start_time = None
        self.running = False
        
        with open('device_config.json', 'r') as f:
            self.devices_config = json.load(f)

    async def start_normal_simulation(self):
        """Run continuous normal event generation"""
        self.status = SimulationStatus.RUNNING_NORMAL
        self.start_time = datetime.utcnow()
        self.running = True
        logger.info("Starting normal simulation")
        
        try:
            while self.running and self.status == SimulationStatus.RUNNING_NORMAL:
                events = []
                # Generate N events per iteration
                for _ in range(max(1, int(NORMAL_EVENTS_PER_SECOND / 10))):
                    events.append(self.generator.generate_normal_event())
                
                # Send to database in batch
                sent = self.db.insert_events_batch(events)
                self.events_generated += len(events)
                self.events_sent += sent
                
                await asyncio.sleep(0.1)  # ~100ms between batches = ~10-20 events/sec
        except Exception as e:
            logger.error(f"Normal simulation error: {e}")
        finally:
            self.status = SimulationStatus.IDLE

    async def start_scenario(self, scenario_id: int):
        """Run a specific attack scenario"""
        if scenario_id not in SCENARIOS:
            raise ValueError(f"Invalid scenario ID: {scenario_id}")
        
        self.current_scenario = get_scenario(scenario_id)
        self.current_scenario.start()
        self.status = SimulationStatus.RUNNING_SCENARIO
        self.start_time = datetime.utcnow()
        self.running = True
        
        logger.info(f"Starting scenario {scenario_id}: {self.current_scenario.name}")
        
        try:
            while self.running and not self.current_scenario.is_expired():
                elapsed = (datetime.utcnow() - self.current_scenario.start_time).total_seconds()
                
                # Get scenario events
                scenario_events = self.current_scenario.get_events_at_time(elapsed)
                
                # Generate some normal events mixed in
                normal_events = []
                for _ in range(max(1, int(NORMAL_EVENTS_PER_SECOND / 20))):
                    normal_events.append(self.generator.generate_normal_event())
                
                all_events = scenario_events + normal_events
                
                # Send to database
                sent = self.db.insert_events_batch(all_events)
                self.events_generated += len(all_events)
                self.events_sent += sent
                
                await asyncio.sleep(0.1)
        
        except Exception as e:
            logger.error(f"Scenario execution error: {e}")
        finally:
            self.current_scenario.stop()
            self.current_scenario = None
            self.status = SimulationStatus.IDLE
            logger.info(f"Scenario {scenario_id} completed")

    def stop(self):
        """Stop current simulation"""
        self.running = False
        if self.current_scenario:
            self.current_scenario.stop()
        self.status = SimulationStatus.IDLE
        logger.info("Simulation stopped")

    def get_status(self) -> SimulationState:
        """Get current simulation state"""
        uptime = 0
        if self.start_time:
            uptime = int((datetime.utcnow() - self.start_time).total_seconds())
        
        return SimulationState(
            status=self.status,
            current_scenario=self.current_scenario.scenario_id if self.current_scenario else None,
            events_generated=self.events_generated,
            events_sent_to_db=self.events_sent,
            uptime_seconds=uptime
        )


# ============================================================================
# FASTAPI APP
# ============================================================================
app = FastAPI(
    title="LabMon Simulator",
    description="Event Generator for C-04 Cybersecurity Threat Detection",
    version="1.0.0"
)

db_manager = DatabaseManager()
event_generator = None
simulation_engine = None
simulation_task = None


@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    global event_generator, simulation_engine
    
    try:
        db_manager.connect()
        
        with open('device_config.json', 'r') as f:
            devices_config = json.load(f)
        
        event_generator = EventGenerator(devices_config)
        simulation_engine = SimulationEngine(db_manager, event_generator)
        
        logger.info("LabMon Simulator started successfully")
        logger.info(f"Loaded {len(event_generator.devices)} devices")
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    if simulation_engine:
        simulation_engine.stop()
    db_manager.close()
    logger.info("LabMon Simulator shutdown")


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Health check"""
    return {
        "name": "LabMon Simulator",
        "status": "operational",
        "version": "1.0.0"
    }


@app.get("/api/simulation/status")
async def get_status():
    """Get current simulation status"""
    if not simulation_engine:
        raise HTTPException(status_code=503, detail="Simulator not initialized")
    
    return simulation_engine.get_status()


@app.post("/api/simulation/start")
async def start_simulation(scenario: int = Query(..., description="Scenario ID (1, 2, or 3) or 0 for normal")):
    """Start a simulation (normal or scenario)"""
    global simulation_task
    
    if not simulation_engine:
        raise HTTPException(status_code=503, detail="Simulator not initialized")
    
    if simulation_engine.running:
        raise HTTPException(status_code=400, detail="Simulation already running")
    
    try:
        if scenario == 0:
            simulation_task = asyncio.create_task(simulation_engine.start_normal_simulation())
            return {"message": "Normal simulation started", "scenario": None}
        else:
            simulation_task = asyncio.create_task(simulation_engine.start_scenario(scenario))
            return {"message": f"Scenario {scenario} started", "scenario": scenario}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Start error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/simulation/stop")
async def stop_simulation():
    """Stop current simulation"""
    if not simulation_engine:
        raise HTTPException(status_code=503, detail="Simulator not initialized")
    
    if not simulation_engine.running:
        raise HTTPException(status_code=400, detail="No simulation running")
    
    simulation_engine.stop()
    return {"message": "Simulation stopped"}


@app.get("/api/scenarios")
async def list_all_scenarios():
    """List all available scenarios"""
    scenarios = list_scenarios()
    return {
        "total": len(scenarios),
        "scenarios": scenarios
    }


@app.get("/api/devices/count")
async def get_device_count():
    """Get total device count"""
    if not event_generator:
        raise HTTPException(status_code=503, detail="Simulator not initialized")
    
    return {
        "total_devices": len(event_generator.devices),
        "by_floor": _count_devices_by_floor(event_generator.devices)
    }


def _count_devices_by_floor(devices: List[Dict]) -> Dict[int, int]:
    """Count devices by floor"""
    counts = {}
    for device in devices:
        floor = device['floor']
        counts[floor] = counts.get(floor, 0) + 1
    return dict(sorted(counts.items()))


@app.get("/api/devices/by-department")
async def get_devices_by_department():
    """Get device distribution by department"""
    if not event_generator:
        raise HTTPException(status_code=503, detail="Simulator not initialized")
    
    by_dept = {}
    for device in event_generator.devices:
        dept = device['department']
        by_dept[dept] = by_dept.get(dept, 0) + 1
    
    return dict(sorted(by_dept.items()))


@app.get("/healthz")
async def health():
    """Kubernetes liveness probe"""
    return {"status": "healthy"}


# ============================================================================
# RUN SERVER
# ============================================================================
if __name__ == "__main__":
    uvicorn.run(
        "labmon_simulator:app",
        host=APP_HOST,
        port=APP_PORT,
        reload=DEBUG,
        log_level="info"
    )