
import { useAuth } from '../contexts/AuthContext'

const RISK_ICONS = {
    high: '⚠️',    // Warning Triangle
    middle: '🛡️',  // Shield
    low: '✅'      // Check Circle
}

const STATUS_Map = {
    'Available': 'bg-green-500',
    'Maintenance': 'bg-yellow-500',
    'Mission': 'bg-blue-500',
    'Decommissioned': 'bg-gray-500'
}

export default function VehicleCard({ vehicle, onEdit, onBook, onViewHistory }) {
    const { role } = useAuth()
    const isEditor = role === 'editor' || role === 'admin'

    // Status mapping for colors/labels
    const getStatusStyle = (status) => {
        const s = status?.toLowerCase() || 'unknown'
        if (s.includes('available') || s.includes('ready')) return { className: 'status-ready', icon: '✓', label: 'Ready' }
        if (s.includes('maintenance')) return { className: 'status-maintenance', icon: '⚠️', label: 'Maintenance' }
        if (s.includes('mission')) return { className: 'status-mission', icon: '🚀', label: 'On Mission' }
        return { className: 'status-unknown', icon: '?', label: status }
    }

    const { className, icon, label } = getStatusStyle(vehicle.status)

    return (
        <div className="vehicle-card">
            {/* Header: Status & Edit */}
            <div className="card-top-row">
                <div className={`status-pill ${className}`}>
                    <span className="status-icon">{icon}</span>
                    <span className="status-label">{label}</span>
                </div>
                {isEditor && (
                    <button className="icon-btn-edit" onClick={() => onEdit(vehicle)} title="Edit Vehicle">
                        ✎
                    </button>
                )}
            </div>

            {/* Identity Section */}
            <div className="card-identity">
                <div className="icon-box">
                    🚀
                </div>
                <div className="id-text">
                    <span className="unit-label">UNIT IDENTIFIER</span>
                    <h2 className="unit-id">{vehicle.name}</h2>
                </div>
            </div>

            {/* Details */}
            <div className="card-main-info">
                <h3 className="vehicle-name">{vehicle.name}</h3>
                <p className="vehicle-desc">
                    {vehicle.type} • {vehicle.sw_version ? `v${vehicle.sw_version}` : 'No SW info'}
                    <br />
                    <span style={{ opacity: 0.7 }}>{vehicle.notes || "No operational notes provided."}</span>
                </p>
            </div>

            {/* Bookings Placeholder (Static for layout matching) */}
            <div className="booking-section">
                {/* Check if we have booking info, otherwise show placeholder */}
                {vehicle.next_booking ? (
                    <div className="booking-active">
                        <span className="booking-date">{vehicle.next_booking.date}</span>
                        <span className="booking-user">{vehicle.next_booking.user}</span>
                    </div>
                ) : (
                    <div className="booking-empty">No active bookings</div>
                )}
            </div>

            {/* Action Button */}
            <div className="card-footer">
                <button className="btn-book-now" onClick={() => onBook(vehicle)}>
                    <span style={{ marginRight: '6px' }}>📝</span> BOOK NOW
                </button>
            </div>
        </div>
    )
}
