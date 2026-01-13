import { useState } from 'react'
import './CalendarOverviewModal.css'

export default function CalendarOverviewModal({ onClose }) {
    const [currentMonth, setCurrentMonth] = useState(new Date())

    // MOCK MODE: Simulated bookings data
    const mockBookings = [
        { vehicle: 'DQ-Alpha', project: 'Survey Mission Alpha', pilot: 'Michael', start_date: '2026-01-15', end_date: '2026-01-15' },
        { vehicle: 'DQ-Beta', project: 'Training Exercise', pilot: 'Devon', start_date: '2026-01-16', end_date: '2026-01-17' },
        { vehicle: 'DQ-Gamma', project: 'Field Test Gamma', pilot: 'Renzo', start_date: '2026-01-18', end_date: '2026-01-20' },
        { vehicle: 'DQ-Alpha', project: 'Research Flight', pilot: 'Ezgi', start_date: '2026-01-22', end_date: '2026-01-22' },
        { vehicle: 'DQ-Beta', project: 'Delivery Test', pilot: 'Jaco', start_date: '2026-01-25', end_date: '2026-01-26' },
    ]

    const getDaysInMonth = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()
        return { daysInMonth, startingDayOfWeek, year, month }
    }

    const getBookingsForDate = (day) => {
        const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
            .toISOString().split('T')[0]

        return mockBookings.filter(booking => {
            const start = new Date(booking.start_date)
            const end = new Date(booking.end_date)
            const current = new Date(dateStr)
            return current >= start && current <= end
        })
    }

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth)
    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    const goToPrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
    }

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
    }

    const handleModalClick = (e) => {
        e.stopPropagation()
    }

    const today = new Date()
    const isToday = (day) => {
        return day === today.getDate() &&
            currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear()
    }

    return (
        <div className="calendar-overview-overlay" onClick={onClose}>
            <div className="calendar-overview-container" onClick={handleModalClick}>
                {/* Header */}
                <div className="calendar-overview-header">
                    <div className="calendar-overview-icon">📅</div>
                    <div>
                        <h2>Fleet Calendar Overview</h2>
                        <p className="calendar-overview-subtitle">Vehicle booking schedule</p>
                    </div>
                    <button onClick={onClose} className="calendar-overview-close">×</button>
                </div>

                {/* Calendar Controls */}
                <div className="calendar-overview-controls">
                    <button type="button" onClick={goToPrevMonth}>‹ Previous</button>
                    <span className="calendar-month-title">{monthName}</span>
                    <button type="button" onClick={goToNextMonth}>Next ›</button>
                </div>

                {/* Calendar Grid */}
                <div className="calendar-overview-grid">
                    {/* Day Headers */}
                    <div className="calendar-day-header">Sun</div>
                    <div className="calendar-day-header">Mon</div>
                    <div className="calendar-day-header">Tue</div>
                    <div className="calendar-day-header">Wed</div>
                    <div className="calendar-day-header">Thu</div>
                    <div className="calendar-day-header">Fri</div>
                    <div className="calendar-day-header">Sat</div>

                    {/* Empty cells before month starts */}
                    {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="calendar-day-cell empty" />
                    ))}

                    {/* Days of the month */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1
                        const bookings = getBookingsForDate(day)
                        const hasBookings = bookings.length > 0

                        return (
                            <div
                                key={day}
                                className={`calendar-day-cell ${isToday(day) ? 'today' : ''} ${hasBookings ? 'has-bookings' : ''}`}
                            >
                                <div className="calendar-day-number">{day}</div>

                                {hasBookings && (
                                    <div className="calendar-day-bookings">
                                        {bookings.map((booking, idx) => (
                                            <div
                                                key={idx}
                                                className="calendar-booking-chip"
                                                title={`${booking.vehicle} - ${booking.project} (${booking.pilot})`}
                                            >
                                                <span className="booking-vehicle">{booking.vehicle}</span>
                                                <span className="booking-project">{booking.project}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Legend */}
                <div className="calendar-overview-legend">
                    <div className="legend-item">
                        <div className="legend-color today-marker"></div>
                        <span>Today</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color booking-marker"></div>
                        <span>Has Bookings</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
