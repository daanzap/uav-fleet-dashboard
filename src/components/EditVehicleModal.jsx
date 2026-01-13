
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './EditVehicleModal.css'

export default function EditVehicleModal({ vehicle, onClose, onSave }) {
    const { user } = useAuth()
    const isNew = !vehicle?.id

    const [formData, setFormData] = useState({
        name: vehicle?.name || '',
        status: vehicle?.status || 'Available',
        risk_level: vehicle?.risk_level || 'low',
        hw_config: vehicle?.hw_config || '',
        sw_version: vehicle?.sw_version || '',
        notes: vehicle?.notes || ''
    })
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const payload = { ...formData }
            if (!isNew) payload.id = vehicle.id

            const { data, error } = await supabase
                .from('vehicles')
                .upsert(payload)
                .select()
                .single()

            if (error) throw error

            await supabase.from('activities').insert({
                vehicle_id: data.id,
                user_id: user.id,
                action_type: 'status_change',
                content: isNew ? `Created vehicle ${data.name}` : `Updated vehicle details`
            })

            onClose()
            if (onSave) onSave()
        } catch (err) {
            alert('Error saving vehicle: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    // Stop propagation to prevent closing when clicking inside modal
    const handleModalClick = (e) => {
        e.stopPropagation()
    }

    return (
        <div className="edit-modal-overlay" onClick={onClose}>
            <div className="edit-modal-container" onClick={handleModalClick}>
                {/* Header */}
                <div className="edit-modal-header">
                    <div className="edit-modal-icon">
                        {isNew ? '🚀' : '✏️'}
                    </div>
                    <div>
                        <h2>{isNew ? 'Add New Vehicle' : 'Edit Vehicle'}</h2>
                        <p className="edit-modal-subtitle">
                            {isNew ? 'Configure your new fleet unit' : `Editing: ${vehicle?.name}`}
                        </p>
                    </div>
                    <button onClick={onClose} className="edit-modal-close">×</button>
                </div>

                <form onSubmit={handleSubmit} className="edit-modal-form">
                    {/* Vehicle Name */}
                    <div className="edit-form-group">
                        <label>Vehicle Name</label>
                        <input
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. DQ-Alpha"
                        />
                    </div>

                    {/* Status & Risk Level Row */}
                    <div className="edit-form-row">
                        <div className="edit-form-group">
                            <label>Status</label>
                            <div className="edit-select-wrapper">
                                <select name="status" value={formData.status} onChange={handleChange}>
                                    <option value="Available">✓ Available</option>
                                    <option value="Mission">🚀 On Mission</option>
                                    <option value="Maintenance">⚠️ Maintenance</option>
                                    <option value="Decommissioned">🚫 Decommissioned</option>
                                </select>
                            </div>
                        </div>
                        <div className="edit-form-group">
                            <label>Risk Level</label>
                            <div className="edit-select-wrapper">
                                <select name="risk_level" value={formData.risk_level} onChange={handleChange}>
                                    <option value="low">🟢 Low</option>
                                    <option value="middle">🟡 Medium</option>
                                    <option value="high">🔴 High</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* HW & SW Row */}
                    <div className="edit-form-row">
                        <div className="edit-form-group">
                            <label>Hardware Config</label>
                            <input
                                name="hw_config"
                                value={formData.hw_config}
                                onChange={handleChange}
                                placeholder="e.g. V3.1 Frame"
                            />
                        </div>
                        <div className="edit-form-group">
                            <label>Software Version</label>
                            <input
                                name="sw_version"
                                value={formData.sw_version}
                                onChange={handleChange}
                                placeholder="e.g. v2.0.4"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="edit-form-group">
                        <label>Operational Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Any additional notes about this vehicle..."
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="edit-modal-actions">
                        <button type="button" className="edit-btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="edit-btn-save" disabled={loading}>
                            {loading ? (
                                <span>⏳ Saving...</span>
                            ) : (
                                <span>{isNew ? '🚀 Create Vehicle' : '💾 Save Changes'}</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
