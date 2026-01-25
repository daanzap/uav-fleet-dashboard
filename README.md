# DeltaQuad Fleet Manager (Evo Series)

> **Version:** 2.3 (Final Build)
> **Status:** Active Development
> **Stack:** React (Vite) + Supabase (PostgreSQL)

## 📖 Overview

A unified UAV asset management and reservation system designed for DeltaQuad's internal operations. The system solves the issue of asset isolation between departments while preserving critical R&D history through hardware snapshotting.

## 🏗 System Architecture

### 1. Department Isolation Strategy
The system uses **Row Level Security (RLS)** to manage asset visibility automatically:
* **Technical Pool (Shared Access):** R&D (Pilots & Engineers) and Training departments share a unified pool of vehicles. They can view and book each other's assets.
* **Marketing (Isolated):** The Marketing department operates in a silo. They can only view and book Marketing-designated assets.
* **Admin:** Full visibility across all departments.

### 2. Conflict Resolution (Soft Lock)
We prioritize collaboration over rigid constraints.
* **Logic:** The system **NEVER blocks** a booking due to time conflict.
* **Behavior:** If a conflict is detected (Same Vehicle + Overlapping Time), the system displays a **Warning Toast**, asking the user to coordinate with the existing booker.

### 3. Data Integrity (Hardware Snapshots)
To ensure historical accuracy in test reports:
* **Mechanism:** When a booking is created, the system captures a **Snapshot** of the vehicle's current Hardware Configuration (JSON).
* **Result:** Viewing a past booking shows the drone's configuration *at that specific moment*, not its current state.

---

## 🗄 Database Schema (Supabase)

### A. Profiles (Users)
Extends the default Auth table.
- `id`: UUID (FK)
- `department`: Text (Enum: `'R&D'`, `'Training'`, `'Marketing'`)
- `role`: Text (`'admin'`, `'user'`)

### B. Vehicles (Assets)
- `id`: UUID
- `name`: Text
- `status`: Text (`'Ready'`, `'Maintenance'`, etc.)
- `department`: Text (Assets are tagged `'R&D'`, `'Training'`, or `'Marketing'`)
- `hw_config`: **JSONB** (Flexible schema for evolving hardware)

**Example JSONB Structure:**
```json
{
  "skynode_id": "SN-1024",
  "gps": "Here3",
  "battery": "SolidState-22Ah",
  "custom_modules": { "payload": "Sony A7R" }
}
```

### C. Bookings (Missions)
- `vehicle_id`: UUID
- `project_name`: **Text (Required)** - Displayed on Calendar
- `risk_level`: Text (`'Low'`, `'Medium'`, `'High'`)
- `location`: **Free Text** (e.g., "Lab", "Outdoor", "Rooftop")
- `snapshotted_hw_config`: **JSONB** (Copy of vehicle config at insert time)

---

## 💻 Frontend Specifications

### 1. Dashboard (Vehicle List)
* **No Manual Filtering:** The top-level "Department Switcher" is removed.
* **Auto-Filter:** The list automatically renders vehicles the user is permitted to see based on RLS policies.
    * *R&D / Training User* sees: R&D + Training Vehicles.
    * *Marketing User* sees: Marketing Vehicles only.

### 2. Booking Modal
* **Inputs:**
    * Project Name (Required)
    * Risk Level (Dropdown)
    * Location (Free Text Input)
    * Date & Duration
* **Conflict Logic:** Real-time check. Overlaps trigger a yellow warning UI but keep the "Confirm" button active.

### 3. General Calendar
* **View:** Monthly view with **Week Numbers**.
* **Content:** Aggregates all bookings visible to the user.
* **Visualization:** Stacked bars for overlapping events (to visualize resource contention).

### 4. Vehicle Editor
* **Hardware Config:** Flexible Key-Value input or JSON editor to allow R&D to input non-standard hardware without schema migrations.

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+
* Supabase Project

### Installation

```bash
# 1. Clone the repo
git clone [repo-url]

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

### Database Migration
Run the SQL scripts located in `/db` to set up the tables and RLS policies.

```sql
-- RLS Policy Example for Technical Pool
CREATE POLICY "Tech Pool Visibility" ON vehicles
FOR SELECT USING (
  (auth.jwt() ->> 'department' IN ('R&D', 'Training')) 
  AND 
  (department IN ('R&D', 'Training'))
);
```
