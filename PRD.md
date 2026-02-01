# Product Requirements Document (PRD)
# DeltaQuad Fleet Manager (Evo Series)

---

## 1. Project Background & Objectives

### 1.1 Overview
Currently, DeltaQuad's internal departments (R&D, Training, Marketing) lack a unified platform for UAV asset management. This has led to unclear asset status, scheduling conflicts, and an inability to trace historical hardware configurations for test data analysis.

### 1.2 Core Objectives
This project aims to build a unified yet permission-isolated management system to achieve:

- **Asset Integration:** A single database for all departments with automatic UI segregation.
- **Data Integrity:** Implementation of "Hardware Snapshots" to ensure every test mission is linked to the exact drone configuration at that time.
- **Operational Flexibility:** Adoption of a "Soft Lock" conflict mechanism to preserve collaboration agility for R&D teams.

---

## 2. User Roles & Permissions Strategy

The system utilizes **Row Level Security (RLS)** to enforce data isolation at the database layer. No manual frontend filtering is required.

---

## 3. Functional Specifications

### 3.1 Dashboard & Vehicle List
- **Auto-Filtering:** Upon login, the system automatically loads the vehicle list based on the user's profile department.
  - **R&D User** logs in → Sees all R&D + Training vehicles.
  - **Marketing User** logs in → Sees Marketing vehicles only.
- **Status Indicators:** Real-time display of vehicle status (Ready, Maintenance, In-Use) and a summary of core hardware.

### 3.2 Booking System
**Required Fields:**
- **Project Name:** Text input (displayed on Calendar).
- **Risk Level:** Dropdown (Low / Medium / High).
- **Location:** Free Text input (e.g., "Lab", "Outdoor Field", "Customer Site").

**Conflict Resolution Logic (Soft Lock):**
- **Trigger:** When Vehicle ID + Time Slot overlaps with an existing booking.
- **System Behavior:** The system DOES NOT BLOCK the submission. Instead, it triggers a **Warning Toast:** "This slot is already booked by [Project Name]. Please coordinate with the owner." The user is allowed to proceed and confirm the booking.

**Hardware Snapshotting:**
- **Critical Logic:** On the exact moment of booking creation (INSERT), the backend must automatically copy the vehicle's current `hw_config` (JSON) and save it permanently into the booking record as `snapshotted_hw_config`.

### 3.3 General Calendar
- **View Mode:** Monthly View, must include **Week Numbers (ISO 8601)**.
- **Content:** Aggregates all bookings visible to the current user.
- **Conflict Visualization:** If multiple bookings overlap on the same day (Soft Lock scenario), event bars must be **stacked vertically** to indicate resource contention.

### 3.4 Vehicle Hardware Editor
- **Data Structure:** Stored as **JSONB** to allow schema flexibility.
- **Interface:** A flexible Key-Value editor or JSON input field to allow R&D engineers to input non-standard hardware (e.g., experimental Payloads, 5G Dongles) without requiring database schema migrations.

---

## 4. Database Schema Requirements

The system is built on **Supabase (PostgreSQL)**. The schema changes required:

### A. Profiles (User Management)
Extend the Auth table to define department affiliation.

```sql
ALTER TABLE profiles
ADD COLUMN department text DEFAULT 'R&D'
CHECK (department IN ('R&D', 'Training', 'Marketing'));
```

### B. Vehicles (Asset Table)
Add department ownership and flexible hardware storage.

```sql
ALTER TABLE vehicles
ADD COLUMN department text DEFAULT 'R&D',
ALTER COLUMN hw_config TYPE jsonb USING hw_config::jsonb;
```

### C. Bookings (Mission Table)
Add mission details and the snapshot field.

```sql
ALTER TABLE bookings
ADD COLUMN project_name text NOT NULL,
ADD COLUMN risk_level text CHECK (risk_level IN ('Low', 'Medium', 'High')),
ADD COLUMN location text NOT NULL,
ADD COLUMN snapshotted_hw_config jsonb;  -- Stores the historical snapshot
```

---

## 5. Acceptance Criteria (UAT)

| Test | Description |
|------|-------------|
| **Isolation Test** | Log in as a Marketing user. Verify that NO R&D or Training vehicles are visible. |
| **Shared Pool Test** | Log in as an R&D user. Verify that Training vehicles are visible and bookable. |
| **Snapshot Test** | 1) Change Vehicle A's battery to "Battery-Old". 2) Create Booking X. 3) Change Vehicle A's battery to "Battery-New". **Result:** Inspect Booking X. The data must show "Battery-Old". |
| **Conflict Test** | Attempt to book a vehicle at the same time as an existing booking. The system should display a warning but allow the submission to succeed. |

---

*Document Version: 1.0 | DeltaQuad Fleet Manager (Evo Series)*
