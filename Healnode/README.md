# HealNode Docker Setup - C-04 Server Monitoring

## Overview
HealNode is a **Docker-based server monitoring system** that simulates and monitors **58 servers** across a 10-floor IT building. It generates realistic server-side events (logins, database queries, file access, etc.) and stores them in PostgreSQL for C-04 threat detection analysis.

---

## 📦 Components

### 1. **Dockerfile**
- Base image: Ubuntu 22.04
- Installs: Python 3, PostgreSQL client, SSH server
- Runs: `server_simulator.py` inside each container
- Exposes ports: 22 (SSH), 8000, 9000

### 2. **docker-compose.yml**
- **58 server containers** (one per server)
- **1 PostgreSQL database** (c04_events)
- **Networking:** All containers on `c04_network` bridge
- **Health checks:** Each container monitored
- **Auto-restart:** `unless-stopped`

### 3. **server_simulator.py**
- Generates realistic server events:
  - `login` - User authentication attempts
  - `database_query` - SQL queries (SELECT, INSERT, UPDATE, DELETE)
  - `file_access` - File read/write operations
  - `service_activity` - Service start/stop/restart
  - `connection` - Network connections
  - `health` - CPU, memory, disk metrics
- Events stored in PostgreSQL `server_events` table
- Runs inside each container

### 4. **healnode_config.yaml**
- Configuration for all 58 servers
- Monitoring intervals and alert thresholds
- Database connection details
- Event types to monitor

---

## 📋 Server Distribution

```
Floor 1 (IT Ops):        1 server
Floor 2 (Finance):       2 servers
Floor 3 (HR):            1 server
Floor 4 (Sales/CRM):     2 servers
Floor 5 (R&D Software):  2 servers
Floor 6 (R&D Research):  2 servers
Floor 7 (QA):            2 servers
Floor 8 (Management):    2 servers
Floor 9 (Data Center):  42 servers
  ├─ Core Servers:       8
  ├─ Database Servers:   4
  ├─ Backup Servers:     4
  └─ Infrastructure:     4 (firewalls, load balancer, monitoring)

TOTAL: 58 servers
```

---

## 🚀 Quick Start

### Prerequisites
- Docker installed
- Docker Compose installed
- 4+ GB RAM available
- 20+ GB disk space

### Installation

1. **Navigate to healnode folder:**
```bash
cd D:\Downloads\c04\healnode
```

2. **Check files exist:**
```bash
dir
# Should show:
# Dockerfile
# docker-compose.yml
# server_simulator.py
# healnode_config.yaml
# README.md
```

3. **Start all containers:**
```bash
docker-compose up -d
```

4. **Wait for PostgreSQL to be healthy:**
```bash
docker-compose logs postgres
# Look for: "database system is ready to accept connections"
```

5. **Check container status:**
```bash
docker-compose ps
# All 59 containers should be "running"
```

---

## 📊 Monitoring Events

### View Events in Real-time

**Connect to PostgreSQL:**
```bash
psql -h localhost -U c04 -d c04_events -p 5432
```
Password: `secure_password`

**Check server_events table:**
```sql
SELECT * FROM server_events LIMIT 10;
```

**Count events by server:**
```sql
SELECT server_id, COUNT(*) as event_count 
FROM server_events 
GROUP BY server_id 
ORDER BY event_count DESC;
```

**View latest events:**
```sql
SELECT timestamp, server_id, event_type, floor, department 
FROM server_events 
ORDER BY timestamp DESC 
LIMIT 20;
```

---

## 🔧 Container Management

### View logs from specific server:
```bash
docker-compose logs finance-server-f2-01 -f
```

### View all logs (follow mode):
```bash
docker-compose logs -f
```

### Stop all containers:
```bash
docker-compose down
```

### Stop and remove volumes (clean slate):
```bash
docker-compose down -v
```

### Restart a specific server:
```bash
docker-compose restart finance-server-f2-01
```

### Scale containers (if needed):
```bash
docker-compose up -d --scale core-server-f9=8
```

---

## 🐛 Troubleshooting

### PostgreSQL connection failed
- Wait 30-60 seconds for PostgreSQL to start
- Check: `docker-compose logs postgres`
- Verify port 5432 is not in use: `netstat -an | findstr 5432`

### Containers not starting
- Check Docker daemon running: `docker ps`
- Rebuild images: `docker-compose build --no-cache`
- Check disk space: `docker system df`

### High CPU/Memory usage
- Reduce event generation frequency in `server_simulator.py`
- Run fewer containers: Edit `docker-compose.yml` and comment out services
- Increase Docker resource limits

### Database table doesn't exist
- Connect to PostgreSQL
- Create table manually:
```sql
CREATE TABLE server_events (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP,
  server_id VARCHAR(50),
  floor INTEGER,
  department VARCHAR(50),
  event_type VARCHAR(50),
  event_data JSONB,
  security_level VARCHAR(20)
);
```

---

## 📈 Performance Metrics

**Expected behavior:**
- 58 containers running = ~58 event streams
- Event generation: 1 event per 5-15 seconds per server
- Total events/second: ~4-12 events/sec (58 servers × random interval)
- Database inserts: ~240-720 rows/minute
- Memory per container: ~150-200 MB
- Total memory: ~9-12 GB (58 × 200 MB)

---

## 🔐 Security Notes

⚠️ **Default credentials (for testing only):**
- PostgreSQL User: `c04`
- PostgreSQL Password: `secure_password`
- Database: `c04_events`

**Change credentials in production:**
1. Update `.env` file (create if doesn't exist)
2. Update `docker-compose.yml` environment variables
3. Rebuild and restart containers

---

## 📡 Integration with C-04

HealNode sends events to the **same PostgreSQL database** as LabMon Simulator:
- **LabMon events:** Device-level network activity (laptops, desktops)
- **HealNode events:** Server-level activity (databases, services, logins)

**C-04 engine correlates both** to detect:
- Lateral movement (device → server)
- Privilege escalation
- Data exfiltration
- Unauthorized access

---

## 🛑 Cleanup

To completely remove all containers and data:
```bash
docker-compose down -v
docker rmi $(docker images -q)
```

---

## 📞 Support

For issues:
1. Check logs: `docker-compose logs <service-name>`
2. Verify Docker installation: `docker --version`
3. Check PostgreSQL: `docker-compose logs postgres`
4. Review `server_simulator.py` for event generation logic

---

**Last Updated:** August 25, 2026
**Version:** 1.0
**Total Servers Monitored:** 58