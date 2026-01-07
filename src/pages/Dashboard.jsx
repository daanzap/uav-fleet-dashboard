
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import VehicleCard from '../components/VehicleCard'
import BookingModal from '../components/BookingModal'
import EditVehicleModal from '../components/EditVehicleModal'
import ActivityLogModal from '../components/ActivityLog'

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

    useEffect(() => {
        fetchVehicles()
    }, [])

    const fetchVehicles = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setVehicles(data || [])
        } catch (error) {
            console.error('Error fetching vehicles:', error)
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
                <div className="controls-row">
                    <input
                        type="text"
                        placeholder="Search vehicles via Name, Type, Status..."
                        className="search-input"
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                    {isEditor && (
                        <button className="btn-primary" onClick={() => setEditingVehicle({})}>
                            + Add Vehicle
                        </button>
                    )}
                </div>

                {loading ? (
                    <p>Loading fleet data...</p>
                ) : (
                    <div className="vehicle-grid">
                        {filteredVehicles.map(vehicle => (
                            <VehicleCard
                                key={vehicle.id}
                                vehicle={vehicle}
                                onEdit={setEditingVehicle}
                                onBook={setBookingVehicle}
                                onViewHistory={setHistoryVehicle}
                            />
                        ))}
                        {filteredVehicles.length === 0 && (
                            <p style={{ color: '#666', gridColumn: '1/-1', textAlign: 'center' }}>
                                No vehicles found matching "{searchQuery}"
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {bookingVehicle && (
                <BookingModal vehicle={bookingVehicle} onClose={() => setBookingVehicle(null)} />
            )}

            {editingVehicle && (
                <EditVehicleModal vehicle={editingVehicle} onClose={() => setEditingVehicle(null)} />
            )}

            {historyVehicle && (
                <ActivityLogModal vehicle={historyVehicle} onClose={() => setHistoryVehicle(null)} />
            )}
        </div>
    )
}
