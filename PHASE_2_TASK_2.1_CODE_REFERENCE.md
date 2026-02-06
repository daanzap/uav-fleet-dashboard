# Task 2.1 - Code Reference Guide

Quick reference for the enhanced conflict detection implementation.

---

## 📁 Files Modified

### 1. src/lib/database.js

**New Function Added:**
```javascript
async getAllConflictingBookings(vehicleId, startTime, endTime, excludeBookingId = null) {
    let query = supabase
        .from('bookings')
        .select('id, project_name, pilot_name, start_time, end_time, who_ordered, location, duration, notes, user_id')
        .eq('vehicle_id', vehicleId)
        .lte('start_time', endTime)
        .gte('end_time', startTime)
        .order('start_time', { ascending: true })

    if (excludeBookingId) {
        query = query.neq('id', excludeBookingId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
}
```

**Purpose:** Fetch ALL conflicting bookings with complete details for enhanced UI display.

---

### 2. src/components/BookingModal.jsx

#### New State Variables

```javascript
const [conflictingBookings, setConflictingBookings] = useState([])
const [showOverrideDialog, setShowOverrideDialog] = useState(false)
const [overrideConfirmed, setOverrideConfirmed] = useState(false)
```

#### Enhanced Conflict Detection

```javascript
useEffect(() => {
    if (selectedDates.length === 0) {
        setConflictWarning(null)
        setConflictingBookings([])
        return
    }
    
    const start_time = new Date(selectedDates[0] + 'T00:00:00Z').toISOString()
    const end_time = new Date(selectedDates[selectedDates.length - 1] + 'T23:59:59Z').toISOString()
    
    db.getAllConflictingBookings(vehicle.id, start_time, end_time)
        .then(conflicts => {
            if (conflicts && conflicts.length > 0) {
                setConflictWarning({ count: conflicts.length })
                setConflictingBookings(conflicts)
            } else {
                setConflictWarning(null)
                setConflictingBookings([])
            }
        })
        .catch(() => {
            setConflictWarning(null)
            setConflictingBookings([])
        })
}, [vehicle.id, selectedDates.join(',')])
```

#### Helper Functions

```javascript
// Format ISO date to MM/DD/YYYY
const formatDateTimeFull = (isoString) => {
    const date = new Date(isoString)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
}

// Calculate overlap days between conflict and selected dates
const calculateOverlapDays = (conflict) => {
    const conflictStart = new Date(conflict.start_time)
    const conflictEnd = new Date(conflict.end_time)
    const selectedStart = new Date(selectedDates[0] + 'T00:00:00Z')
    const selectedEnd = new Date(selectedDates[selectedDates.length - 1] + 'T23:59:59Z')
    
    const overlapStart = new Date(Math.max(conflictStart.getTime(), selectedStart.getTime()))
    const overlapEnd = new Date(Math.min(conflictEnd.getTime(), selectedEnd.getTime()))
    
    const days = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1
    return days
}

// Handle override confirmation
const handleOverrideConfirm = () => {
    setShowOverrideDialog(false)
    setOverrideConfirmed(true)
    setTimeout(() => {
        document.getElementById('booking-form').requestSubmit()
    }, 0)
}

// Handle override cancellation
const handleOverrideCancel = () => {
    setShowOverrideDialog(false)
}
```

#### Updated Submit Handler

```javascript
const handleSubmit = async (e) => {
    e.preventDefault()

    if (selectedDates.length === 0) {
        alert('Please select at least one date')
        return
    }

    // If there are conflicts and user hasn't confirmed override, show dialog
    if (conflictingBookings.length > 0 && !overrideConfirmed) {
        setShowOverrideDialog(true)
        return
    }

    setLoading(true)
    // ... rest of submit logic
}
```

#### Enhanced Conflict Warning UI

```jsx
{conflictWarning && conflictingBookings.length > 0 && (
    <div className="booking-conflict-enhanced" role="alert">
        <div className="conflict-header">
            <div className="conflict-icon">⚠️</div>
            <div>
                <div className="conflict-title">Booking Conflict Detected</div>
                <div className="conflict-subtitle">
                    {conflictingBookings.length} conflicting {conflictingBookings.length === 1 ? 'booking' : 'bookings'} found
                </div>
            </div>
        </div>
        
        <div className="conflict-list">
            {conflictingBookings.map((conflict, idx) => (
                <div key={conflict.id} className="conflict-item">
                    <div className="conflict-item-header">
                        <span className="conflict-badge">Conflict {idx + 1}</span>
                        <span className="conflict-overlap">
                            {calculateOverlapDays(conflict)} day{calculateOverlapDays(conflict) > 1 ? 's' : ''} overlap
                        </span>
                    </div>
                    
                    <div className="conflict-details">
                        <div className="conflict-detail-row">
                            <span className="conflict-label">📋 Project:</span>
                            <span className="conflict-value">{conflict.project_name || 'Unnamed Project'}</span>
                        </div>
                        {/* ... more detail rows ... */}
                    </div>
                </div>
            ))}
        </div>
        
        <div className="conflict-footer">
            <span className="conflict-footer-icon">💡</span>
            <span className="conflict-footer-text">
                Please coordinate with the booking owner before proceeding, or select different dates.
            </span>
        </div>
    </div>
)}
```

#### Override Confirmation Dialog

```jsx
{showOverrideDialog && (
    <div className="override-dialog-overlay" onClick={handleOverrideCancel}>
        <div className="override-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="override-dialog-header">
                <div className="override-dialog-icon">⚠️</div>
                <h3>Confirm Booking Override</h3>
            </div>
            
            <div className="override-dialog-body">
                <p className="override-warning">
                    You are about to create a booking that conflicts with {conflictingBookings.length} existing {conflictingBookings.length === 1 ? 'booking' : 'bookings'}.
                </p>
                
                <div className="override-conflict-summary">
                    <strong>Conflicting bookings:</strong>
                    <ul>
                        {conflictingBookings.map((conflict) => (
                            <li key={conflict.id}>
                                <strong>{conflict.project_name || 'Unnamed Project'}</strong>
                                <br />
                                <span className="override-conflict-detail">
                                    {formatDateTimeFull(conflict.start_time)} - {formatDateTimeFull(conflict.end_time)}
                                    {conflict.who_ordered && ` • Ordered by: ${conflict.who_ordered}`}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <p className="override-question">
                    Have you coordinated with the booking owner(s)?
                </p>
            </div>
            
            <div className="override-dialog-actions">
                <button type="button" className="override-btn-cancel" onClick={handleOverrideCancel}>
                    Cancel
                </button>
                <button type="button" className="override-btn-confirm" onClick={handleOverrideConfirm}>
                    Yes, Create Booking Anyway
                </button>
            </div>
        </div>
    </div>
)}
```

---

### 3. src/components/BookingModal.css

#### Key CSS Classes Added

```css
/* Enhanced Conflict Warning */
.booking-conflict-enhanced { }
.conflict-header { }
.conflict-icon { }
.conflict-title { }
.conflict-subtitle { }
.conflict-list { }
.conflict-item { }
.conflict-item-header { }
.conflict-badge { }
.conflict-overlap { }
.conflict-details { }
.conflict-detail-row { }
.conflict-label { }
.conflict-value { }
.conflict-footer { }
.conflict-footer-icon { }
.conflict-footer-text { }

/* Override Dialog */
.override-dialog-overlay { }
.override-dialog { }
.override-dialog-header { }
.override-dialog-icon { }
.override-dialog-body { }
.override-warning { }
.override-conflict-summary { }
.override-conflict-detail { }
.override-question { }
.override-dialog-actions { }
.override-btn-cancel { }
.override-btn-confirm { }

/* Animation */
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}
```

---

## 🔄 Data Flow

```
User selects dates
    ↓
useEffect triggered
    ↓
db.getAllConflictingBookings() called
    ↓
Supabase query executed
    ↓
Results returned
    ↓
State updated:
- setConflictWarning({ count })
- setConflictingBookings(conflicts)
    ↓
UI re-renders with conflict warning
    ↓
User clicks "Confirm Reservation"
    ↓
handleSubmit() checks overrideConfirmed
    ↓
If conflicts && !overrideConfirmed:
    setShowOverrideDialog(true)
    return early
    ↓
Override dialog appears
    ↓
User clicks "Yes, Create Booking Anyway"
    ↓
handleOverrideConfirm() called
    ↓
setOverrideConfirmed(true)
    ↓
Form.requestSubmit() triggered
    ↓
handleSubmit() runs again
    ↓
overrideConfirmed is true, proceed with booking
    ↓
Booking created in database
```

---

## 🎨 Design Tokens

### Colors
```css
/* Warnings */
--warning-bg: linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(239, 68, 68, 0.1))
--warning-border: #f59e0b
--warning-text: #fbbf24

/* Conflict Items */
--conflict-bg: rgba(15, 23, 42, 0.6)
--conflict-border: rgba(251, 191, 36, 0.3)

/* Override Dialog */
--override-border: #ef4444
--override-header-text: #fca5a5
--override-btn-bg: linear-gradient(135deg, #ef4444, #dc2626)

/* Info Footer */
--info-bg: rgba(59, 130, 246, 0.1)
--info-border: rgba(59, 130, 246, 0.3)
--info-text: #93c5fd
```

### Spacing
```css
--conflict-padding: 1rem
--conflict-gap: 0.75rem
--dialog-padding: 1.5rem
```

---

## 🧩 Component Structure

```
BookingModal
├── booking-modal-overlay
│   └── booking-modal-container
│       ├── booking-modal-header
│       ├── booking-modal-body
│       │   ├── booking-calendar-section
│       │   └── booking-form-section
│       │       ├── form fields...
│       │       └── booking-conflict-enhanced ← NEW
│       │           ├── conflict-header
│       │           ├── conflict-list
│       │           │   └── conflict-item (multiple)
│       │           │       ├── conflict-item-header
│       │           │       └── conflict-details
│       │           └── conflict-footer
│       └── override-dialog-overlay ← NEW
│           └── override-dialog
│               ├── override-dialog-header
│               ├── override-dialog-body
│               │   ├── override-warning
│               │   ├── override-conflict-summary
│               │   └── override-question
│               └── override-dialog-actions
```

---

## 🔍 Key Logic Patterns

### 1. Real-time Conflict Detection
```javascript
// Runs whenever dates change
useEffect(() => {
    // Fetch conflicts
    // Update state
}, [vehicle.id, selectedDates.join(',')])
```

### 2. Two-Step Confirmation
```javascript
// Step 1: Show warning in form
if (conflictWarning) { /* render warning */ }

// Step 2: Show override dialog on submit
if (conflicts && !overrideConfirmed) {
    setShowOverrideDialog(true)
    return // Don't submit yet
}
```

### 3. Overlap Calculation
```javascript
// Find overlap window
const overlapStart = Math.max(conflictStart, selectedStart)
const overlapEnd = Math.min(conflictEnd, selectedEnd)

// Calculate days
const days = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1
```

---

## 🐛 Debugging Tips

### Check Conflict Detection
```javascript
console.log('Selected dates:', selectedDates)
console.log('Conflicting bookings:', conflictingBookings)
console.log('Conflict warning:', conflictWarning)
```

### Check Override Flow
```javascript
console.log('Override confirmed:', overrideConfirmed)
console.log('Show override dialog:', showOverrideDialog)
```

### Check Database Query
```javascript
// In database.js
console.log('Query params:', { vehicleId, startTime, endTime })
console.log('Query result:', data)
```

---

## 📚 Related Documentation

- Main implementation: `PHASE_2_TASK_2.1_COMPLETE.md`
- Testing guide: `PHASE_2_TASK_2.1_TESTING_GUIDE.md`
- Phase 2 overview: `PHASE_2_KICKOFF_GUIDE.md`

---

**Last Updated:** February 6, 2026
