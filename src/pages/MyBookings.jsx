import { useState, useEffect } from 'react'
import Header from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { handleError } from '../lib/errorHandler'
import db from '../lib/database'
import { hardwareConfigToText } from '../lib/hardwareConfig'
import { DashboardSkeleton } from '../components/LoadingSkeleton'

function formatDate(iso) {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function formatTime(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function formatRange(start, end) {
    const s = formatDate(start)
    const t1 = formatTime(start)
    const t2 = formatTime(end)
    if (t1 && t2) return `${s} ${t1} – ${t2}`
    return s
}

export default function MyBookings() {
    const { user } = useAuth()
    const { showSuccess, showError } = useToast()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchBookings = async () => {
        if (!user?.id) return
        try {
            setLoading(true)
            const data = await db.getBookingsByUser(user.id)
            setBookings(data)
        } catch (error) {
            console.error('MyBookings fetch error:', error)
            const details = await handleError(error, 'MyBookings.fetchBookings', { userId: user?.id })
            showError(details.message)
            setBookings([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBookings()
    }, [user?.id])

    const handleDeleteBooking = async (booking) => {
        if (!booking?.id) return
        const project = booking.project_name || 'This booking'
        const confirmed = window.confirm(
            `Cancel booking "${project}"? It will be removed from your list (soft delete).`
        )
        if (!confirmed) return
        try {
            await db.deleteBooking(booking.id)
            showSuccess('Booking cancelled.')
            fetchBookings()
        } catch (error) {
            console.error('Delete booking error:', error)
            const details = await handleError(error, 'MyBookings.handleDeleteBooking', { userId: user?.id })
            showError(details.message)
        }
    }

    const vehicleName = (b) => (b.vehicles && (b.vehicles.name ?? b.vehicles)) || '—'

    return (
        <div className="dashboard-container">
            <Header />
            <div className="dashboard-content">
                <section className="dashboard-fleet-section" aria-label="My bookings">
                    <h2 className="dashboard-fleet-title">My Bookings</h2>
                </section>

                {loading ? (
                    <DashboardSkeleton count={4} />
                ) : bookings.length === 0 ? (
                    <div className="my-bookings-empty">
                        <p>You have no bookings yet.</p>
                        <p style={{ opacity: 0.8, marginTop: '0.5rem' }}>
                            Reserve a vehicle from the Dashboard to see them here.
                        </p>
                    </div>
                ) : (
                    <div className="my-bookings-list">
                        {bookings.map((b) => (
                            <div key={b.id} className="my-booking-card">
                                <div className="my-booking-main">
                                    <h3 className="my-booking-project">{b.project_name?.trim() || '—'}</h3>
                                    <div className="my-booking-meta">
                                        <span>🚀 {vehicleName(b)}</span>
                                        <span>📅 {formatRange(b.start_time, b.end_time)}</span>
                                        {b.who_ordered != null && b.who_ordered !== '' && <span>Ordered by: {b.who_ordered}</span>}
                                        {b.pilot_name != null && b.pilot_name !== '' && <span>👤 {b.pilot_name}</span>}
                                    </div>
                                    {b.notes && (
                                        <p className="my-booking-notes">{b.notes}</p>
                                    )}
                                    {b.snapshotted_hw_config && hardwareConfigToText(b.snapshotted_hw_config) && (
                                        <p className="my-booking-hw" title="Hardware config at time of booking (snapshot)">
                                            ⚙️ {hardwareConfigToText(b.snapshotted_hw_config)}
                                        </p>
                                    )}
                                </div>
                                <div className="my-booking-actions">
                                    <button
                                        type="button"
                                        className="btn-cancel-booking"
                                        onClick={() => handleDeleteBooking(b)}
                                        title="Cancel this booking"
                                    >
                                        Cancel booking
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
