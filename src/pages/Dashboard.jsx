import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import VehicleCard from '../components/VehicleCard'
import BookingModal from '../components/BookingModal'
import EditVehicleModal from '../components/EditVehicleModal'
import ActivityLogModal from '../components/ActivityLog'
import ChangeHistoryModal from '../components/ChangeHistoryModal'

import Header from '../components/Header'

export default function Dashboard() {
    const { user, role } = useAuth()
    const [vehicles, setVehicles] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)

    // Modal States
    const [bookingVehicle, setBookingVehicle] = useState(null)
    const [editingVehicle, setEditingVehicle] = useState(null) // null = closed, {} = new, obj = edit
    const [historyVehicle, setHistoryVehicle] = useState(null)
    const [changeHistoryVehicle, setChangeHistoryVehicle] = useState(null)

    useEffect(() => {
        fetchVehicles()
    }, [])

    // Listen for "Add Vehicle" button click from Header
    useEffect(() => {
        const handleAddVehicle = () => {
            setEditingVehicle({}) // Open modal with empty vehicle (create mode)
        }
        window.addEventListener('open-add-vehicle-modal', handleAddVehicle)
        return () => window.removeEventListener('open-add-vehicle-modal', handleAddVehicle)
    }, [])

    const fetchVehicles = async () => {
        try {
            setLoading(true)
            const { data: vehiclesData, error: vehiclesError } = await supabase
                .from('vehicles')
                .select('*')
                .order('created_at', { ascending: false })

            if (vehiclesError) throw vehiclesError
            const raw = vehiclesData || []

            // Sort all vehicles alphabetically by name (no filtering)
            const sorted = [...raw].sort((a, b) => (a.name || '').localeCompare(b.name || ''))

            if (sorted.length === 0) {
                setVehicles([])
                setLoading(false)
                return
            }

            // Fetch upcoming bookings for all vehicles
            const vehicleIds = sorted.map(v => v.id)
            const now = new Date().toISOString()
            const { data: bookingsData } = await supabase
                .from('bookings')
                .select('id, vehicle_id, start_time, project_name')
                .in('vehicle_id', vehicleIds)
                .gte('start_time', now)
                .order('start_time', { ascending: true })

            // Map next booking to each vehicle
            const nextByVehicle = {}
            for (const b of bookingsData || []) {
                if (nextByVehicle[b.vehicle_id] == null) {
                    const start = b.start_time ? new Date(b.start_time) : null
                    nextByVehicle[b.vehicle_id] = {
                        project: b.project_name ?? '',
                        date: start ? start.toLocaleDateString(undefined, { dateStyle: 'medium' }) : '',
                    }
                }
            }

            setVehicles(sorted.map(v => ({
                ...v,
                next_booking: nextByVehicle[v.id] || null,
            })))
        } catch (error) {
            console.error('Error fetching vehicles:', error)
            setVehicles([])
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e) => {
        setSearchQuery(e.target.value)
    }

    const filteredVehicles = vehicles.filter(v =>
        v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.status?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const isEditor = role === 'editor' || role === 'admin'

    return (
        <div className="dashboard-container">
            <Header />

            <div className="dashboard-content">
                {loading ? (
                    <p>Loading fleet data...</p>
                ) : (
                    <>
                        <section className="dashboard-fleet-section" aria-label="Fleet vehicles">
                            <h2 className="dashboard-fleet-title">Fleet</h2>
                        </section>
                        <div className="vehicle-grid">
                        {filteredVehicles.map(vehicle => (
                            <VehicleCard
                                key={vehicle.id}
                                vehicle={vehicle}
                                onEdit={setEditingVehicle}
                                onBook={setBookingVehicle}
                                onViewHistory={setChangeHistoryVehicle}
                            />
                        ))}
                        {filteredVehicles.length === 0 && (
                            <p style={{ color: '#666', gridColumn: '1/-1', textAlign: 'center' }}>
                                No vehicles found matching "{searchQuery}"
                            </p>
                        )}
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            {bookingVehicle && (
                <BookingModal
                    vehicle={bookingVehicle}
                    onClose={() => setBookingVehicle(null)}
                    onSave={fetchVehicles}
                />
            )}

            {editingVehicle && (
                <EditVehicleModal
                    vehicle={editingVehicle}
                    onClose={() => setEditingVehicle(null)}
                    onSave={fetchVehicles}
                />
            )}

            {historyVehicle && (
                <ActivityLogModal vehicle={historyVehicle} onClose={() => setHistoryVehicle(null)} />
            )}

            {changeHistoryVehicle && (
                <ChangeHistoryModal
                    entityType="vehicle"
                    entityId={changeHistoryVehicle.id}
                    entityName={changeHistoryVehicle.name}
                    onClose={() => setChangeHistoryVehicle(null)}
                />
            )}
        </div>
    )
}
