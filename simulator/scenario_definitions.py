"""
Attack Scenario Definitions for LabMon Simulator
3 pre-built scenarios with timing and event sequences
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any
import random


class ScenarioEvent:
    """Represents a single event in a scenario"""
    def __init__(self, delay_seconds: int, event_type: str, data: Dict[str, Any]):
        self.delay_seconds = delay_seconds
        self.event_type = event_type
        self.data = data


class Scenario:
    """Base class for attack scenarios"""
    def __init__(self, scenario_id: int, name: str, description: str, duration_seconds: int):
        self.scenario_id = scenario_id
        self.name = name
        self.description = description
        self.duration_seconds = duration_seconds
        self.events: List[ScenarioEvent] = []
        self.start_time: datetime = None
        self.is_active = False
        self.last_fired_events = {}

    def add_event(self, delay_seconds: int, event_type: str, data: Dict[str, Any]):
        """Add an event to the scenario"""
        self.events.append(ScenarioEvent(delay_seconds, event_type, data))

    def start(self):
        """Start the scenario"""
        self.start_time = datetime.utcnow()
        self.is_active = True
        self.last_fired_events = {}

    def stop(self):
        """Stop the scenario"""
        self.is_active = False

    def get_events_at_time(self, elapsed_seconds: float) -> List[Dict[str, Any]]:
        """Get events that should fire at this elapsed time"""
        result = []
        
        for idx, event in enumerate(self.events):
            event_key = f"{idx}"
            last_fired = self.last_fired_events.get(event_key, -1)
            
            # Check if event should fire at this time (fire once per occurrence)
            if elapsed_seconds >= event.delay_seconds and last_fired < event.delay_seconds:
                result.append({
                    "event_type": event.event_type,
                    "data": event.data.copy(),
                    "timestamp": self.start_time + timedelta(seconds=elapsed_seconds),
                    "scenario_id": self.scenario_id
                })
                self.last_fired_events[event_key] = elapsed_seconds
        
        return result

    def is_expired(self) -> bool:
        """Check if scenario duration has elapsed"""
        if not self.is_active or not self.start_time:
            return False
        elapsed = (datetime.utcnow() - self.start_time).total_seconds()
        return elapsed > self.duration_seconds


# ============================================================================
# SCENARIO 1: Sales Laptop to Finance Server (Insider Threat)
# ============================================================================
class Scenario1_SalesLaptopToFinance(Scenario):
    """
    Sales employee laptop compromised, attempting to access Finance server
    Risk Level: HIGH - Unauthorized access to sensitive financial data
    """
    def __init__(self):
        super().__init__(
            scenario_id=1,
            name="Sales Laptop to Finance Server",
            description="Compromised Sales laptop attempts unauthorized access to Finance database",
            duration_seconds=120  # 2 minutes
        )
        
        # Event 1 (0s): Suspicious process starts
        self.add_event(0, "process_spawned", {
            "device_id": "SALES-LAPTOP-F4-01",
            "floor": 4,
            "department": "Sales",
            "process_name": "powershell.exe",
            "parent_process": "explorer.exe",
            "user": "sales.user1",
            "command_line": "powershell -nop -w hidden -c IEX",
            "risk_level": "high"
        })
        
        # Event 2 (5s): Network connection to Finance server
        self.add_event(5, "network_connection", {
            "source_device": "SALES-LAPTOP-F4-01",
            "source_ip": "192.168.4.10",
            "destination_device": "FINANCE-SERVER-F2-01",
            "destination_ip": "192.168.2.50",
            "port": 1433,
            "protocol": "TCP",
            "user": "sales.user1",
            "status": "connection_attempted",
            "risk_level": "high"
        })
        
        # Event 3 (10s): Privilege escalation attempt
        self.add_event(10, "privileged_access", {
            "device_id": "SALES-LAPTOP-F4-01",
            "floor": 4,
            "department": "Sales",
            "escalation_type": "token_impersonation",
            "user": "sales.user1",
            "target_user": "administrator",
            "status": "attempted",
            "risk_level": "critical"
        })
        
        # Event 4 (15s): File access to Finance database
        self.add_event(15, "file_access", {
            "device_id": "FINANCE-SERVER-F2-01",
            "floor": 2,
            "department": "Finance",
            "file_path": "C:\\SQLData\\finance_db.mdf",
            "access_type": "read",
            "user": "sales.user1",
            "status": "accessed",
            "risk_level": "critical"
        })


# ============================================================================
# SCENARIO 2: Dev Compromise to Research Server (Lateral Movement)
# ============================================================================
class Scenario2_DevToResearchCompromise(Scenario):
    """
    Dev server compromised, attacker performs lateral movement to Research server
    Risk Level: CRITICAL - Research data exfiltration risk
    """
    def __init__(self):
        super().__init__(
            scenario_id=2,
            name="Dev Compromise to Research Server",
            description="Compromised Dev server attempts lateral movement to Research infrastructure",
            duration_seconds=180  # 3 minutes
        )
        
        # Event 1 (0s): Suspicious process on Dev server
        self.add_event(0, "process_spawned", {
            "device_id": "DEV-SERVER-F5-01",
            "floor": 5,
            "department": "R&D Software",
            "process_name": "svchost.exe",
            "parent_process": "services.exe",
            "user": "root",
            "command_line": "svchost -k netsvcs",
            "risk_level": "high"
        })
        
        # Event 2 (8s): Network scan detected
        self.add_event(8, "network_connection", {
            "source_device": "DEV-SERVER-F5-01",
            "source_ip": "192.168.5.50",
            "destination_device": "RESEARCH-SERVER-F6-01",
            "destination_ip": "192.168.6.50",
            "port": 445,
            "protocol": "TCP",
            "user": "root",
            "status": "port_scanning",
            "risk_level": "high"
        })
        
        # Event 3 (12s): Connection to Research server established
        self.add_event(12, "network_connection", {
            "source_device": "DEV-SERVER-F5-01",
            "source_ip": "192.168.5.50",
            "destination_device": "RESEARCH-SERVER-F6-01",
            "destination_ip": "192.168.6.50",
            "port": 445,
            "protocol": "TCP",
            "user": "root",
            "status": "connection_established",
            "risk_level": "critical"
        })
        
        # Event 4 (20s): Database query on Research server
        self.add_event(20, "file_access", {
            "device_id": "RESEARCH-SERVER-F6-01",
            "floor": 6,
            "department": "R&D Research",
            "file_path": "C:\\ResearchData\\proprietary_research.db",
            "access_type": "read",
            "user": "root",
            "status": "accessed",
            "risk_level": "critical"
        })
        
        # Event 5 (25s): Large data transfer detected
        self.add_event(25, "network_connection", {
            "source_device": "RESEARCH-SERVER-F6-01",
            "source_ip": "192.168.6.50",
            "destination_device": "external",
            "destination_ip": "203.0.113.45",
            "port": 443,
            "protocol": "TCP",
            "user": "root",
            "status": "data_exfiltration",
            "bytes_transferred": 5242880,
            "risk_level": "critical"
        })


# ============================================================================
# SCENARIO 3: External to Executive Compromise (APT-like)
# ============================================================================
class Scenario3_ExternalToExecutiveCompromise(Scenario):
    """
    External attacker gains VPN access, compromises Sales laptop, moves to executives
    Risk Level: CRITICAL - Executive workstation and Core server access
    """
    def __init__(self):
        super().__init__(
            scenario_id=3,
            name="External to Executive Compromise",
            description="External attacker pivots through Sales to Executive and Core infrastructure",
            duration_seconds=240  # 4 minutes
        )
        
        # Event 1 (0s): Unusual VPN login from external IP
        self.add_event(0, "authentication", {
            "device_id": "VPN-GATEWAY-F1-01",
            "floor": 1,
            "department": "IT Ops",
            "user": "sales.user1",
            "login_type": "vpn",
            "source_ip": "203.0.113.100",
            "status": "success",
            "location": "unknown",
            "risk_level": "high"
        })
        
        # Event 2 (10s): Connection to Sales laptop
        self.add_event(10, "network_connection", {
            "source_device": "external",
            "source_ip": "203.0.113.100",
            "destination_device": "SALES-LAPTOP-F4-01",
            "destination_ip": "192.168.4.10",
            "port": 3389,
            "protocol": "TCP",
            "user": "sales.user1",
            "status": "connection_established",
            "risk_level": "high"
        })
        
        # Event 3 (15s): Privilege escalation on Sales laptop
        self.add_event(15, "privileged_access", {
            "device_id": "SALES-LAPTOP-F4-01",
            "floor": 4,
            "department": "Sales",
            "escalation_type": "kerberoasting",
            "user": "sales.user1",
            "target_user": "administrator",
            "status": "successful",
            "risk_level": "critical"
        })
        
        # Event 4 (25s): Connection to Management workstation
        self.add_event(25, "network_connection", {
            "source_device": "SALES-LAPTOP-F4-01",
            "source_ip": "192.168.4.10",
            "destination_device": "MANAGEMENT-LAPTOP-F8-02",
            "destination_ip": "192.168.8.11",
            "port": 445,
            "protocol": "TCP",
            "user": "administrator",
            "status": "connection_established",
            "risk_level": "critical"
        })
        
        # Event 5 (35s): Process injection on Executive workstation
        self.add_event(35, "process_spawned", {
            "device_id": "MANAGEMENT-LAPTOP-F8-02",
            "floor": 8,
            "department": "Management",
            "process_name": "lsass.exe",
            "parent_process": "services.exe",
            "user": "administrator",
            "command_line": "lsass.exe",
            "injection_detected": True,
            "risk_level": "critical"
        })
        
        # Event 6 (45s): CRITICAL - Connection to Core Server
        self.add_event(45, "network_connection", {
            "source_device": "MANAGEMENT-LAPTOP-F8-02",
            "source_ip": "192.168.8.11",
            "destination_device": "CORE-SERVER-F9-01",
            "destination_ip": "192.168.9.52",
            "port": 5432,
            "protocol": "TCP",
            "user": "administrator",
            "status": "connection_established",
            "risk_level": "critical",
            "alert": "CRITICAL - Core server access attempt from compromised executive workstation"
        })
        
        # Event 7 (60s): Database access attempt on Core Server
        self.add_event(60, "file_access", {
            "device_id": "CORE-SERVER-F9-01",
            "floor": 9,
            "department": "Data Center",
            "file_path": "/var/lib/postgresql/core_db",
            "access_type": "read",
            "user": "administrator",
            "status": "accessed",
            "risk_level": "critical"
        })


# ============================================================================
# Scenario Registry
# ============================================================================
SCENARIOS = {
    1: Scenario1_SalesLaptopToFinance,
    2: Scenario2_DevToResearchCompromise,
    3: Scenario3_ExternalToExecutiveCompromise
}


def get_scenario(scenario_id: int) -> Scenario:
    """Get a scenario by ID"""
    if scenario_id not in SCENARIOS:
        raise ValueError(f"Invalid scenario ID: {scenario_id}. Valid IDs: {list(SCENARIOS.keys())}")
    return SCENARIOS[scenario_id]()


def list_scenarios() -> Dict[int, Dict[str, str]]:
    """List all available scenarios"""
    result = {}
    for scenario_id, scenario_class in SCENARIOS.items():
        instance = scenario_class()
        result[scenario_id] = {
            "name": instance.name,
            "description": instance.description,
            "duration_seconds": instance.duration_seconds,
            "event_count": len(instance.events)
        }
    return result