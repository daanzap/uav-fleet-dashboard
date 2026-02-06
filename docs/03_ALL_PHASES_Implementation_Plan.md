# Implementation Plan & TODO List

**Document Version:** 1.0  
**Date:** February 4, 2026  
**Status:** Ready to Execute

---

## Overview

This document provides a step-by-step implementation plan with separate TODO items that can be executed in different conversation threads.

**Total Estimated Time:** 40-50 hours  
**Phases:** 5 main phases + 1 pre-implementation phase

---

## Phase 0: Pre-Implementation (CRITICAL - DO FIRST)

**Estimated Time:** 2-3 hours  
**Can be done in:** 1 conversation thread

### TODO-0.1: Database Backup
**Priority:** 🔴 CRITICAL  
**Conversation Title:** "Create Database Backup"

**Tasks:**
1. Go to Supabase Dashboard → Database → Backups
2. Create manual backup
3. Download backup file
4. Store in safe location
5. Verify backup integrity

**Acceptance Criteria:**
- [ ] Backup file downloaded successfully
- [ ] Backup file size is reasonable (> 1MB)
- [ ] Can view backup contents

---

### TODO-0.2: Execute Seven Vehicles SQL Script
**Priority:** 🔴 CRITICAL  
**Conversation Title:** "Fix Seven Vehicles Display"

**Tasks:**
1. Read `db/08_vehicles_seven_names.sql`
2. Go to Supabase SQL Editor
3. Execute the script
4. Verify result: `SELECT name FROM vehicles ORDER BY name;`
5. Should return exactly 7 rows

**Acceptance Criteria:**
- [ ] Exactly 7 vehicles in database
- [ ] Names match ALLOWED_VEHICLE_NAMES in constants.js
- [ ] All vehicles visible on Dashboard

**Dependencies:** None  
**Blocks:** Phase 1 (cannot fix bugs until vehicles exist)

---

### TODO-0.3: Remove Risk Level from Vehicles Table
**Priority:** 🔴 CRITICAL  
**Conversation Title:** "Remove Vehicle Risk Level Column"

**Tasks:**
1. Backup database (if not done in TODO-0.1)
2. Execute in Supabase SQL Editor:
```sql
ALTER TABLE vehicles DROP COLUMN IF EXISTS risk_level;
```
3. Verify column removed: `\d vehicles` or check table structure
4. Update EditVehicleModal.jsx to remove Risk Level field

**Acceptance Criteria:**
- [ ] risk_level column removed from vehicles table
- [ ] EditVehicleModal no longer shows Risk Level
- [ ] BookingModal still has Risk Level (unchanged)
- [ ] No errors in console

**Dependencies:** TODO-0.2  
**Files to Edit:**
- `src/components/EditVehicleModal.jsx`

---

### TODO-0.4: Add Soft Delete Columns
**Priority:** 🔴 CRITICAL  
**Conversation Title:** "Add Soft Delete Support"

**Tasks:**
1. Execute in Supabase SQL Editor:
```sql
-- Add deleted_at columns
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Update RLS policies to hide deleted records
DROP POLICY IF EXISTS "Vehicles are viewable by everyone." ON vehicles;
CREATE POLICY "Vehicles are viewable by everyone." ON vehicles
  FOR SELECT USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Bookings are viewable by everyone." ON bookings;
CREATE POLICY "Bookings are viewable by everyone." ON bookings
  FOR SELECT USING (deleted_at IS NULL);
```
2. Verify columns exist
3. Test: Set a vehicle's deleted_at to now() and verify it disappears from Dashboard

**Acceptance Criteria:**
- [ ] deleted_at columns added to both tables
- [ ] RLS policies updated
- [ ] Soft-deleted records hidden from UI
- [ ] No breaking changes to existing functionality

**Dependencies:** None  
**Blocks:** Phase 4 (delete functionality)

---

### TODO-0.5: Create Change Logs Table
**Priority:** 🟡 HIGH  
**Conversation Title:** "Create Audit Log Table"

**Tasks:**
1. Execute in Supabase SQL Editor:
```sql
CREATE TABLE IF NOT EXISTS change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_change_logs_entity ON change_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_change_logs_user ON change_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_change_logs_created ON change_logs(created_at DESC);

-- RLS
ALTER TABLE change_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Change logs are viewable by editors and admins" ON change_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin'))
  );

CREATE POLICY "Authenticated users can insert change logs" ON change_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```
2. Verify table created
3. Insert test record to verify permissions

**Acceptance Criteria:**
- [ ] change_logs table created successfully
- [ ] Indexes created
- [ ] RLS policies working
- [ ] Can insert test record

**Dependencies:** None  
**Blocks:** Phase 3 (audit logging)

---

## Phase 1: Bug Fixes

**Estimated Time:** 8-10 hours  
**Can be done in:** 4 separate conversation threads

---

### TODO-1.1: Fix Logo Display
**Priority:** 🟡 HIGH  
**Conversation Title:** "Fix DeltaQuad Logo Not Showing"

**Tasks:**
1. Verify `src/assets/logo.png` exists and is valid PNG file
2. Check browser console for 404 errors
3. Verify Header.jsx import statement (line 5)
4. Test logo in development mode
5. Test logo in production build
6. If still not working, try:
   - Move logo to `public/logo.png`
   - Update import to: `import logoSrc from '/logo.png'`

**Acceptance Criteria:**
- [ ] Logo displays correctly on Dashboard header
- [ ] No 404 errors in console
- [ ] Logo shows in both dev and prod builds
- [ ] Logo is properly sized (2rem height)

**Dependencies:** None  
**Files to Edit:**
- `src/components/Header.jsx` (potentially)
- `src/assets/logo.png` (verify integrity)

---

### TODO-1.2: Fix Vehicle Persistence Issue
**Priority:** 🔴 CRITICAL  
**Conversation Title:** "Fix Vehicles Disappearing After Save"

**Tasks:**
1. Review EditVehicleModal.jsx handleSubmit function
2. Ensure `onSave` callback is called after successful save (line 76)
3. Review Dashboard.jsx EditVehicleModal props
4. Ensure `onSave={fetchVehicles}` is passed (line 146)
5. Change vehicle name input to DROPDOWN instead of free text:
```javascript
<select name="name" value={formData.name} onChange={handleChange} required>
  <option value="">Select Vehicle</option>
  {ALLOWED_VEHICLE_NAMES.map(name => (
    <option key={name} value={name}>{name}</option>
  ))}
</select>
```
6. Test: Create new vehicle, save, verify it appears on Dashboard

**Acceptance Criteria:**
- [ ] Vehicles persist after save
- [ ] Dashboard refreshes automatically after save
- [ ] Vehicle name is selected from dropdown (not free text)
- [ ] Cannot create vehicles with invalid names
- [ ] onSave callback called successfully

**Dependencies:** TODO-0.2 (seven vehicles must exist first)  
**Files to Edit:**
- `src/components/EditVehicleModal.jsx`
- `src/pages/Dashboard.jsx`

---

### TODO-1.3: Remove Risk Level from EditVehicleModal UI
**Priority:** 🟡 HIGH  
**Conversation Title:** "Remove Risk Level from Vehicle Editor"

**Tasks:**
1. Open `src/components/EditVehicleModal.jsx`
2. Remove Risk Level from formData state (line 24)
3. Remove Risk Level form field (lines 133-142)
4. Remove risk_level from payload (line 53)
5. Test: Edit vehicle, verify no risk_level field shows
6. Test: Create new vehicle, verify no risk_level field shows
7. Test: Booking modal still has Risk Level (should be unchanged)

**Acceptance Criteria:**
- [ ] Risk Level field removed from EditVehicleModal
- [ ] No errors when saving vehicle
- [ ] BookingModal still shows Risk Level correctly
- [ ] Existing vehicles still work

**Dependencies:** TODO-0.3 (database column must be removed first)  
**Files to Edit:**
- `src/components/EditVehicleModal.jsx`

---

### TODO-1.4: Fix Profile Display Name Sync
**Priority:** 🟢 MEDIUM  
**Conversation Title:** "Fix Profile Nickname Synchronization"

**Tasks:**
1. Verify Profile.jsx updateDisplayName calls AuthContext.updateDisplayName (line 28)
2. Verify AuthContext updates displayName state (line 152)
3. Verify BookingModal uses displayName (line 17)
4. Test sequence:
   - Update nickname in Profile page
   - Create new booking
   - Verify "Who Ordered" shows updated nickname
5. Update CalendarOverviewModal to display user display names

**Acceptance Criteria:**
- [ ] Changing nickname in Profile updates immediately
- [ ] Booking "Who Ordered" shows current display name
- [ ] Calendar shows display names (not emails)
- [ ] No stale data

**Dependencies:** None  
**Files to Edit:**
- `src/contexts/AuthContext.jsx` (verify)
- `src/components/CalendarOverviewModal.jsx` (potentially)
- `src/pages/Profile.jsx` (verify)

---

## Phase 2: Core Function Adjustments

**Estimated Time:** 6-8 hours  
**Can be done in:** 2-3 separate conversation threads

---

### TODO-2.1: Update Department RLS Policies
**Priority:** 🟢 MEDIUM  
**Conversation Title:** "Implement Department-Based Access Control"

**Tasks:**
1. Read `db/06_department_rls.sql`
2. Execute script in Supabase SQL Editor
3. Test as R&D user: Should see R&D + Training vehicles
4. Test as Marketing user: Should see Marketing vehicles ONLY
5. Verify bookings respect department boundaries

**Acceptance Criteria:**
- [ ] Marketing users cannot see R&D vehicles
- [ ] R&D users can see Training vehicles (shared pool)
- [ ] Bookings follow same department rules
- [ ] Admin users can see everything

**Dependencies:** TODO-0.2 (vehicles must have correct departments)  
**Files to Edit:**
- None (database only)

**Database Scripts:**
- `db/06_department_rls.sql`

---

### TODO-2.2: Improve Conflict Warning UI
**Priority:** 🟢 LOW  
**Conversation Title:** "Enhance Booking Conflict Warning"

**Tasks:**
1. Open `src/components/BookingModal.jsx`
2. Update conflict warning styling (lines 315-319)
3. Make warning more prominent:
```jsx
<div className="booking-conflict-warning-prominent" role="alert">
  ⚠️ <strong>Scheduling Conflict!</strong>
  <br />
  This time slot is already booked by <strong>{conflictWarning.projectName}</strong>.
  <br />
  Please coordinate with the project owner before proceeding.
</div>
```
4. Add CSS for prominent warning
5. Test: Create overlapping booking, verify warning shows

**Acceptance Criteria:**
- [ ] Conflict warning is visually prominent
- [ ] Warning shows project name clearly
- [ ] User can still proceed (soft lock)
- [ ] Warning disappears when dates change

**Dependencies:** None  
**Files to Edit:**
- `src/components/BookingModal.jsx`
- `src/components/BookingModal.css`

---

### TODO-2.3: Add Week Numbers to Calendar
**Priority:** 🟢 LOW  
**Conversation Title:** "Add ISO Week Numbers to Calendar"

**Tasks:**
1. Open `src/components/CalendarOverviewModal.jsx`
2. Create function to calculate ISO week number:
```javascript
function getISOWeek(date) {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 4 - (target.getDay() || 7));
  const yearStart = new Date(target.getFullYear(), 0, 1);
  return Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
}
```
3. Add week number column to calendar grid
4. Style week numbers (grey, small font)
5. Test: Verify week numbers match ISO 8601 standard

**Acceptance Criteria:**
- [ ] Week numbers display on left side of calendar
- [ ] Week numbers follow ISO 8601 standard
- [ ] Styling is subtle and non-intrusive
- [ ] Week numbers update when month changes

**Dependencies:** None  
**Files to Edit:**
- `src/components/CalendarOverviewModal.jsx`
- `src/components/CalendarOverviewModal.css`

---

## Phase 3: Audit & Logging System

**Estimated Time:** 10-12 hours  
**Can be done in:** 2 separate conversation threads

---

### TODO-3.1: Implement Change Logging Helper
**Priority:** 🟡 HIGH  
**Conversation Title:** "Create Change Logging Utility"

**Tasks:**
1. Create new file: `src/lib/changeLogger.js`
2. Implement logging functions:
```javascript
export async function logChange({
  entityType,     // 'vehicle' | 'booking' | 'profile'
  entityId,       // UUID
  entityName,     // Display name
  actionType,     // 'create' | 'update' | 'delete'
  beforeData,     // Object (for update/delete)
  afterData,      // Object (for create/update)
  userId,         // Current user ID
  userEmail,      // Current user email
  displayName,    // Current user display name
  notes           // Optional notes
}) {
  // Calculate changed fields
  const changedFields = {};
  if (beforeData && afterData) {
    for (const key in afterData) {
      if (JSON.stringify(beforeData[key]) !== JSON.stringify(afterData[key])) {
        changedFields[key] = { old: beforeData[key], new: afterData[key] };
      }
    }
  }
  
  // Insert log
  await supabase.from('change_logs').insert({
    user_id: userId,
    user_email: userEmail,
    user_display_name: displayName,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    action_type: actionType,
    before_snapshot: beforeData,
    after_snapshot: afterData,
    changed_fields: changedFields,
    notes: notes || null
  });
}
```
3. Create unit tests
4. Test logging function with sample data

**Acceptance Criteria:**
- [ ] changeLogger.js created and tested
- [ ] Can log create/update/delete actions
- [ ] Changed fields calculated correctly
- [ ] No errors when logging

**Dependencies:** TODO-0.5 (change_logs table must exist)  
**Files to Create:**
- `src/lib/changeLogger.js`
- `src/lib/changeLogger.test.js`

---

### TODO-3.2: Add Change Logging to Vehicle Operations
**Priority:** 🟡 HIGH  
**Conversation Title:** "Log Vehicle Changes"

**Tasks:**
1. Import changeLogger in EditVehicleModal.jsx
2. Before UPDATE: Fetch current vehicle data
3. After UPDATE: Call logChange with before/after data
4. For CREATE: Log with afterData only
5. Test: Edit vehicle, verify log entry created
6. Verify logged data includes all fields

**Acceptance Criteria:**
- [ ] Vehicle creates logged
- [ ] Vehicle updates logged with before/after
- [ ] Logged data includes user info
- [ ] Changed fields correctly identified
- [ ] No performance impact

**Dependencies:** TODO-3.1  
**Files to Edit:**
- `src/components/EditVehicleModal.jsx`

---

### TODO-3.3: Add Change Logging to Booking Operations
**Priority:** 🟡 HIGH  
**Conversation Title:** "Log Booking Changes"

**Tasks:**
1. Import changeLogger in BookingModal.jsx
2. Log booking creation with snapshot
3. Add update logging (if edit feature exists)
4. Test: Create booking, verify log entry
5. Verify snapshot captured correctly

**Acceptance Criteria:**
- [ ] Booking creates logged
- [ ] Hardware snapshot included in log
- [ ] User info captured
- [ ] No errors

**Dependencies:** TODO-3.1  
**Files to Edit:**
- `src/components/BookingModal.jsx`

---

### TODO-3.4: Create Change History Viewer
**Priority:** 🟢 MEDIUM  
**Conversation Title:** "Create Change History UI"

**Tasks:**
1. Create new component: `src/components/ChangeHistoryModal.jsx`
2. Display change logs for a specific entity
3. Show before/after diff view
4. Add timeline visualization
5. Add to VehicleCard as "View History" button
6. Test with logged changes

**Acceptance Criteria:**
- [ ] Can view change history for any vehicle
- [ ] Before/after changes clearly visible
- [ ] Timeline shows chronological order
- [ ] User info displayed (who made change)
- [ ] Timestamps accurate

**Dependencies:** TODO-3.2, TODO-3.3  
**Files to Create:**
- `src/components/ChangeHistoryModal.jsx`
- `src/components/ChangeHistoryModal.css`

**Files to Edit:**
- `src/components/VehicleCard.jsx`

---

### TODO-3.5: Implement Hardware Snapshot Logic
**Priority:** 🟡 HIGH  
**Conversation Title:** "Auto-Snapshot Hardware Config on Booking"

**Tasks:**
1. Open `src/components/BookingModal.jsx`
2. Before INSERT booking, fetch current vehicle hw_config
3. Add hw_config to snapshotted_hw_config field:
```javascript
const { data: vehicleData } = await supabase
  .from('vehicles')
  .select('hw_config')
  .eq('id', vehicle.id)
  .single();

const bookingData = {
  // ... existing fields
  snapshotted_hw_config: vehicleData?.hw_config || null
};
```
4. Test: Change vehicle hw_config, create booking, change hw_config again, verify booking has original config

**Acceptance Criteria:**
- [ ] Booking captures hardware config at time of creation
- [ ] Snapshot is immutable (doesn't change if vehicle changes)
- [ ] Snapshot is JSONB format
- [ ] Can view snapshot later

**Dependencies:** None  
**Files to Edit:**
- `src/components/BookingModal.jsx`

---

## Phase 4: Delete Functionality

**Estimated Time:** 8-10 hours  
**Can be done in:** 2 separate conversation threads

---

### TODO-4.1: Add Delete Vehicle Button
**Priority:** 🟢 MEDIUM  
**Conversation Title:** "Implement Vehicle Delete Function"

**Tasks:**
1. Open `src/components/EditVehicleModal.jsx`
2. Add "Delete Vehicle" button at bottom (admin only)
3. Implement soft delete:
```javascript
const handleDelete = async () => {
  if (!confirm(`Delete ${vehicle.name}? This action cannot be undone.`)) return;
  
  // Check for future bookings
  const { data: futureBookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('vehicle_id', vehicle.id)
    .gte('start_time', new Date().toISOString())
    .is('deleted_at', null);
  
  if (futureBookings?.length > 0) {
    if (!confirm(`This vehicle has ${futureBookings.length} upcoming bookings. Delete anyway?`)) return;
  }
  
  // Soft delete
  const { error } = await supabase
    .from('vehicles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', vehicle.id);
  
  if (error) throw error;
  
  // Log deletion
  await logChange({
    entityType: 'vehicle',
    entityId: vehicle.id,
    entityName: vehicle.name,
    actionType: 'delete',
    beforeData: vehicle,
    afterData: null,
    userId: user.id,
    userEmail: user.email,
    displayName: displayName
  });
  
  onClose();
  if (onSave) onSave();
};
```
4. Style delete button (red, dangerous)
5. Test: Delete vehicle, verify it disappears

**Acceptance Criteria:**
- [ ] Delete button visible to admin only
- [ ] Confirmation dialog required
- [ ] Warning if vehicle has future bookings
- [ ] Soft delete (deleted_at set, not actual DELETE)
- [ ] Change log entry created
- [ ] Vehicle disappears from dashboard

**Dependencies:** TODO-0.4, TODO-3.1  
**Files to Edit:**
- `src/components/EditVehicleModal.jsx`
- `src/components/EditVehicleModal.css`

---

### TODO-4.2: Create My Bookings Page
**Priority:** 🟡 HIGH  
**Conversation Title:** "Create My Bookings Page"

**Tasks:**
1. Create new file: `src/pages/MyBookings.jsx`
2. Fetch user's bookings with vehicle info:
```javascript
const { data, error } = await supabase
  .from('bookings')
  .select(`
    *,
    vehicles (name, status)
  `)
  .eq('user_id', user.id)
  .is('deleted_at', null)
  .order('start_time', { ascending: false });
```
3. Add filter tabs: All, Upcoming, Past
4. Display bookings in cards
5. Add delete button to each booking
6. Add route to App.jsx
7. Add link in Header navigation

**Acceptance Criteria:**
- [ ] Page shows user's bookings
- [ ] Can filter by upcoming/past
- [ ] Vehicle name displayed
- [ ] Date range displayed nicely
- [ ] Accessible from header menu

**Dependencies:** None  
**Files to Create:**
- `src/pages/MyBookings.jsx`
- `src/pages/MyBookings.css`

**Files to Edit:**
- `src/App.jsx` (add route)
- `src/components/Header.jsx` (add nav link)

---

### TODO-4.3: Add Delete Booking Function
**Priority:** 🟡 HIGH  
**Conversation Title:** "Implement Booking Delete Function"

**Tasks:**
1. In MyBookings.jsx, add delete handler:
```javascript
const handleDeleteBooking = async (booking) => {
  if (!confirm(`Delete booking for "${booking.project_name}"?`)) return;
  
  const { error } = await supabase
    .from('bookings')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', booking.id);
  
  if (error) throw error;
  
  // Log deletion
  await logChange({
    entityType: 'booking',
    entityId: booking.id,
    entityName: booking.project_name,
    actionType: 'delete',
    beforeData: booking,
    afterData: null,
    userId: user.id,
    userEmail: user.email,
    displayName: displayName
  });
  
  // Refresh list
  fetchMyBookings();
};
```
2. Add delete button to booking card
3. Test: Delete booking, verify it disappears
4. Test: Cannot delete other users' bookings (unless admin)

**Acceptance Criteria:**
- [ ] Can delete own bookings
- [ ] Confirmation required
- [ ] Soft delete (deleted_at set)
- [ ] Change log created
- [ ] Booking disappears from list
- [ ] Admin can delete any booking

**Dependencies:** TODO-4.2, TODO-3.1  
**Files to Edit:**
- `src/pages/MyBookings.jsx`

---

## Phase 5: Hardware Configuration System

**Estimated Time:** 12-15 hours  
**Can be done in:** 3 separate conversation threads

---

### TODO-5.1: Create Hardware Config Data Structure
**Priority:** 🟡 HIGH  
**Conversation Title:** "Define Hardware Config Schema"

**Tasks:**
1. Create new file: `src/lib/hardwareConfig.js`
2. Define hardware config schema:
```javascript
export const HARDWARE_CONFIG_SCHEMA = {
  radio: {
    h30: { enabled: false, notes: '' },
    silvus: { enabled: false, notes: '' },
    radioNor: { enabled: false, notes: '' },
    custom: { enabled: false, value: '' }
  },
  frequencyBand: {
    s: false,
    c: false,
    l: false,
    custom: ''
  },
  visualNavigation: {
    enabled: false
  },
  gps: {
    holyBro: { enabled: false, notes: '' },
    hardenGps: { enabled: false, notes: '' },
    arcXL: { enabled: false, notes: '' },
    custom: { enabled: false, value: '' }
  }
};
```
3. Add helper functions: `hardwareConfigToText()`, `validateConfig()`
4. Add preset configurations
5. Write unit tests

**Acceptance Criteria:**
- [ ] Schema defined and documented
- [ ] Helper functions work correctly
- [ ] Unit tests pass
- [ ] Presets defined

**Dependencies:** None  
**Files to Create:**
- `src/lib/hardwareConfig.js`
- `src/lib/hardwareConfig.test.js`

---

### TODO-5.2: Migrate Existing Hardware Configs
**Priority:** 🔴 CRITICAL  
**Conversation Title:** "Migrate Hardware Config Data"

**Tasks:**
1. Backup database
2. Create migration script:
```sql
UPDATE vehicles
SET hw_config = jsonb_build_object(
  'legacy_text', COALESCE(hw_config->'raw', ''),
  'radio', jsonb_build_object(
    'h30', jsonb_build_object('enabled', false, 'notes', ''),
    'silvus', jsonb_build_object('enabled', false, 'notes', ''),
    'radioNor', jsonb_build_object('enabled', false, 'notes', ''),
    'custom', jsonb_build_object('enabled', false, 'value', '')
  ),
  'frequencyBand', jsonb_build_object('s', false, 'c', false, 'l', false, 'custom', ''),
  'visualNavigation', jsonb_build_object('enabled', false),
  'gps', jsonb_build_object(
    'holyBro', jsonb_build_object('enabled', false, 'notes', ''),
    'hardenGps', jsonb_build_object('enabled', false, 'notes', ''),
    'arcXL', jsonb_build_object('enabled', false, 'notes', ''),
    'custom', jsonb_build_object('enabled', false, 'value', '')
  )
)
WHERE hw_config IS NOT NULL;

-- Set empty configs
UPDATE vehicles
SET hw_config = jsonb_build_object(
  'radio', jsonb_build_object(
    'h30', jsonb_build_object('enabled', false, 'notes', ''),
    'silvus', jsonb_build_object('enabled', false, 'notes', ''),
    'radioNor', jsonb_build_object('enabled', false, 'notes', ''),
    'custom', jsonb_build_object('enabled', false, 'value', '')
  ),
  'frequencyBand', jsonb_build_object('s', false, 'c', false, 'l', false, 'custom', ''),
  'visualNavigation', jsonb_build_object('enabled', false),
  'gps', jsonb_build_object(
    'holyBro', jsonb_build_object('enabled', false, 'notes', ''),
    'hardenGps', jsonb_build_object('enabled', false, 'notes', ''),
    'arcXL', jsonb_build_object('enabled', false, 'notes', ''),
    'custom', jsonb_build_object('enabled', false, 'value', '')
  )
)
WHERE hw_config IS NULL OR hw_config::text = '{}';
```
3. Execute in Supabase SQL Editor
4. Verify all vehicles have correct structure
5. Test: Query a vehicle's hw_config and verify structure

**Acceptance Criteria:**
- [ ] All vehicles have new hw_config structure
- [ ] Old data preserved in legacy_text field
- [ ] No data loss
- [ ] Structure matches schema

**Dependencies:** TODO-5.1  
**Blocks:** TODO-5.3 (UI cannot work without data structure)

**Database Scripts:**
- Create new file: `db/09_migrate_hw_config.sql`

---

### TODO-5.3: Create Hardware Config Modal Component
**Priority:** 🟡 HIGH  
**Conversation Title:** "Build Hardware Config UI"

**Tasks:**
1. Create new file: `src/components/HardwareConfigModal.jsx`
2. Implement checkboxes for each option
3. Implement text fields for notes/custom values
4. Position modal on right side (not covering EditVehicleModal)
5. Add preview section showing formatted config
6. Style with dark theme matching existing modals
7. Test: Open modal, make changes, save, verify

**Acceptance Criteria:**
- [ ] Modal displays on right side of screen
- [ ] All sections visible: Radio, Frequency Band, Visual Nav, GPS
- [ ] Checkboxes work correctly
- [ ] Text fields enable/disable based on checkbox
- [ ] Preview updates in real-time
- [ ] Save button works
- [ ] Cancel button discards changes

**Dependencies:** TODO-5.1, TODO-5.2  
**Files to Create:**
- `src/components/HardwareConfigModal.jsx`
- `src/components/HardwareConfigModal.css`

---

### TODO-5.4: Integrate Hardware Config Modal
**Priority:** 🟡 HIGH  
**Conversation Title:** "Connect Hardware Config to Vehicle Editor"

**Tasks:**
1. Open `src/components/EditVehicleModal.jsx`
2. Replace text input with "Configure Hardware" button
3. Add state for hardware config modal:
```javascript
const [showHwConfigModal, setShowHwConfigModal] = useState(false);
```
4. Pass hw_config to modal
5. Save returned config to formData
6. Test: Open EditVehicleModal → Click Configure → Edit config → Save → Verify saved
7. Test: Hardware config persists after page refresh

**Acceptance Criteria:**
- [ ] "Configure Hardware" button visible
- [ ] Clicking opens HardwareConfigModal
- [ ] Config saves correctly to database
- [ ] Config displays correctly when editing existing vehicle
- [ ] Both modals visible simultaneously (side by side)

**Dependencies:** TODO-5.3  
**Files to Edit:**
- `src/components/EditVehicleModal.jsx`

---

### TODO-5.5: Test Hardware Snapshot in Bookings
**Priority:** 🟢 MEDIUM  
**Conversation Title:** "Verify Hardware Snapshot Works"

**Tasks:**
1. Configure vehicle hardware (set specific values)
2. Create booking for that vehicle
3. Change vehicle hardware config (different values)
4. View booking details
5. Verify booking shows ORIGINAL config (snapshot)
6. Test: Snapshot should be immutable

**Acceptance Criteria:**
- [ ] Booking captures hardware config at creation time
- [ ] Changing vehicle config doesn't affect existing bookings
- [ ] Can view snapshot in booking details
- [ ] Snapshot is in correct format (structured, not plain text)

**Dependencies:** TODO-3.5, TODO-5.4  
**Files to Edit:**
- `src/components/CalendarOverviewModal.jsx` (or booking details view)

---

## Summary: Conversation Thread Organization

### Thread 1: Pre-Implementation (CRITICAL)
- TODO-0.1: Database Backup
- TODO-0.2: Seven Vehicles SQL
- TODO-0.3: Remove Risk Level Column
- TODO-0.4: Add Soft Delete
- TODO-0.5: Create Change Logs Table

### Thread 2: Bug Fixes Part 1
- TODO-1.1: Fix Logo
- TODO-1.2: Fix Vehicle Persistence

### Thread 3: Bug Fixes Part 2
- TODO-1.3: Remove Risk Level UI
- TODO-1.4: Fix Profile Sync

### Thread 4: Core Adjustments
- TODO-2.1: Department RLS
- TODO-2.2: Conflict Warning UI
- TODO-2.3: Week Numbers

### Thread 5: Audit System Part 1
- TODO-3.1: Change Logger Utility
- TODO-3.2: Log Vehicle Changes
- TODO-3.3: Log Booking Changes

### Thread 6: Audit System Part 2
- TODO-3.4: Change History Viewer
- TODO-3.5: Hardware Snapshot

### Thread 7: Delete Functions Part 1
- TODO-4.1: Delete Vehicle

### Thread 8: Delete Functions Part 2
- TODO-4.2: My Bookings Page
- TODO-4.3: Delete Booking

### Thread 9: Hardware Config Part 1
- TODO-5.1: Data Structure
- TODO-5.2: Data Migration

### Thread 10: Hardware Config Part 2
- TODO-5.3: Hardware Config Modal
- TODO-5.4: Integration

### Thread 11: Hardware Config Part 3
- TODO-5.5: Test Snapshot

---

## Execution Guidelines

### Before Starting Any TODO:
1. ✅ Read the TODO description completely
2. ✅ Check dependencies (don't start if dependencies not done)
3. ✅ Backup database if TODO involves schema changes
4. ✅ Create git branch for the TODO
5. ✅ Read related files before editing

### During TODO Execution:
1. ✅ Follow acceptance criteria exactly
2. ✅ Test each change immediately
3. ✅ Check console for errors
4. ✅ Verify no breaking changes to existing features

### After TODO Completion:
1. ✅ Run all acceptance criteria tests
2. ✅ Check for console errors
3. ✅ Test in both dev and prod (if applicable)
4. ✅ Commit changes with descriptive message
5. ✅ Mark TODO as complete in this document

---

## Rollback Procedures

If any TODO causes critical issues:

1. **Database Changes:** Restore from backup
```bash
# Restore from SQL backup
psql "postgresql://..." < backup_YYYYMMDD_HHMMSS.sql
```

2. **Code Changes:** Revert git commit
```bash
git revert <commit-hash>
# or
git reset --hard HEAD~1  # if not pushed
```

3. **Report Issue:** Document what went wrong for future reference

---

## Progress Tracking

| Phase | TODO | Status | Assignee | Completed Date |
|-------|------|--------|----------|----------------|
| 0 | 0.1 | ⬜ Not Started | - | - |
| 0 | 0.2 | ⬜ Not Started | - | - |
| 0 | 0.3 | ⬜ Not Started | - | - |
| 0 | 0.4 | ⬜ Not Started | - | - |
| 0 | 0.5 | ⬜ Not Started | - | - |
| 1 | 1.1 | ⬜ Not Started | - | - |
| 1 | 1.2 | ⬜ Not Started | - | - |
| 1 | 1.3 | ⬜ Not Started | - | - |
| 1 | 1.4 | ⬜ Not Started | - | - |
| 2 | 2.1 | ⬜ Not Started | - | - |
| 2 | 2.2 | ⬜ Not Started | - | - |
| 2 | 2.3 | ⬜ Not Started | - | - |
| 3 | 3.1 | ⬜ Not Started | - | - |
| 3 | 3.2 | ⬜ Not Started | - | - |
| 3 | 3.3 | ⬜ Not Started | - | - |
| 3 | 3.4 | ⬜ Not Started | - | - |
| 3 | 3.5 | ⬜ Not Started | - | - |
| 4 | 4.1 | ⬜ Not Started | - | - |
| 4 | 4.2 | ⬜ Not Started | - | - |
| 4 | 4.3 | ⬜ Not Started | - | - |
| 5 | 5.1 | ⬜ Not Started | - | - |
| 5 | 5.2 | ⬜ Not Started | - | - |
| 5 | 5.3 | ⬜ Not Started | - | - |
| 5 | 5.4 | ⬜ Not Started | - | - |
| 5 | 5.5 | ⬜ Not Started | - | - |

**Legend:**
- ⬜ Not Started
- 🔄 In Progress
- ✅ Completed
- ❌ Blocked
- ⚠️ Issue

---

**Document End**

*Use this document to track implementation progress. Update status as TODOs are completed.*
