
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const PILOTS = [
    'Devon', 'Edine', 'Ezgi', 'Michael', 'Quinten', 'Renzo', 'Tjeerd', 'Yamac'
]

export default function BookingModal({ vehicle, onClose }) {
    const { user } = useAuth()
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [pilot, setPilot] = useState('')
    const [mission, setMission] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            // 1. Create Booking
            const { error: bookingError } = await supabase.from('bookings').insert({
                vehicle_id: vehicle.id,
                user_id: user.id,
                start_time: startDate,
                end_time: endDate,
                pilot_name: pilot,
                mission_type: mission
            })
            if (bookingError) throw bookingError

            // 2. Update Vehicle Status
            const { error: vehicleError } = await supabase
                .from('vehicles')
                .update({ status: 'Mission' })
                .eq('id', vehicle.id)
            if (vehicleError) throw vehicleError

            // 3. Log Activity
            await supabase.from('activities').insert({
                vehicle_id: vehicle.id,
                user_id: user.id,
                action_type: 'booking',
                content: `Booked for ${mission} by ${pilot} (${startDate} to ${endDate})`
            })

            onClose()
            window.location.reload() // Simple reload to refresh dashboard state
        } catch (err) {
            alert('Error creating booking: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Book {vehicle.name}</h2>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Start Date</label>
                        <input type="datetime-local" required value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label>End Date</label>
                        <input type="datetime-local" required value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label>Pilot</label>
                        <select required value={pilot} onChange={e => setPilot(e.target.value)}>
                            <option value="">Select Pilot...</option>
                            {PILOTS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Mission Type / Notes</label>
                        <input type="text" required value={mission} onChange={e => setMission(e.target.value)} />
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} disabled={loading}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Booking...' : 'Confirm Booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
