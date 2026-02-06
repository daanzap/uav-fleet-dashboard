import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './CalendarOverviewModal.css'

export default function CalendarOverviewModal({ onClose }) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)

    // Monday = 0, Sunday = 6 (ISO-style; first day of week = Monday)
    const { daysInMonth, startOffsetMonday, year, month } = (() => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const getDaySundayBased = firstDay.getDay()
        const startOffsetMonday = (getDaySundayBased + 6) % 7
        return {
            daysInMonth: lastDay.getDate(),
            startOffsetMonday,
            year,
            month
        }
    })()

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        const monthStart = new Date(year, month, 1).toISOString()
        const monthEnd = new Date(year, month, daysInMonth, 23, 59, 59).toISOString()
        async function fetchBookings() {
            const { data, error } = await supabase
                .from('bookings')
                .select('id, start_time, end_time, project_name, pilot_name, who_ordered, vehicle_id, vehicles(name)')
                .lte('start_time', monthEnd)
                .gte('end_time', monthStart)
                .order('start_time', { ascending: true })
            if (cancelled) return
            if (error) {
                setBookings([])
                setLoading(false)
                return
            }
            const mapped = (data || []).map(b => {
                const v = b.vehicles
                const vehicleName = (typeof v === 'object' && v?.name) ? v.name : (v || 'Vehicle')
                return {
                    vehicle: vehicleName,
                    project: b.project_name ?? '',
                    pilot: b.pilot_name ?? '',
                    who_ordered: b.who_ordered ?? '',
                    start_date: b.start_time?.slice(0, 10) ?? '',
                    end_date: b.end_time?.slice(0, 10) ?? ''
                }
            })
            setBookings(mapped)
            setLoading(false)
        }
        fetchBookings()
        return () => { cancelled = true }
    }, [year, month, daysInMonth])

    const getBookingsForDate = (day) => {
        const dateStr = new Date(year, month, day).toISOString().split('T')[0]
        return bookings.filter(booking => {
            const start = booking.start_date
            const end = booking.end_date
            return dateStr >= start && dateStr <= end
        })
    }
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
                    <div className="calendar-overview-title-wrap">
                        <h2>Fleet Calendar Overview</h2>
                        <p className="calendar-overview-subtitle">Vehicle booking schedule</p>
                    </div>
                    <button type="button" onClick={onClose} className="calendar-overview-close" aria-label="Close">×</button>
                </div>

                {/* Calendar Controls */}
                <div className="calendar-overview-controls">
                    <button type="button" onClick={goToPrevMonth}>‹ Previous</button>
                    <span className="calendar-month-title">{monthName}</span>
                    <button type="button" onClick={goToNextMonth}>Next ›</button>
                </div>

                {/* Calendar Grid: header row Mon–Sun, then 6 rows of days (Monday first) */}
                <div className="calendar-overview-grid">
                    <div className="calendar-day-header">Mon</div>
                    <div className="calendar-day-header">Tue</div>
                    <div className="calendar-day-header">Wed</div>
                    <div className="calendar-day-header">Thu</div>
                    <div className="calendar-day-header">Fri</div>
                    <div className="calendar-day-header">Sat</div>
                    <div className="calendar-day-header">Sun</div>
                    {Array.from({ length: 6 * 7 }).map((_, cellIndex) => {
                        const dayNum = cellIndex - startOffsetMonday + 1
                        const isEmpty = dayNum < 1 || dayNum > daysInMonth
                        if (isEmpty) {
                            return <div key={`e-${cellIndex}`} className="calendar-day-cell empty" />
                        }
                        const dayBookings = getBookingsForDate(dayNum)
                        const hasBookings = dayBookings.length > 0
                        return (
                            <div
                                key={dayNum}
                                className={`calendar-day-cell ${isToday(dayNum) ? 'today' : ''} ${hasBookings ? 'has-bookings' : ''}`}
                            >
                                <div className="calendar-day-number">{dayNum}</div>
                                {hasBookings && (
                                    <div className="calendar-day-bookings">
                                        {dayBookings.map((booking, idx) => (
                                            <div
                                                key={idx}
                                                className="calendar-booking-chip"
                                                title={`${booking.vehicle} - ${booking.project}\nOrdered by: ${booking.who_ordered || 'Unknown'}\nPilot: ${booking.pilot || 'TBD'}`}
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

                {loading && (
                    <p className="calendar-loading">Loading bookings…</p>
                )}

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
