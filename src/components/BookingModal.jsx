import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { PILOT_OPTIONS } from '../lib/constants'
import db from '../lib/database'
import { logChange } from '../lib/changeLogger'
import './BookingModal.css'

const RISK_LEVEL_OPTIONS = ['Low', 'Medium', 'High']

function emailLocalPart(email) {
    if (!email || !email.includes('@')) return email || ''
    return email.slice(0, email.indexOf('@'))
}

export default function BookingModal({ vehicle, onClose, onSave }) {
    const { user, displayName } = useAuth()
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

    // Calendar state
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [existingBookings, setExistingBookings] = useState([])

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
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

    // Soft Lock: check conflict when dates change so user sees warning before submitting
    useEffect(() => {
        if (selectedDates.length === 0) {
            setConflictWarning(null)
            return
        }
        const start_time = new Date(selectedDates[0] + 'T00:00:00Z').toISOString()
        const end_time = new Date(selectedDates[selectedDates.length - 1] + 'T23:59:59Z').toISOString()
        db.getConflictBooking(vehicle.id, start_time, end_time)
            .then(conflict => {
                setConflictWarning(conflict ? { projectName: conflict.project_name || 'another booking' } : null)
            })
            .catch(() => setConflictWarning(null))
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

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (selectedDates.length === 0) {
            alert('Please select at least one date')
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

            alert('Booking created successfully!')
            onClose()
            if (onSave) onSave()
        } catch (err) {
            alert('Error creating booking: ' + err.message)
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
                    <form onSubmit={handleSubmit} className="booking-form-section">
                        <div className="booking-form-group">
                            <label>Dates (Including Vehicle Transportation)</label>
                            <div className="selected-dates-display">
                                {selectedDates.length > 0 ? (
                                    selectedDates.map(d => formatDateDisplay(d)).join(', ')
                                ) : (
                                    <span style={{ color: '#64748b' }}>Select dates from calendar</span>
                                )}
                            </div>
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
                            <select name="pilot" value={formData.pilot} onChange={handleChange} required>
                                <option value="">Select a pilot</option>
                                {PILOT_OPTIONS.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
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
                            />
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

                        {conflictWarning && (
                            <div className="booking-conflict-warning" role="alert">
                                This slot is already booked by {conflictWarning.projectName}. Please coordinate with the owner.
                            </div>
                        )}

                        <div className="booking-modal-actions">
                            <button type="button" className="booking-btn-cancel" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="booking-btn-confirm" disabled={loading}>
                                {loading ? '⏳ Reserving...' : '✓ Confirm Reservation'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
