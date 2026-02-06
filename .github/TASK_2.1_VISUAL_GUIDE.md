# Task 2.1 - Visual Implementation Guide

## 🎨 UI Component Breakdown

### 1. Enhanced Conflict Warning Box

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  Booking Conflict Detected                               │
│     2 conflicting bookings found                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [CONFLICT 1]                      [2 days overlap]   │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ 📋 Project:     Survey Mission Alpha                 │  │
│  │ 👤 Pilot:       John Doe                             │  │
│  │ 📅 Dates:       02/10/2026 - 02/12/2026             │  │
│  │ 🎯 Ordered by:  Jane Smith                           │  │
│  │ 📍 Location:    Field Site A                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [CONFLICT 2]                      [1 day overlap]    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ 📋 Project:     Training Flight                      │  │
│  │ 👤 Pilot:       Mike Johnson                         │  │
│  │ 📅 Dates:       02/12/2026 - 02/14/2026             │  │
│  │ 🎯 Ordered by:  Training Dept                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 💡 Please coordinate with the booking owner before         │
│    proceeding, or select different dates.                  │
└─────────────────────────────────────────────────────────────┘
```

**Colors:**
- Background: Gradient (yellow/orange → red tint)
- Border: Orange (#f59e0b)
- Title: Yellow/Gold (#fbbf24)
- Badges: Orange gradient
- Text: White/Light gray

---

### 2. Override Confirmation Dialog

```
                 ┌─────────────────────────────────┐
                 │ ⚠️  Confirm Booking Override    │
                 ├─────────────────────────────────┤
                 │                                 │
                 │ You are about to create a       │
                 │ booking that conflicts with 2   │
                 │ existing bookings.              │
                 │                                 │
                 │ ┌─────────────────────────────┐ │
                 │ │ Conflicting bookings:       │ │
                 │ │                             │ │
                 │ │ • Survey Mission Alpha      │ │
                 │ │   02/10/2026 - 02/12/2026  │ │
                 │ │   Ordered by: Jane Smith    │ │
                 │ │                             │ │
                 │ │ • Training Flight           │ │
                 │ │   02/12/2026 - 02/14/2026  │ │
                 │ │   Ordered by: Training Dept │ │
                 │ └─────────────────────────────┘ │
                 │                                 │
                 │ Have you coordinated with the   │
                 │ booking owner(s)?               │
                 │                                 │
                 ├─────────────────────────────────┤
                 │ [Cancel] [Yes, Create Anyway]   │
                 └─────────────────────────────────┘
```

**Colors:**
- Background: Dark gradient
- Border: Red (#ef4444)
- Warning Icon: Pulsing animation
- Header: Light red/pink (#fca5a5)
- Confirm Button: Red gradient

---

## 🔄 State Flow Diagram

```
┌─────────────────┐
│ User Opens      │
│ Booking Modal   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User Selects    │
│ Dates           │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ useEffect Triggered                 │
│ - Call getAllConflictingBookings()  │
└────────┬────────────────────────────┘
         │
         ▼
    ┌────────┐
    │ Query  │
    │ Result │
    └───┬────┘
        │
        ├─────────────────────┬─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ No Conflicts │    │ 1 Conflict   │    │ 2+ Conflicts │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                    │
       ▼                   ▼                    ▼
┌──────────────┐    ┌──────────────────────────────────┐
│ No Warning   │    │ Show Enhanced Warning Box        │
│ Display      │    │ - Display conflict details       │
└──────┬───────┘    │ - Show overlap calculation       │
       │            │ - List all conflicts             │
       │            └──────┬───────────────────────────┘
       │                   │
       │                   │
       └───────────────────┼───────────────────────────┐
                           │                           │
                           ▼                           │
                   ┌──────────────┐                    │
                   │ User Fills   │                    │
                   │ Form         │                    │
                   └──────┬───────┘                    │
                          │                            │
                          ▼                            │
                   ┌──────────────┐                    │
                   │ User Clicks  │                    │
                   │ "Confirm"    │                    │
                   └──────┬───────┘                    │
                          │                            │
                ┌─────────┴─────────┐                  │
                │                   │                  │
                ▼                   ▼                  │
        ┌──────────────┐    ┌──────────────┐          │
        │ No Conflicts │    │ Has Conflicts│          │
        │ Submit       │    │ & Not        │          │
        │ Immediately  │    │ Confirmed    │          │
        └──────┬───────┘    └──────┬───────┘          │
               │                   │                  │
               │                   ▼                  │
               │            ┌──────────────┐          │
               │            │ Show Override│          │
               │            │ Dialog       │          │
               │            └──────┬───────┘          │
               │                   │                  │
               │         ┌─────────┴─────────┐        │
               │         │                   │        │
               │         ▼                   ▼        │
               │  ┌──────────────┐   ┌──────────────┐│
               │  │ User Clicks  │   │ User Clicks  ││
               │  │ "Cancel"     │   │ "Confirm"    ││
               │  └──────┬───────┘   └──────┬───────┘│
               │         │                   │        │
               │         ▼                   ▼        │
               │  ┌──────────────┐   ┌──────────────┐│
               │  │ Close Dialog │   │ Set Override ││
               │  │ Stay in Form │   │ Confirmed    ││
               │  └──────────────┘   └──────┬───────┘│
               │                            │        │
               │                            ▼        │
               │                     ┌──────────────┐│
               │                     │ Re-submit    ││
               │                     │ Form         ││
               │                     └──────┬───────┘│
               │                            │        │
               └────────────────────────────┴────────┘
                                            │
                                            ▼
                                    ┌──────────────┐
                                    │ Create       │
                                    │ Booking      │
                                    └──────┬───────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │ Success!     │
                                    │ Close Modal  │
                                    └──────────────┘
```

---

## 📐 Component Hierarchy

```
BookingModal
│
├── booking-modal-overlay (backdrop)
│   │
│   └── booking-modal-container (main modal)
│       │
│       ├── booking-modal-header
│       │   ├── booking-modal-icon (📅)
│       │   ├── title + subtitle
│       │   └── booking-modal-close (×)
│       │
│       ├── booking-modal-body
│       │   │
│       │   ├── booking-calendar-section
│       │   │   ├── calendar-header (month nav)
│       │   │   └── calendar-grid
│       │   │       ├── calendar-day-header (Sun-Sat)
│       │   │       └── calendar-day (clickable)
│       │   │
│       │   └── booking-form-section
│       │       ├── form fields (dates, pilot, project, etc.)
│       │       │
│       │       ├── booking-conflict-enhanced ⭐ NEW
│       │       │   │
│       │       │   ├── conflict-header
│       │       │   │   ├── conflict-icon (⚠️)
│       │       │   │   ├── conflict-title
│       │       │   │   └── conflict-subtitle
│       │       │   │
│       │       │   ├── conflict-list
│       │       │   │   └── conflict-item (for each conflict)
│       │       │   │       ├── conflict-item-header
│       │       │   │       │   ├── conflict-badge
│       │       │   │       │   └── conflict-overlap
│       │       │   │       │
│       │       │   │       └── conflict-details
│       │       │   │           └── conflict-detail-row (multiple)
│       │       │   │               ├── conflict-label
│       │       │   │               └── conflict-value
│       │       │   │
│       │       │   └── conflict-footer
│       │       │       ├── conflict-footer-icon (💡)
│       │       │       └── conflict-footer-text
│       │       │
│       │       └── booking-modal-actions
│       │           ├── booking-btn-cancel
│       │           └── booking-btn-confirm
│       │
│       └── override-dialog-overlay ⭐ NEW (conditional)
│           │
│           └── override-dialog
│               │
│               ├── override-dialog-header
│               │   ├── override-dialog-icon (⚠️ pulsing)
│               │   └── title
│               │
│               ├── override-dialog-body
│               │   ├── override-warning
│               │   ├── override-conflict-summary
│               │   │   └── ul > li (for each conflict)
│               │   └── override-question
│               │
│               └── override-dialog-actions
│                   ├── override-btn-cancel
│                   └── override-btn-confirm
```

---

## 🎬 Animation Timeline

### Conflict Warning Appearance
```
0ms:    opacity: 0, transform: translateY(-10px)
        ↓
150ms:  opacity: 1, transform: translateY(0)
        ↓
        Fully visible
```

### Override Dialog Appearance
```
0ms:    Overlay: opacity: 0
        Dialog: opacity: 0, transform: translateY(20px) scale(0.95)
        ↓
200ms:  Overlay: opacity: 1
        Dialog: opacity: 1, transform: translateY(0) scale(1)
        ↓
        Fully visible
        ↓
        Warning icon starts pulsing (2s cycle)
```

### Button Hover Effects
```
Normal:   background: gradient, transform: translateY(0)
          ↓
Hover:    background: lighter gradient
          transform: translateY(-1px)
          box-shadow: larger
          ↓
          (200ms transition)
```

---

## 📱 Responsive Breakpoints

### Desktop (> 800px)
```
┌─────────────────────────────────────────┐
│ Header                                  │
├──────────────────┬──────────────────────┤
│                  │                      │
│   Calendar       │   Form + Warning     │
│   (Left)         │   (Right)            │
│                  │                      │
└──────────────────┴──────────────────────┘
```

### Mobile (< 800px)
```
┌─────────────────────────────────────────┐
│ Header                                  │
├─────────────────────────────────────────┤
│                                         │
│   Calendar                              │
│   (Full Width, Top)                     │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│   Form + Warning                        │
│   (Full Width, Bottom)                  │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎨 Color Palette

### Conflict Warning
```css
Background:     linear-gradient(135deg, 
                  rgba(234, 179, 8, 0.15),   /* Yellow */
                  rgba(239, 68, 68, 0.1))    /* Red tint */
Border:         #f59e0b                      /* Orange */
Title:          #fbbf24                      /* Gold */
Subtitle:       #fde047                      /* Light yellow */
Badge:          linear-gradient(135deg, 
                  #f59e0b, #d97706)          /* Orange gradient */
Overlap:        #fbbf24                      /* Gold */
Labels:         #94a3b8                      /* Gray */
Values:         #f1f5f9                      /* White */
Footer BG:      rgba(59, 130, 246, 0.1)     /* Blue tint */
Footer Border:  rgba(59, 130, 246, 0.3)     /* Blue */
Footer Text:    #93c5fd                      /* Light blue */
```

### Override Dialog
```css
Background:     linear-gradient(145deg, 
                  #1e293b, #0f172a)          /* Dark gradient */
Border:         #ef4444                      /* Red */
Header Text:    #fca5a5                      /* Light red */
Warning Text:   #fca5a5                      /* Light red */
List Border:    #f59e0b                      /* Orange */
Detail Text:    #94a3b8                      /* Gray */
Cancel Button:  #1e293b / #334155            /* Dark gray */
Confirm Button: linear-gradient(135deg, 
                  #ef4444, #dc2626)          /* Red gradient */
```

---

## 🔧 Key CSS Classes Reference

### Conflict Warning
- `.booking-conflict-enhanced` - Main container
- `.conflict-header` - Top section with icon and title
- `.conflict-title` - "Booking Conflict Detected"
- `.conflict-subtitle` - Count of conflicts
- `.conflict-list` - Container for conflict items
- `.conflict-item` - Individual conflict card
- `.conflict-badge` - "CONFLICT 1", "CONFLICT 2", etc.
- `.conflict-overlap` - "2 days overlap"
- `.conflict-detail-row` - Each info row
- `.conflict-label` - "📋 Project:", "👤 Pilot:", etc.
- `.conflict-value` - Actual values
- `.conflict-footer` - Bottom tip section

### Override Dialog
- `.override-dialog-overlay` - Full-screen backdrop
- `.override-dialog` - Dialog container
- `.override-dialog-header` - Top with icon and title
- `.override-dialog-icon` - Pulsing ⚠️
- `.override-dialog-body` - Main content
- `.override-warning` - Warning message
- `.override-conflict-summary` - List of conflicts
- `.override-question` - Confirmation question
- `.override-dialog-actions` - Button container
- `.override-btn-cancel` - Cancel button
- `.override-btn-confirm` - Confirm button (red)

---

## 📏 Spacing & Sizing

```css
/* Conflict Warning */
Padding:        1rem
Gap:            0.75rem
Border Radius:  12px
Border Width:   2px

/* Conflict Items */
Padding:        0.75rem
Gap:            0.5rem
Border Radius:  8px
Border Width:   1px

/* Override Dialog */
Max Width:      500px
Padding:        1.5rem
Border Radius:  16px
Border Width:   2px

/* Buttons */
Padding:        0.875rem 1.5rem
Border Radius:  8px
Font Size:      0.9rem
```

---

## 💫 Interaction States

### Conflict Item
```
Normal:   background: rgba(15, 23, 42, 0.6)
          border: rgba(251, 191, 36, 0.3)
          
Hover:    (No hover effect - informational only)
```

### Override Buttons
```
Cancel:
  Normal:   bg: #1e293b, color: #94a3b8
  Hover:    bg: #334155, color: white

Confirm:
  Normal:   bg: red gradient, shadow: medium
  Hover:    bg: lighter red, shadow: large
            transform: translateY(-1px)
```

---

**Visual Guide Complete!**

This guide provides a complete visual reference for the enhanced conflict detection UI implementation.

---

**Last Updated:** February 6, 2026
