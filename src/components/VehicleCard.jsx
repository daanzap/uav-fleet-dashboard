
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

    return (
        <div className="vehicle-card">
            <div className="card-header">
                <div className="title-row">
                    <h3>{vehicle.name}</h3>
                    <span className="risk-icon" title={`Risk Level: ${vehicle.risk_level}`}>
                        {RISK_ICONS[vehicle.risk_level] || '❓'}
                    </span>
                </div>
                <span className={`status-badge ${vehicle.status.toLowerCase()}`}>
                    {vehicle.status}
                </span>
            </div>

            <div className="vehicle-image">
                {vehicle.image_url ? (
                    <img src={vehicle.image_url} alt={vehicle.name} />
                ) : (
                    <div className="placeholder-image">No Image</div>
                )}
            </div>

            <div className="card-details">
                <p><strong>Type:</strong> {vehicle.type}</p>
                <p><strong>HW Config:</strong> {vehicle.hw_config || 'N/A'}</p>
                <p><strong>SW Version:</strong> {vehicle.sw_version || 'N/A'}</p>
                {vehicle.notes && <p className="notes"><em>{vehicle.notes}</em></p>}
            </div>

            <div className="card-actions">
                <button onClick={() => onViewHistory(vehicle)}>History</button>
                {isEditor && (
                    <>
                        <button className="btn-secondary" onClick={() => onEdit(vehicle)}>Edit</button>
                        <button className="btn-primary" onClick={() => onBook(vehicle)}>Book</button>
                    </>
                )}
            </div>
        </div>
    )
}
