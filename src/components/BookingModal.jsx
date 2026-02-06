import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from './Toast'
import { handleError } from '../lib/errorHandler'
import { PILOT_OPTIONS } from '../lib/constants'
import db from '../lib/database'
import { logChange } from '../lib/changeLogger'
import { InlineSpinner } from './LoadingSkeleton'
import './BookingModal.css'

const RISK_LEVEL_OPTIONS = ['Low', 'Medium', 'High']

function emailLocalPart(email) {
    if (!email || !email.includes('@')) return email || ''
    return email.slice(0, email.indexOf('@'))
}

export default function BookingModal({ vehicle, onClose, onSave }) {
    const { user, displayName } = useAuth()
    const { showSuccess, showError } = useToast()
    const userName = displayName ?? emailLocalPart(user?.email) ?? 'Current User'
    const [selectedDates, setSelectedDates] = useState([])
    const [whoOrderedMode, setWhoOrderedMode] = useState('me') // 'me' | 'others'
    const [whoOrderedCustom, setWhoOrderedCustom] = useState('')
    const [formData, setFormData] = useState({
        pilot: '',
        project: '',
        risk_level: '',
        location: '',
        duration: '',
        notes: '',
        who_ordered: userName
    })
    const [loading, setLoading] = useState(false)
    const [conflictWarning, setConflictWarning] = useState(null)
    const [conflictingBookings, setConflictingBookings] = useState([])
    const [showOverrideDialog, setShowOverrideDialog] = useState(false)
    const [overrideConfirmed, setOverrideConfirmed] = useState(false)
    const [checkingConflicts, setCheckingConflicts] = useState(false)

    // Calendar state
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [existingBookings, setExistingBookings] = useState([])
    
    // Validation state
    const [validationErrors, setValidationErrors] = useState({})

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })
        
        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[name]
                return newErrors
            })
        }
    }
    
    // Real-time validation
    const validateForm = () => {
        const errors = {}
        
        if (selectedDates.length === 0) {
            errors.dates = 'Please select at least one date'
        }
        
        if (!formData.pilot) {
            errors.pilot = 'Pilot is required'
        }
        
        if (!formData.project || formData.project.trim() === '') {
            errors.project = 'Project name is required'
        }
        
        setValidationErrors(errors)
        return Object.keys(errors).length === 0
    }

    const whoOrderedValue = whoOrderedMode === 'others' ? whoOrderedCustom : userName

    // Fetch existing bookings for this vehicle to show in calendar
    useEffect(() => {
        async function fetchExistingBookings() {
            const year = currentMonth.getFullYear()
            const month = currentMonth.getMonth()
            const monthStart = new Date(year, month, 1).toISOString()
            const monthEnd = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
            
            const { data, error } = await supabase
                .from('bookings')
                .select('start_time, end_time, project_name')
                .eq('vehicle_id', vehicle.id)
                .lte('start_time', monthEnd)
                .gte('end_time', monthStart)
            
            if (!error && data) {
                const bookings = data.map(b => ({
                    start_date: b.start_time?.slice(0, 10) ?? '',
                    end_date: b.end_time?.slice(0, 10) ?? '',
                    project: b.project_name ?? ''
                }))
                setExistingBookings(bookings)
            }
        }
        fetchExistingBookings()
    }, [vehicle.id, currentMonth])

    // Enhanced conflict detection: check for ALL conflicting bookings when dates change
    useEffect(() => {
        if (selectedDates.length === 0) {
            setConflictWarning(null)
            setConflictingBookings([])
            setCheckingConflicts(false)
            return
        }
        
        setCheckingConflicts(true)
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
            .finally(() => {
                setCheckingConflicts(false)
            })
    }, [vehicle.id, selectedDates.join(',')])

    // Calendar functions
    const getDaysInMonth = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()

        return { daysInMonth, startingDayOfWeek, year, month }
    }

    const handleDateClick = (day) => {
        const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        const dateStr = clickedDate.toISOString().split('T')[0]

        setSelectedDates(prev => {
            if (prev.includes(dateStr)) {
                return prev.filter(d => d !== dateStr)
            } else {
                return [...prev, dateStr].sort()
            }
        })
    }

    const isDateSelected = (day) => {
        const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
            .toISOString().split('T')[0]
        return selectedDates.includes(dateStr)
    }

    const getBookingForDate = (day) => {
        const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
            .toISOString().split('T')[0]
        return existingBookings.find(booking => 
            dateStr >= booking.start_date && dateStr <= booking.end_date
        )
    }

    const formatDateDisplay = (dateStr) => {
        const date = new Date(dateStr)
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${month}/${day}`
    }

    const formatDateTimeFull = (isoString) => {
        const date = new Date(isoString)
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const year = date.getFullYear()
        return `${month}/${day}/${year}`
    }

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

    const handleOverrideConfirm = () => {
        setShowOverrideDialog(false)
        setOverrideConfirmed(true)
        // Trigger form submission after state update
        setTimeout(() => {
            document.getElementById('booking-form').requestSubmit()
        }, 0)
    }

    const handleOverrideCancel = () => {
        setShowOverrideDialog(false)
    }
    
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // ESC to close modal
            if (e.key === 'Escape' && !showOverrideDialog) {
                onClose()
            }
            // ESC to close override dialog
            if (e.key === 'Escape' && showOverrideDialog) {
                handleOverrideCancel()
            }
        }
        
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [showOverrideDialog])
    
    // Focus management - focus first input on mount
    useEffect(() => {
        const firstInput = document.querySelector('.booking-form-section select[name="pilot"]')
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100)
        }
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validate form
        if (!validateForm()) {
            showError('Please fill in all required fields')
            return
        }

        // If there are conflicts and user hasn't confirmed override, show dialog
        if (conflictingBookings.length > 0 && !overrideConfirmed) {
            setShowOverrideDialog(true)
            return
        }

        setLoading(true)

        try {
            const startDate = selectedDates[0]
            const endDate = selectedDates[selectedDates.length - 1]
            const start_time = new Date(startDate + 'T00:00:00Z').toISOString()
            const end_time = new Date(endDate + 'T23:59:59Z').toISOString()

            // Fetch current vehicle hardware config for snapshot
            const { data: vehicleData } = await supabase
                .from('vehicles')
                .select('hw_config')
                .eq('id', vehicle.id)
                .single()

            const bookingData = {
                vehicle_id: vehicle.id,
                user_id: user.id,
                start_time,
                end_time,
                pilot_name: formData.pilot,
                project_name: formData.project || null,
                risk_level: formData.risk_level || null,
                location: formData.location || null,
                duration: formData.duration || null,
                notes: formData.notes || null,
                who_ordered: whoOrderedValue || userName || user?.email || null,
                status: 'confirmed',
                snapshotted_hw_config: vehicleData?.hw_config || null
            }

            const { data: newBooking, error } = await supabase
                .from('bookings')
                .insert(bookingData)
                .select()
                .single()

            if (error) throw error

            await supabase.from('activities').insert({
                vehicle_id: vehicle.id,
                user_id: user.id,
                action_type: 'booking',
                content: `Booked ${vehicle.name} for ${formData.pilot} (${selectedDates[0]} to ${selectedDates[selectedDates.length - 1]})`
            })

            // Log the booking creation to change_logs table
            await logChange({
                entityType: 'booking',
                entityId: newBooking.id,
                entityName: formData.project || `Booking for ${vehicle.name}`,
                actionType: 'create',
                beforeData: null,
                afterData: newBooking,
                userId: user.id,
                userEmail: user.email,
                displayName: displayName || user.email,
                notes: `Booked ${vehicle.name} from ${startDate} to ${endDate}`
            })

            showSuccess(`Booking created successfully for ${vehicle.name}!`)
            onClose()
            if (onSave) onSave()
        } catch (err) {
            const errorDetails = await handleError(err, 'BookingModal.save', {
                userId: user.id,
                userEmail: user.email,
                displayName: displayName || user.email
            })
            showError(errorDetails.message)
        } finally {
            setLoading(false)
        }
    }

    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)
    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    const handleModalClick = (e) => {
        e.stopPropagation()
    }

    const goToPrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
    }

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
    }

    return (
        <div className="booking-modal-overlay" onClick={onClose}>
            <div className="booking-modal-container" onClick={handleModalClick}>
                {/* Header */}
<div className="booking-modal-header">
                    <div className="booking-modal-icon">📅</div>
                    <div>
                        <h2>Reserve Vehicle</h2>
                        <p className="booking-modal-subtitle">Reserving: {vehicle.name}</p>
                    </div>
                    <button onClick={onClose} className="booking-modal-close">×</button>
                </div>

                <div className="booking-modal-body">
                    {/* Left: Calendar */}
                    <div className="booking-calendar-section">
                        <div className="calendar-header">
                            <button type="button" onClick={goToPrevMonth}>‹</button>
                            <span>{monthName}</span>
                            <button type="button" onClick={goToNextMonth}>›</button>
                        </div>
                        <div className="calendar-grid">
                            <div className="calendar-day-header">Sun</div>
                            <div className="calendar-day-header">Mon</div>
                            <div className="calendar-day-header">Tue</div>
                            <div className="calendar-day-header">Wed</div>
                            <div className="calendar-day-header">Thu</div>
                            <div className="calendar-day-header">Fri</div>
                            <div className="calendar-day-header">Sat</div>

                            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                                <div key={`empty-${i}`} className="calendar-day-empty" />
                            ))}

                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1
                                const booking = getBookingForDate(day)
                                const hasBooking = !!booking
                                return (
                                    <div
                                        key={day}
                                        className={`calendar-day ${isDateSelected(day) ? 'selected' : ''} ${hasBooking ? 'has-booking' : ''}`}
                                        onClick={() => handleDateClick(day)}
                                        title={hasBooking ? `Already booked: ${booking.project}` : ''}
                                    >
                                        <div>{day}</div>
                                        {hasBooking && (
                                            <div style={{ 
                                                fontSize: '0.65rem', 
                                                color: '#f59e0b', 
                                                marginTop: '2px',
                                                fontWeight: '600',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {booking.project.slice(0, 8)}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Right: Form */}
                    <form id="booking-form" onSubmit={handleSubmit} className="booking-form-section">
                        <div className="booking-form-group">
                            <label>Dates (Including Vehicle Transportation) *</label>
                            <div className={`selected-dates-display ${validationErrors.dates ? 'error' : ''}`}>
                                {selectedDates.length > 0 ? (
                                    selectedDates.map(d => formatDateDisplay(d)).join(', ')
                                ) : (
                                    <span style={{ color: '#64748b' }}>Select dates from calendar</span>
                                )}
                            </div>
                            {validationErrors.dates && (
                                <span className="validation-error">{validationErrors.dates}</span>
                            )}
                        </div>

                        <div className="booking-form-group">
                            <label>Who Ordered</label>
                            <select
                                value={whoOrderedMode}
                                onChange={(e) => {
                                    const mode = e.target.value
                                    setWhoOrderedMode(mode)
                                    if (mode === 'me') setWhoOrderedCustom('')
                                }}
                            >
                                <option value="me">{userName}</option>
                                <option value="others">Others</option>
                            </select>
                            {whoOrderedMode === 'others' && (
                                <input
                                    type="text"
                                    value={whoOrderedCustom}
                                    onChange={(e) => setWhoOrderedCustom(e.target.value)}
                                    placeholder="Enter name"
                                    className="booking-who-ordered-custom"
                                />
                            )}
                        </div>

                        <div className="booking-form-group">
                            <label>Pilot *</label>
                            <select 
                                name="pilot" 
                                value={formData.pilot} 
                                onChange={handleChange} 
                                required
                                className={validationErrors.pilot ? 'error' : ''}
                                aria-invalid={!!validationErrors.pilot}
                                aria-describedby={validationErrors.pilot ? 'pilot-error' : undefined}
                            >
                                <option value="">Select a pilot</option>
                                {PILOT_OPTIONS.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                            {validationErrors.pilot && (
                                <span id="pilot-error" className="validation-error">{validationErrors.pilot}</span>
                            )}
                        </div>

                        <div className="booking-form-group">
                            <label>Project *</label>
                            <input
                                type="text"
                                name="project"
                                value={formData.project}
                                onChange={handleChange}
                                placeholder="Project name"
                                required
                                className={validationErrors.project ? 'error' : ''}
                                aria-invalid={!!validationErrors.project}
                                aria-describedby={validationErrors.project ? 'project-error' : undefined}
                            />
                            {validationErrors.project && (
                                <span id="project-error" className="validation-error">{validationErrors.project}</span>
                            )}
                        </div>

                        <div className="booking-form-group">
                            <label>Risk Level</label>
                            <select name="risk_level" value={formData.risk_level} onChange={handleChange}>
                                <option value="">Select level</option>
                                {RISK_LEVEL_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        <div className="booking-form-group">
                            <label>Location</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g. Lab, Outdoor Field, Customer Site"
                            />
                        </div>

                        <div className="booking-form-group">
                            <label>Duration</label>
                            <input
                                type="text"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                placeholder="e.g. 2 hours, Full day"
                            />
                        </div>

                        <div className="booking-form-group">
                            <label>Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Additional booking notes..."
                            />
                        </div>

                        {/* Conflict Check Loading */}
                        {checkingConflicts && (
                            <div className="booking-conflict-checking">
                                <InlineSpinner />
                                <span>Checking for conflicts...</span>
                            </div>
                        )}

                        {/* Enhanced Conflict Warning */}
                        {!checkingConflicts && conflictWarning && conflictingBookings.length > 0 && (
                            <div className="booking-conflict-enhanced" role="alert">
                                <div className="conflict-header">
                                    <div className="conflict-icon">⚠️</div>
                                    <div>
                                        <div className="conflict-title">
                                            Booking Conflict Detected
                                        </div>
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
                                                <div className="conflict-detail-row">
                                                    <span className="conflict-label">👤 Pilot:</span>
                                                    <span className="conflict-value">{conflict.pilot_name || 'Not specified'}</span>
                                                </div>
                                                <div className="conflict-detail-row">
                                                    <span className="conflict-label">📅 Dates:</span>
                                                    <span className="conflict-value">
                                                        {formatDateTimeFull(conflict.start_time)} - {formatDateTimeFull(conflict.end_time)}
                                                    </span>
                                                </div>
                                                {conflict.who_ordered && (
                                                    <div className="conflict-detail-row">
                                                        <span className="conflict-label">🎯 Ordered by:</span>
                                                        <span className="conflict-value">{conflict.who_ordered}</span>
                                                    </div>
                                                )}
                                                {conflict.location && (
                                                    <div className="conflict-detail-row">
                                                        <span className="conflict-label">📍 Location:</span>
                                                        <span className="conflict-value">{conflict.location}</span>
                                                    </div>
                                                )}
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

                        <div className="booking-modal-actions">
                            <button type="button" className="booking-btn-cancel" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="booking-btn-confirm" disabled={loading || checkingConflicts}>
                                {loading ? (
                                    <>
                                        <InlineSpinner />
                                        Reserving...
                                    </>
                                ) : (
                                    '✓ Confirm Reservation'
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Override Confirmation Dialog */}
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
                                        {conflictingBookings.map((conflict, idx) => (
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
                                <button 
                                    type="button" 
                                    className="override-btn-cancel"
                                    onClick={handleOverrideCancel}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="override-btn-confirm"
                                    onClick={handleOverrideConfirm}
                                >
                                    Yes, Create Booking Anyway
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
