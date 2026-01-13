import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './BookingModal.css'

export default function BookingModal({ vehicle, onClose, onSave }) {
    const { user } = useAuth()
    const [selectedDates, setSelectedDates] = useState([])
    const [formData, setFormData] = useState({
        pilot: '',
        project: '',
        duration: '',
        notes: '',
        who_ordered: user?.email || ''
    })
    const [loading, setLoading] = useState(false)
    const [teamMembers, setTeamMembers] = useState([])

    // Calendar state
    const [currentMonth, setCurrentMonth] = useState(new Date())

    // Fetch team members from database
    useEffect(() => {
        const fetchTeamMembers = async () => {
            const { data, error } = await supabase
                .from('team_members')
                .select('display_name')
                .order('display_name')

            if (data) {
                setTeamMembers(data.map(m => m.display_name))
            }
        }
        fetchTeamMembers()
    }, [])

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

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
            const bookingData = {
                vehicle_id: vehicle.id,
                user_id: user.id,
                start_date: selectedDates[0],
                end_date: selectedDates[selectedDates.length - 1],
                pilot: formData.pilot,
                project: formData.project,
                duration: formData.duration,
                notes: formData.notes,
                who_ordered: formData.who_ordered || user?.email,
                status: 'confirmed'
            }

            const { error } = await supabase
                .from('bookings')
                .insert(bookingData)

            if (error) throw error

            await supabase.from('activities').insert({
                vehicle_id: vehicle.id,
                user_id: user.id,
                action_type: 'booking',
                content: `Booked ${vehicle.name} for ${formData.pilot} (${selectedDates[0]} to ${selectedDates[selectedDates.length - 1]})`
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
                        <h2>Book Vehicle</h2>
                        <p className="booking-modal-subtitle">Reserve: {vehicle.name}</p>
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
                                return (
                                    <div
                                        key={day}
                                        className={`calendar-day ${isDateSelected(day) ? 'selected' : ''}`}
                                        onClick={() => handleDateClick(day)}
                                    >
                                        {day}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Right: Form */}
                    <form onSubmit={handleSubmit} className="booking-form-section">
                        <div className="booking-form-group">
                            <label>Dates</label>
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
                            <input type="text" name="who_ordered" disabled value={user?.email || 'Current User'} />
                        </div>

                        <div className="booking-form-group">
                            <label>Pilot *</label>
                            <select name="pilot" value={formData.pilot} onChange={handleChange} required>
                                <option value="">Select a pilot</option>
                                {teamMembers.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="booking-form-group">
                            <label>Project</label>
                            <input
                                type="text"
                                name="project"
                                value={formData.project}
                                onChange={handleChange}
                                placeholder="Project name"
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

                        <div className="booking-modal-actions">
                            <button type="button" className="booking-btn-cancel" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="booking-btn-confirm" disabled={loading}>
                                {loading ? '⏳ Booking...' : '✓ Confirm Booking'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
