import { useAuth } from '../contexts/AuthContext'
import { hardwareConfigToText, normalizeConfig } from '../lib/hardwareConfig'

const RISK_ICONS = {
    high: '⚠️',    // Warning Triangle
    middle: '🛡️',  // Shield
    low: '✅'      // Check Circle
}

const STATUS_Map = {
    'Available': 'bg-green-500',
    'Maintenance': 'bg-yellow-500',
    'Mission': 'bg-blue-500'
}

export default function VehicleCard({ vehicle, onEdit, onBook, onViewHistory, onDelete }) {
    const { role } = useAuth()
    const isEditor = role === 'editor' || role === 'admin'
    const isAdmin = role === 'admin'

    // Status mapping for colors/labels
    const getStatusStyle = (status) => {
        const s = status?.toLowerCase() || 'unknown'
        if (s.includes('available') || s.includes('ready')) return { className: 'status-ready', icon: '✓', label: 'Available' }
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <button className="icon-btn-edit" onClick={() => onEdit(vehicle)} title="Edit Vehicle">
                            ✎
                        </button>
                        {isAdmin && onDelete && (
                            <button
                                className="icon-btn-delete"
                                onClick={() => onDelete(vehicle)}
                                title="Delete Vehicle (soft delete)"
                                aria-label="Delete vehicle"
                            >
                                🗑
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Identity Section */}
            <div className="card-identity">
                <div className="id-text">
                    <h2 className="unit-id">{vehicle.name}</h2>
                </div>
            </div>

            {/* Details */}
            <div className="card-main-info">
                <p className="vehicle-desc">
                    {vehicle.type} • {vehicle.sw_version ? `v${vehicle.sw_version}` : 'No SW info'}
                    <br />
                    {vehicle.notes && <span style={{ opacity: 0.7 }}>{vehicle.notes}</span>}
                    {vehicle.hw_config && hardwareConfigToText(normalizeConfig(vehicle.hw_config)) && (
                        <>
                            <br />
                            <span className="vehicle-card-hw-preview" style={{ opacity: 0.85 }} title={hardwareConfigToText(normalizeConfig(vehicle.hw_config))}>
                                {hardwareConfigToText(normalizeConfig(vehicle.hw_config))}
                            </span>
                        </>
                    )}
                </p>
            </div>

            {/* Next booking */}
            <div className="booking-section">
                {vehicle.next_booking ? (
                    <div className="booking-active">
                        Next booking: {vehicle.next_booking.project || '—'} ({vehicle.next_booking.date || '—'})
                    </div>
                ) : (
                    <div className="booking-empty">No active bookings</div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="card-footer">
                <button className="btn-book-now" onClick={() => onBook(vehicle)}>
                    <span style={{ marginRight: '6px' }}>📝</span> RESERVE
                </button>
                <button 
                    className="btn-changelog" 
                    onClick={() => onViewHistory(vehicle)}
                    title="View change history"
                    style={{
                        background: '#334155',
                        border: 'none',
                        color: '#cbd5e1',
                        padding: '10px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#475569'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#334155'
                        e.currentTarget.style.transform = 'translateY(0)'
                    }}
                >
                    📜
                </button>
            </div>
        </div>
    )
}
