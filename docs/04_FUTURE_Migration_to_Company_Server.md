# Migration Plan: Supabase to Company Server

**Document Version:** 1.0  
**Created:** February 4, 2026  
**Status:** Planning Phase  
**Expected Timeline:** 3-4 weeks

---

## Executive Summary

This document outlines the complete migration strategy for transitioning the DeltaQuad Fleet Dashboard from Supabase Cloud to an on-premise company server infrastructure. The migration will ensure data integrity, maintain system functionality, and establish a self-hosted PostgreSQL database with custom authentication.

---

## 1. Migration Overview

### 1.1 Current Architecture
```
Frontend (Vercel/Company Server)
    ↓
Supabase Cloud
    ├── Auth (Google OAuth + Email/Password)
    ├── PostgreSQL Database
    ├── Row Level Security (RLS)
    └── Real-time subscriptions
```

### 1.2 Target Architecture
```
Frontend (Company Server)
    ↓
Company Backend API (Node.js + Express)
    ├── JWT Authentication
    ├── PostgreSQL Database (Self-hosted)
    ├── Custom Authorization Logic
    └── RESTful API Endpoints
```

### 1.3 Key Objectives
- ✅ Zero data loss during migration
- ✅ Maintain backward compatibility during transition
- ✅ Implement robust authentication system
- ✅ Ensure data sovereignty (all data on company servers)
- ✅ Permanent data retention (soft delete only)

---

## 2. Technical Stack Selection

### 2.1 Recommended Technology Stack ⭐

**Database:**
- **PostgreSQL 15+** (100% compatible with Supabase)
- **JSONB support** for hardware configurations
- **Full-text search** capabilities
- **Proven enterprise reliability**

**Backend API:**
- **Node.js 18+** with Express/Fastify
- **JWT** for stateless authentication
- **bcrypt** for password hashing
- **pg (node-postgres)** for database connection

**Deployment:**
- **Docker & Docker Compose** for containerization
- **Nginx** as reverse proxy and SSL termination
- **Let's Encrypt** for SSL certificates
- **Ubuntu Server 22.04 LTS** (or company standard OS)

**Monitoring & Backup:**
- **Prometheus + Grafana** for metrics
- **pg_dump** for automated daily backups
- **Logrotate** for log management

### 2.2 Alternative: Supabase Self-Hosted

**Pros:**
- Minimal code changes required
- Retains all Supabase features (Realtime, Auth, Storage)
- Open-source and free

**Cons:**
- Higher resource requirements (4GB+ RAM)
- More complex to maintain
- Vendor lock-in (architecture dependency)

**Recommendation:** Use custom Node.js API for maximum flexibility and lower resource usage.

---

## 3. Hardware Requirements

### 3.1 Minimum Configuration (< 50 users)
```
CPU:     4 cores (x86_64)
RAM:     8GB
Storage: 100GB SSD
Network: 100Mbps
OS:      Ubuntu Server 22.04 LTS
```

### 3.2 Recommended Configuration (50-200 users)
```
CPU:     8 cores (x86_64)
RAM:     16GB
Storage: 500GB SSD (RAID 1 for redundancy)
Network: 1Gbps
Backup:  External NAS or cloud backup storage
```

### 3.3 Network Requirements
- **Firewall Rules:**
  - Port 443 (HTTPS) - Open to internal network
  - Port 80 (HTTP) - Redirect to 443
  - Port 5432 (PostgreSQL) - Localhost only (NOT exposed)
  - Port 3000 (Backend API) - Localhost only (behind Nginx)

---

## 4. Migration Phases

### Phase 1: Environment Setup (Days 1-3)

#### 4.1.1 Install Docker & Docker Compose
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

#### 4.1.2 Create Project Structure
```bash
mkdir -p /opt/deltaquad-fleet
cd /opt/deltaquad-fleet

mkdir -p {backend,frontend,nginx,backups,logs}
mkdir -p backend/{src,migrations,scripts}
```

#### 4.1.3 Docker Compose Configuration
Create `/opt/deltaquad-fleet/docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: dq_postgres
    restart: always
    environment:
      POSTGRES_DB: deltaquad_fleet
      POSTGRES_USER: dq_admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
      - ./migrations:/docker-entrypoint-initdb.d
    ports:
      - "127.0.0.1:5432:5432"
    networks:
      - dq_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dq_admin -d deltaquad_fleet"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    container_name: dq_backend
    restart: always
    environment:
      DATABASE_URL: postgresql://dq_admin:${DB_PASSWORD}@postgres:5432/deltaquad_fleet
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 7d
      NODE_ENV: production
      PORT: 3000
    volumes:
      - ./logs:/app/logs
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - dq_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./frontend
    container_name: dq_frontend
    restart: always
    environment:
      VITE_API_URL: /api
    volumes:
      - ./frontend/dist:/usr/share/nginx/html
    networks:
      - dq_network

  nginx:
    image: nginx:alpine
    container_name: dq_nginx
    restart: always
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
      - frontend
    networks:
      - dq_network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
    driver: local

networks:
  dq_network:
    driver: bridge
```

#### 4.1.4 Environment Variables
Create `/opt/deltaquad-fleet/.env`:

```bash
# Database
DB_PASSWORD=<GENERATE_STRONG_PASSWORD>

# JWT
JWT_SECRET=<GENERATE_RANDOM_STRING_64_CHARS>

# Admin Email (for initial setup)
ADMIN_EMAIL=admin@deltaquad.com
ADMIN_PASSWORD=<GENERATE_STRONG_PASSWORD>
```

**Security Note:** Generate strong passwords using:
```bash
openssl rand -base64 32
```

---

### Phase 2: Database Migration (Days 4-6)

#### 4.2.1 Export Data from Supabase

**Method A: Using Supabase CLI (Recommended)**
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to project
supabase link --project-ref <your-project-ref>

# Export schema
supabase db dump --schema public > exports/schema.sql

# Export data
supabase db dump --data-only --schema public > exports/data.sql

# Export auth users (if accessible)
supabase db dump --schema auth --data-only > exports/auth.sql
```

**Method B: Manual PostgreSQL Dump**
```bash
# Get connection string from Supabase Dashboard
# Settings > Database > Connection string

pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  --schema=public \
  --no-owner \
  --no-acl \
  -f exports/full_backup.sql
```

**Method C: CSV Export (Most Reliable)**
Execute in Supabase SQL Editor:

```sql
-- Export Profiles
COPY (SELECT * FROM profiles ORDER BY id) TO STDOUT WITH CSV HEADER;
-- Save output as profiles.csv

-- Export Vehicles
COPY (SELECT * FROM vehicles ORDER BY id) TO STDOUT WITH CSV HEADER;
-- Save output as vehicles.csv

-- Export Bookings
COPY (SELECT * FROM bookings ORDER BY created_at) TO STDOUT WITH CSV HEADER;
-- Save output as bookings.csv

-- Export Activities
COPY (SELECT * FROM activities ORDER BY created_at) TO STDOUT WITH CSV HEADER;
-- Save output as activities.csv

-- Export Change Logs (if exists)
COPY (SELECT * FROM change_logs ORDER BY created_at) TO STDOUT WITH CSV HEADER;
-- Save output as change_logs.csv
```

#### 4.2.2 Database Schema Creation

Create `/opt/deltaquad-fleet/migrations/01_schema.sql`:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create auth schema (minimal, for user credentials)
CREATE SCHEMA IF NOT EXISTS auth;

-- Auth Users table (simplified)
CREATE TABLE auth.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  encrypted_password text NOT NULL,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  role text DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
  department text DEFAULT 'R&D' CHECK (department IN ('R&D', 'Training', 'Marketing')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vehicles table
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'Available',
  type text DEFAULT 'uav' CHECK (type IN ('uav', 'ugv', 'usv')),
  hw_config jsonb DEFAULT '{}'::jsonb,
  sw_version text,
  image_url text,
  notes text,
  department text DEFAULT 'R&D' CHECK (department IN ('R&D', 'Training', 'Marketing')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL
);

-- Bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  pilot_name text NOT NULL,
  project_name text NOT NULL,
  risk_level text CHECK (risk_level IN ('Low', 'Medium', 'High')),
  location text,
  duration text,
  notes text,
  who_ordered text,
  status text DEFAULT 'confirmed',
  snapshotted_hw_config jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL
);

-- Activities table
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL CHECK (action_type IN ('status_change', 'comment', 'booking', 'upload', 'login', 'edit', 'delete')),
  content text,
  created_at timestamptz DEFAULT now()
);

-- Change Logs table (NEW - for audit trail)
CREATE TABLE public.change_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  user_display_name text,
  entity_type text NOT NULL CHECK (entity_type IN ('vehicle', 'booking', 'profile')),
  entity_id uuid NOT NULL,
  entity_name text,
  action_type text NOT NULL CHECK (action_type IN ('create', 'update', 'delete')),
  before_snapshot jsonb,
  after_snapshot jsonb,
  changed_fields jsonb,
  notes text,
  ip_address text
);

-- Indexes for performance
CREATE INDEX idx_vehicles_department ON vehicles(department) WHERE deleted_at IS NULL;
CREATE INDEX idx_vehicles_status ON vehicles(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_vehicles_name ON vehicles(name);

CREATE INDEX idx_bookings_vehicle_id ON bookings(vehicle_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_user_id ON bookings(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_dates ON bookings(start_time, end_time) WHERE deleted_at IS NULL;

CREATE INDEX idx_activities_vehicle_id ON activities(vehicle_id);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

CREATE INDEX idx_change_logs_entity ON change_logs(entity_type, entity_id);
CREATE INDEX idx_change_logs_user ON change_logs(user_id);
CREATE INDEX idx_change_logs_created ON change_logs(created_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auth_users_updated_at BEFORE UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 4.2.3 Data Migration Script

Create `/opt/deltaquad-fleet/backend/scripts/migrate-data.js`:

```javascript
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Source: Supabase
const supabasePool = new Pool({
  connectionString: process.env.SUPABASE_CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
});

// Target: Company Server
const localPool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrateData() {
  console.log('🚀 Starting data migration...\n');
  
  const client = await localPool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Migrate Auth Users & Profiles
    console.log('📊 Migrating users and profiles...');
    const usersResult = await supabasePool.query(`
      SELECT u.id, u.email, u.encrypted_password, u.email_confirmed_at, u.last_sign_in_at,
             p.display_name, p.role, p.department, p.avatar_url
      FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
    `);
    
    for (const user of usersResult.rows) {
      // Insert auth user
      await client.query(`
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, last_sign_in_at, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          encrypted_password = EXCLUDED.encrypted_password,
          last_sign_in_at = EXCLUDED.last_sign_in_at
      `, [user.id, user.email, user.encrypted_password, user.email_confirmed_at, user.last_sign_in_at]);
      
      // Insert profile
      await client.query(`
        INSERT INTO public.profiles (id, email, display_name, role, department, avatar_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          display_name = EXCLUDED.display_name,
          role = EXCLUDED.role,
          department = EXCLUDED.department,
          avatar_url = EXCLUDED.avatar_url
      `, [user.id, user.email, user.display_name, user.role || 'viewer', 
          user.department || 'R&D', user.avatar_url]);
    }
    console.log(`   ✅ Migrated ${usersResult.rows.length} users\n`);
    
    // 2. Migrate Vehicles
    console.log('🚁 Migrating vehicles...');
    const vehiclesResult = await supabasePool.query('SELECT * FROM public.vehicles');
    
    for (const vehicle of vehiclesResult.rows) {
      await client.query(`
        INSERT INTO public.vehicles 
        (id, name, status, type, hw_config, sw_version, image_url, notes, department, created_at, deleted_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          status = EXCLUDED.status,
          hw_config = EXCLUDED.hw_config,
          sw_version = EXCLUDED.sw_version,
          notes = EXCLUDED.notes,
          department = EXCLUDED.department
      `, [
        vehicle.id, vehicle.name, vehicle.status, vehicle.type || 'uav',
        vehicle.hw_config || {}, vehicle.sw_version, vehicle.image_url,
        vehicle.notes, vehicle.department || 'R&D', vehicle.created_at,
        vehicle.deleted_at
      ]);
    }
    console.log(`   ✅ Migrated ${vehiclesResult.rows.length} vehicles\n`);
    
    // 3. Migrate Bookings
    console.log('📅 Migrating bookings...');
    const bookingsResult = await supabasePool.query('SELECT * FROM public.bookings');
    
    for (const booking of bookingsResult.rows) {
      await client.query(`
        INSERT INTO public.bookings 
        (id, vehicle_id, user_id, start_time, end_time, pilot_name, project_name,
         risk_level, location, duration, notes, who_ordered, status, 
         snapshotted_hw_config, created_at, deleted_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO NOTHING
      `, [
        booking.id, booking.vehicle_id, booking.user_id, booking.start_time,
        booking.end_time, booking.pilot_name, booking.project_name,
        booking.risk_level, booking.location, booking.duration, booking.notes,
        booking.who_ordered, booking.status || 'confirmed',
        booking.snapshotted_hw_config, booking.created_at, booking.deleted_at
      ]);
    }
    console.log(`   ✅ Migrated ${bookingsResult.rows.length} bookings\n`);
    
    // 4. Migrate Activities
    console.log('📝 Migrating activities...');
    const activitiesResult = await supabasePool.query('SELECT * FROM public.activities ORDER BY created_at');
    
    for (const activity of activitiesResult.rows) {
      await client.query(`
        INSERT INTO public.activities 
        (id, vehicle_id, user_id, action_type, content, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [
        activity.id, activity.vehicle_id, activity.user_id,
        activity.action_type, activity.content, activity.created_at
      ]);
    }
    console.log(`   ✅ Migrated ${activitiesResult.rows.length} activities\n`);
    
    // 5. Migrate Change Logs (if exists)
    try {
      console.log('📋 Migrating change logs...');
      const logsResult = await supabasePool.query('SELECT * FROM public.change_logs ORDER BY created_at');
      
      for (const log of logsResult.rows) {
        await client.query(`
          INSERT INTO public.change_logs 
          (id, created_at, user_id, user_email, user_display_name, entity_type,
           entity_id, entity_name, action_type, before_snapshot, after_snapshot,
           changed_fields, notes, ip_address)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO NOTHING
        `, [
          log.id, log.created_at, log.user_id, log.user_email, log.user_display_name,
          log.entity_type, log.entity_id, log.entity_name, log.action_type,
          log.before_snapshot, log.after_snapshot, log.changed_fields,
          log.notes, log.ip_address
        ]);
      }
      console.log(`   ✅ Migrated ${logsResult.rows.length} change logs\n`);
    } catch (err) {
      console.log('   ⚠️  Change logs table does not exist yet (skipping)\n');
    }
    
    await client.query('COMMIT');
    console.log('✨ Migration completed successfully!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function verifyMigration() {
  console.log('🔍 Verifying data integrity...\n');
  
  const tables = ['profiles', 'vehicles', 'bookings', 'activities'];
  
  for (const table of tables) {
    const supabaseCount = await supabasePool.query(`SELECT COUNT(*) FROM public.${table}`);
    const localCount = await localPool.query(`SELECT COUNT(*) FROM public.${table}`);
    
    const supabaseNum = parseInt(supabaseCount.rows[0].count);
    const localNum = parseInt(localCount.rows[0].count);
    
    if (supabaseNum === localNum) {
      console.log(`   ✅ ${table}: ${localNum} rows (match)`);
    } else {
      console.error(`   ❌ ${table}: Supabase=${supabaseNum}, Local=${localNum} (MISMATCH!)`);
    }
  }
  
  console.log('\n✨ Verification complete!\n');
}

// Main execution
(async () => {
  try {
    await migrateData();
    await verifyMigration();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await supabasePool.end();
    await localPool.end();
  }
})();
```

**Run migration:**
```bash
cd /opt/deltaquad-fleet/backend
npm install pg bcrypt dotenv

# Set environment variables
export SUPABASE_CONNECTION_STRING="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
export DATABASE_URL="postgresql://dq_admin:PASSWORD@localhost:5432/deltaquad_fleet"

# Execute migration
node scripts/migrate-data.js
```

---

### Phase 3: Backend API Development (Days 7-12)

#### 4.3.1 Project Structure
```
backend/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── users.controller.js
│   │   ├── vehicles.controller.js
│   │   ├── bookings.controller.js
│   │   ├── activities.controller.js
│   │   └── changeLogs.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── users.service.js
│   │   ├── vehicles.service.js
│   │   ├── bookings.service.js
│   │   └── changeLogs.service.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── errorHandler.middleware.js
│   │   └── logger.middleware.js
│   ├── db/
│   │   └── pool.js
│   ├── utils/
│   │   ├── jwt.utils.js
│   │   ├── password.utils.js
│   │   └── logger.js
│   ├── routes/
│   │   └── index.js
│   └── app.js
├── Dockerfile
├── package.json
└── .env
```

#### 4.3.2 Core Authentication Implementation

See detailed code in separate implementation document.

---

### Phase 4: Frontend Migration (Days 13-16)

#### 4.4.1 API Client Abstraction

Create new API client to replace Supabase calls (detailed code in implementation doc).

#### 4.4.2 Environment Configuration

```bash
# .env.production
VITE_API_URL=https://fleet.deltaquad.com/api
VITE_ENVIRONMENT=production
```

---

### Phase 5: Deployment & Cutover (Days 17-21)

#### 4.5.1 Parallel Running Strategy

**Week 1-2: Dual System Testing**
- Supabase remains primary
- Company server runs in parallel
- Internal team tests new system
- Data sync runs hourly (bidirectional)

**Week 3: Gradual Cutover**
- Day 15-17: 25% of users to new system
- Day 18-19: 75% of users to new system
- Day 20: 100% cutover
- Supabase kept as backup for 30 days

#### 4.5.2 Rollback Plan

If critical issues arise:
1. Update frontend `.env` to point back to Supabase
2. Rebuild and redeploy frontend
3. Sync data back from company server to Supabase
4. Investigate issues before retry

---

## 5. Data Backup Strategy

### 5.1 Automated Daily Backups
```bash
# Create backup script
cat > /opt/deltaquad-fleet/scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/deltaquad-fleet/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="deltaquad_fleet_${TIMESTAMP}.sql"

# Perform backup
docker exec dq_postgres pg_dump -U dq_admin deltaquad_fleet > "${BACKUP_DIR}/${BACKUP_FILE}"

# Compress
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

# Keep only last 30 days
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
EOF

chmod +x /opt/deltaquad-fleet/scripts/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/deltaquad-fleet/scripts/backup.sh") | crontab -
```

### 5.2 Continuous Backup (WAL Archiving)
```sql
-- Enable WAL archiving in postgresql.conf
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'cp %p /backups/wal_archive/%f';
```

---

## 6. Monitoring & Maintenance

### 6.1 Health Checks
- Database connection pool status
- API response times
- Disk space usage
- CPU and memory utilization

### 6.2 Log Retention
- Application logs: 90 days
- Access logs: 180 days
- Database logs: 30 days
- Backup logs: 1 year

---

## 7. Security Considerations

### 7.1 SSL/TLS Configuration
- Use Let's Encrypt for free SSL certificates
- Enforce HTTPS only (redirect HTTP to HTTPS)
- Use strong cipher suites

### 7.2 Database Security
- PostgreSQL accessible only from localhost
- Strong password policies (16+ characters)
- Regular security updates

### 7.3 API Security
- JWT tokens expire after 7 days
- Rate limiting: 100 requests per minute per IP
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)

---

## 8. Cost Analysis

### 8.1 Supabase Current Cost
- **Pro Plan:** $25/month = $300/year
- **Additional storage/bandwidth:** Variable

### 8.2 Self-Hosted Cost
- **Hardware:** One-time or existing infrastructure
- **Electricity:** ~$50/year (100W server)
- **Software:** $0 (all open-source)
- **Maintenance:** Internal IT staff (existing)

**Total Savings:** ~$250-300/year + data sovereignty

---

## 9. Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data loss during migration | Low | Critical | Triple backup before migration, verify checksums |
| Authentication issues | Medium | High | Parallel testing for 2 weeks, rollback plan ready |
| Performance degradation | Low | Medium | Load testing before cutover, monitor metrics |
| User access issues | Medium | Medium | Keep Supabase active as backup for 30 days |
| Hardware failure | Low | High | RAID storage, daily backups, disaster recovery plan |

---

## 10. Success Criteria

### Migration Completion Checklist
- [ ] All data migrated with zero loss (verified by checksum)
- [ ] All users can authenticate successfully
- [ ] All features functional (vehicles, bookings, profiles)
- [ ] Performance meets SLA (< 500ms API response)
- [ ] Backups running automatically
- [ ] Monitoring dashboards operational
- [ ] Documentation updated
- [ ] Team trained on new system
- [ ] Rollback plan tested and ready
- [ ] 30-day observation period passed without critical issues

---

## 11. Timeline Summary

```
Week 1: Environment setup, database migration prep
Week 2: Data migration, backend API development
Week 3: Frontend migration, integration testing
Week 4: Deployment, parallel running, gradual cutover
Week 5+: Monitoring, optimization, Supabase decommission
```

---

## 12. Contact & Support

**Migration Team:**
- Backend Lead: TBD
- Frontend Lead: TBD
- DevOps: TBD
- Project Manager: TBD

**Emergency Rollback Contact:** [Emergency contact info]

---

**Document End**

*This is a living document and will be updated as the migration progresses.*
