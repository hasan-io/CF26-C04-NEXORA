"""
HealNode Server Simulator - SQLite Version
Generates realistic server-side events for 58 server containers
"""

import os
import json
import random
import time
from datetime import datetime, timedelta
import sqlite3
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables from docker-compose
SERVER_ID = os.getenv("SERVER_ID", "DEFAULT-SERVER")
FLOOR = int(os.getenv("FLOOR", "0"))
DEPARTMENT = os.getenv("DEPARTMENT", "Default")
SECURITY_LEVEL = os.getenv("SECURITY_LEVEL", "Standard")

# SQLite Database Path - ONLY this, no DB_HOST
DB_PATH = "/tmp/c04_events.db"

# Server configuration
SERVER_CONFIG = {
    "FINANCE-SERVER-F2-01": {"users": ["finance.admin", "finance.user1"], "databases": ["finance_db"]},
    "FINANCE-SERVER-F2-02": {"users": ["finance.admin", "finance.user2"], "databases": ["finance_db"]},
    "DEV-SERVER-F5-01": {"users": ["dev.admin", "dev.user1"], "databases": ["dev_db"]},
    "DEV-SERVER-F5-02": {"users": ["dev.admin", "dev.user2"], "databases": ["dev_db"]},
    "RESEARCH-SERVER-F6-01": {"users": ["research.admin", "research.user1"], "databases": ["research_db"]},
    "RESEARCH-SERVER-F6-02": {"users": ["research.admin", "research.user2"], "databases": ["research_db"]},
    "CRM-SERVER-F4-01": {"users": ["crm.admin", "sales.user1"], "databases": ["crm_db"]},
    "CRM-SERVER-F4-02": {"users": ["crm.admin", "sales.user2"], "databases": ["crm_db"]},
    "CORE-SERVER-F9-01": {"users": ["root", "core.admin"], "databases": ["core_db"]},
    "HR-SERVER-F3-01": {"users": ["hr.admin", "hr.user1"], "databases": ["hr_db"]},
}

class ServerSimulator:
    def __init__(self):
        self.connection = None
        self.cursor = None
        self.connect_db()
        self.create_tables()
        
    def connect_db(self):
        """Connect to SQLite database"""
        try:
            # Ensure directory exists
            db_dir = os.path.dirname(DB_PATH)
            if db_dir and not os.path.exists(db_dir):
                os.makedirs(db_dir, exist_ok=True)
            
            self.connection = sqlite3.connect(DB_PATH)
            self.connection.row_factory = sqlite3.Row
            self.cursor = self.connection.cursor()
            logger.info(f"{SERVER_ID}: Connected to SQLite database at {DB_PATH}")
        except Exception as e:
            logger.error(f"{SERVER_ID}: DB Connection failed - {e}")
            time.sleep(5)
            self.connect_db()
    
    def create_tables(self):
        """Create tables if they don't exist"""
        try:
            self.cursor.execute('''
                CREATE TABLE IF NOT EXISTS server_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    server_id TEXT,
                    floor INTEGER,
                    department TEXT,
                    event_type TEXT,
                    event_data TEXT,
                    security_level TEXT
                )
            ''')
            self.connection.commit()
            logger.info(f"{SERVER_ID}: Tables ready")
        except Exception as e:
            logger.error(f"{SERVER_ID}: Table creation failed - {e}")
    
    def insert_event(self, event_type, event_data):
        """Insert server event into database"""
        try:
            timestamp = datetime.utcnow().isoformat() + "Z"
            event_data_json = json.dumps(event_data)
            
            self.cursor.execute('''
                INSERT INTO server_events 
                (timestamp, server_id, floor, department, event_type, event_data, security_level)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                timestamp,
                SERVER_ID,
                FLOOR,
                DEPARTMENT,
                event_type,
                event_data_json,
                SECURITY_LEVEL
            ))
            self.connection.commit()
            logger.info(f"{SERVER_ID}: {event_type} event recorded")
        except Exception as e:
            logger.error(f"{SERVER_ID}: Insert failed - {e}")
    
    def generate_login_event(self):
        """Generate login event"""
        config = SERVER_CONFIG.get(SERVER_ID, {"users": ["user1", "user2"]})
        user = random.choice(config["users"])
        
        event = {
            "user": user,
            "source_device": f"LAPTOP-F{FLOOR}-{random.randint(1,20):02d}",
            "source_ip": f"192.168.{FLOOR}.{random.randint(10,200)}",
            "status": random.choice(["successful", "failed"]),
            "login_type": random.choice(["ssh", "rdp", "console"])
        }
        self.insert_event("login", event)
    
    def generate_database_query_event(self):
        """Generate database query event"""
        config = SERVER_CONFIG.get(SERVER_ID, {"users": ["user1"], "databases": ["db1"]})
        user = random.choice(config["users"])
        
        event = {
            "user": user,
            "query_type": random.choice(["SELECT", "INSERT", "UPDATE", "DELETE"]),
            "tables_accessed": random.sample(["users", "data", "logs", "config"], k=random.randint(1, 3)),
            "rows_affected": random.randint(1, 1000),
            "duration_ms": random.randint(10, 5000)
        }
        self.insert_event("database_query", event)
    
    def generate_file_access_event(self):
        """Generate file access event"""
        config = SERVER_CONFIG.get(SERVER_ID, {"users": ["user1"]})
        user = random.choice(config["users"])
        
        event = {
            "user": user,
            "file_path": f"/var/data/{SERVER_ID.lower()}/file_{random.randint(1,100)}.dat",
            "access_type": random.choice(["read", "write", "execute", "delete"]),
            "size_bytes": random.randint(1024, 10485760),
            "status": "accessed"
        }
        self.insert_event("file_access", event)
    
    def generate_service_activity_event(self):
        """Generate service activity event"""
        event = {
            "service_name": random.choice(["postgresql", "sshd", "nginx", "mysql", "mongodb"]),
            "action": random.choice(["started", "stopped", "restarted", "failed"]),
            "status": random.choice(["success", "error"]),
            "exit_code": random.choice([0, 1, 127]) if random.random() > 0.8 else 0
        }
        self.insert_event("service_activity", event)
    
    def generate_connection_event(self):
        """Generate network connection event"""
        event = {
            "source_device": f"DEVICE-F{random.randint(1,9)}-{random.randint(1,50):02d}",
            "source_ip": f"192.168.{random.randint(1,9)}.{random.randint(10,200)}",
            "protocol": random.choice(["TCP", "UDP"]),
            "port": random.choice([22, 443, 3306, 5432, 80, 8000, 9000]),
            "status": random.choice(["established", "closed", "timeout"]),
            "bytes_sent": random.randint(100, 1000000),
            "bytes_received": random.randint(100, 1000000)
        }
        self.insert_event("connection", event)
    
    def generate_health_event(self):
        """Generate health/metrics event"""
        event = {
            "cpu_percent": random.randint(5, 95),
            "memory_percent": random.randint(10, 85),
            "disk_percent": random.randint(20, 80),
            "network_in_mbps": random.randint(1, 100),
            "network_out_mbps": random.randint(1, 100),
            "uptime_seconds": random.randint(86400, 31536000)
        }
        self.insert_event("health", event)
    
    def run(self):
        """Main simulator loop"""
        logger.info(f"{SERVER_ID} (Floor {FLOOR}, {DEPARTMENT}) - Starting event generation")
        
        event_generators = [
            self.generate_login_event,
            self.generate_database_query_event,
            self.generate_file_access_event,
            self.generate_service_activity_event,
            self.generate_connection_event,
            self.generate_health_event
        ]
        
        event_count = 0
        
        while True:
            try:
                # Generate random event every 5-15 seconds
                generator = random.choice(event_generators)
                generator()
                event_count += 1
                
                sleep_time = random.uniform(5, 15)
                time.sleep(sleep_time)
                
            except KeyboardInterrupt:
                logger.info(f"{SERVER_ID}: Shutting down gracefully")
                break
            except Exception as e:
                logger.error(f"{SERVER_ID}: Error - {e}")
                time.sleep(5)

if __name__ == "__main__":
    simulator = ServerSimulator()
    simulator.run()