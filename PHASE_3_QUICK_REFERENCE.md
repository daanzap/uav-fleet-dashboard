# Phase 3 Quick Reference Guide

**For:** Developers and Users  
**Updated:** February 4, 2026

---

## 🎯 What Phase 3 Added

Phase 3 implemented a comprehensive **Audit & Logging System** for the UAV Fleet Dashboard.

---

## 🔑 Key Features

### 1. Automatic Change Logging
- **Vehicle changes** are automatically logged
- **Booking creations** are automatically logged
- **Who, what, when** is tracked for every change

### 2. Change History Viewer
- Click the **"📜 History"** button on any vehicle card
- View a timeline of all changes
- See before/after comparisons

### 3. Hardware Snapshots
- When you book a vehicle, the hardware config is **frozen**
- Even if the vehicle's hardware changes later, your booking shows the config **at the time you booked**

---

## 📚 How to Use

### View Change History
1. Go to Dashboard
2. Find the vehicle you want to check
3. Click the **"📜 History"** button
4. A modal opens showing all changes in chronological order
5. Click **"▶ N fields changed"** to expand details
6. Click **"Close"** to exit

### What You'll See
- **✨ Create** - When the vehicle was first added (green)
- **✏️ Update** - When the vehicle was edited (blue)
- **🗑️ Delete** - When the vehicle was soft-deleted (red)

Each entry shows:
- Who made the change
- When it happened
- What fields changed (old → new values)

---

## 🛠️ For Developers

### Import the Logger
```javascript
import { logChange } from '../lib/changeLogger'
```

### Log a Change
```javascript
await logChange({
  entityType: 'vehicle',        // or 'booking', 'profile'
  entityId: vehicle.id,
  entityName: vehicle.name,
  actionType: 'update',         // or 'create', 'delete'
  beforeData: oldVehicle,       // null for create
  afterData: newVehicle,        // null for delete
  userId: user.id,
  userEmail: user.email,
  displayName: displayName,
  notes: 'Optional notes'       // optional
})
```

### Fetch Change History
```javascript
import { getChangeHistory } from '../lib/changeLogger'

const history = await getChangeHistory('vehicle', vehicleId, 50)
```

### Display Change History
```javascript
import ChangeHistoryModal from '../components/ChangeHistoryModal'

<ChangeHistoryModal
  entityType="vehicle"
  entityId={vehicle.id}
  entityName={vehicle.name}
  onClose={() => setShowHistory(false)}
/>
```

---

## 📋 Files to Know

### Core Library
- `src/lib/changeLogger.js` - Change logging utilities

### UI Components
- `src/components/ChangeHistoryModal.jsx` - Change history viewer
- `src/components/ChangeHistoryModal.css` - Styling

### Integration Points
- `src/components/EditVehicleModal.jsx` - Logs vehicle changes
- `src/components/BookingModal.jsx` - Logs booking creation + snapshots hardware
- `src/components/VehicleCard.jsx` - Has "History" button
- `src/pages/Dashboard.jsx` - Integrates ChangeHistoryModal

---

## 🔍 Database Schema

### change_logs Table
```sql
id                    uuid PRIMARY KEY
created_at            timestamptz
user_id               uuid REFERENCES auth.users(id)
user_email            text
user_display_name     text
entity_type           text ('vehicle' | 'booking' | 'profile')
entity_id             uuid
entity_name           text
action_type           text ('create' | 'update' | 'delete')
before_snapshot       jsonb
after_snapshot        jsonb
changed_fields        jsonb
notes                 text
ip_address            text
```

### Bookings Table (Updated)
Added field:
```sql
snapshotted_hw_config jsonb
```

---

## 🎨 UI/UX

### Vehicle Card Button
```
┌─────────────────────┐
│  [📝 BOOK NOW]      │
│  [📜 History]       │
└─────────────────────┘
```

### Change History Modal
```
┌──────────────────────────────────┐
│ 📜 Change History                │
│    RD-117                     ×  │
├──────────────────────────────────┤
│                                  │
│ ● ✏️ Update by John Doe         │
│   │   Feb 4, 2026 2:30 PM      │
│   │   ▶ 2 fields changed       │
│   │                            │
│ ● ✨ Create by Jane Smith       │
│   │   Jan 15, 2026 9:00 AM     │
│   │                            │
│                                  │
├──────────────────────────────────┤
│                    [Close]       │
└──────────────────────────────────┘
```

---

## ⚡ Performance Tips

1. **Limited History:** Only fetches last 50 changes by default
2. **Lazy Loading:** History only loads when modal opens
3. **Indexed Queries:** Database queries use indexes for speed
4. **Graceful Errors:** Logging failures don't break the app

---

## 🧪 Testing

### Quick Test Sequence
1. Edit a vehicle (change status to "Maintenance")
2. Save changes
3. Click "📜 History" button
4. Verify you see an "Update" entry
5. Expand the entry
6. Verify old status → new status is shown

---

## 🔐 Security

- Only **editors and admins** can view change history
- All changes attributed to user (can't be anonymous)
- Change logs are **immutable** (can't be edited or deleted)
- RLS policies enforce permissions

---

## 🎓 Best Practices

### When to Log Changes
✅ **DO log:**
- User-initiated changes (edit vehicle, create booking)
- Important state changes (status updates)
- Configuration changes (hardware, software)

❌ **DON'T log:**
- System-generated updates (automated tasks)
- Frequent polling/refresh operations
- Temporary UI state changes

### How to Write Good Notes
```javascript
// ✅ Good
notes: 'Updated status from Available to Maintenance for repairs'

// ✅ Good
notes: 'Created booking for high-altitude test flight'

// ❌ Too vague
notes: 'Updated'

// ❌ Too verbose
notes: 'The user clicked the edit button and then changed the status field...'
```

---

## 🚨 Troubleshooting

### Change History Not Showing
**Symptom:** Click "History" button, modal is empty

**Possible Causes:**
1. No changes have been logged yet (make an edit first)
2. User doesn't have permission (must be editor or admin)
3. `change_logs` table doesn't exist (run Phase 0 migrations)

**Solution:**
- Verify you're logged in as editor/admin
- Make a test edit to create a log entry
- Check Supabase for `change_logs` table

### Logging Errors in Console
**Symptom:** See "Error logging change" in browser console

**Possible Causes:**
1. `change_logs` table doesn't exist
2. RLS policies blocking insert
3. Invalid data format

**Solution:**
- Check browser console for specific error
- Verify Phase 0 database migrations ran
- Check Supabase logs for RLS policy issues

### Hardware Snapshot Not Captured
**Symptom:** Booking doesn't have `snapshotted_hw_config`

**Possible Causes:**
1. Vehicle has no hardware config set
2. Booking created before Phase 3 implementation

**Solution:**
- Set hardware config on vehicle before booking
- Re-create booking to capture snapshot

---

## 📞 Support

### For Issues
1. Check browser console for errors
2. Check Supabase logs
3. Review `PHASE_3_COMPLETE.md` for implementation details

### For Questions
- Review the change logging utility: `src/lib/changeLogger.js`
- Check example usage in `EditVehicleModal.jsx` and `BookingModal.jsx`

---

**Quick Reference Version:** 1.0  
**Last Updated:** February 4, 2026  
**Status:** Phase 3 Complete ✅
