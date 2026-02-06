
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { isValidVehicleName, DEPARTMENT_PREFIXES } from '../lib/constants'
import { logChange } from '../lib/changeLogger'
import './EditVehicleModal.css'

export default function EditVehicleModal({ vehicle, onClose, onSave }) {
    const { user, displayName } = useAuth()
    const isNew = !vehicle?.id

    // Hardware config: plain text for now (no JSON); backward compat for existing object/JSON
    const getInitialHwConfig = () => {
        if (!vehicle?.hw_config) return ''
        if (typeof vehicle.hw_config === 'object') {
            if (vehicle.hw_config.raw != null) return String(vehicle.hw_config.raw)
            return JSON.stringify(vehicle.hw_config, null, 2)
        }
        return String(vehicle.hw_config)
    }

    const [formData, setFormData] = useState({
        name: vehicle?.name || '',
        status: vehicle?.status || 'Available',
        hw_config: getInitialHwConfig(),
        sw_version: vehicle?.sw_version || '',
        notes: vehicle?.notes || '',
        department: vehicle?.department || 'R&D'
    })
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        // Optional: Validate vehicle name format (soft validation - shows warning but allows proceed)
        if (!isValidVehicleName(formData.name)) {
            const confirmed = window.confirm(
                `⚠️ Vehicle name "${formData.name}" doesn't follow the standard naming convention.\n\n` +
                `Expected format: [Department]-[Identifier]\n` +
                `Examples:\n` +
                `  • RD-117 (R&D Department)\n` +
                `  • Training-933 (Pilot Training)\n` +
                `  • Marketing-001 (Marketing)\n\n` +
                `Do you want to continue anyway?`
            )
            if (!confirmed) return
        }
        
        setLoading(true)

        try {
            // For updates, fetch current vehicle data for before snapshot
            let beforeData = null
            if (!isNew) {
                const { data: currentVehicle } = await supabase
                    .from('vehicles')
                    .select('*')
                    .eq('id', vehicle.id)
                    .single()
                beforeData = currentVehicle
            }

            // Store hw_config as plain text in JSONB (single key) for now; format may change later
            const hwConfigValue = formData.hw_config.trim()
                ? { raw: formData.hw_config }
                : {}

            const payload = {
                name: formData.name,
                status: formData.status,
                hw_config: hwConfigValue,
                sw_version: formData.sw_version,
                notes: formData.notes,
                department: formData.department
            }
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

            // Log the change to change_logs table
            await logChange({
                entityType: 'vehicle',
                entityId: data.id,
                entityName: data.name,
                actionType: isNew ? 'create' : 'update',
                beforeData: beforeData,
                afterData: data,
                userId: user.id,
                userEmail: user.email,
                displayName: displayName || user.email
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
                    {/* Naming Convention Guide */}
                    <div style={{ 
                        background: '#f0f9ff', 
                        border: '1px solid #bae6fd',
                        padding: '12px', 
                        borderRadius: '6px',
                        marginBottom: '16px',
                        fontSize: '0.9em'
                    }}>
                        <strong style={{ color: '#0369a1' }}>📝 Naming Convention:</strong>
                        <div style={{ marginTop: '8px', color: '#0c4a6e', lineHeight: '1.6' }}>
                            <div>• <strong>R&D:</strong> RD-117, RD-125, RD-High Altitude</div>
                            <div>• <strong>Training:</strong> Training-933, Training_TBD</div>
                            <div>• <strong>Marketing:</strong> Marketing-001 (future)</div>
                        </div>
                    </div>

                    {/* Vehicle Name */}
                    <div className="edit-form-group">
                        <label>Vehicle Name</label>
                        <input
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. RD-117, Training-933, Marketing-001"
                        />
                        <small style={{ color: '#64748b', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                            Format: [Department]-[Identifier or Description]
                        </small>
                    </div>

                    {/* Status */}
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

                    {/* Department */}
                    <div className="edit-form-group">
                        <label>Department</label>
                        <div className="edit-select-wrapper">
                            <select name="department" value={formData.department} onChange={handleChange}>
                                <option value="R&D">R&D</option>
                                <option value="Training">Training</option>
                                <option value="Marketing">Marketing</option>
                            </select>
                        </div>
                    </div>

                    {/* Hardware Config: plain text for now (format may change later) */}
                    <div className="edit-form-group">
                        <label>Hardware Config</label>
                        <input
                            type="text"
                            name="hw_config"
                            value={formData.hw_config}
                            onChange={handleChange}
                            placeholder="e.g. Skynode SN-1024, Here3, SolidState-22Ah"
                        />
                    </div>

                    {/* Software Version */}
                    <div className="edit-form-group">
                        <label>Software Version</label>
                        <input
                            name="sw_version"
                            value={formData.sw_version}
                            onChange={handleChange}
                            placeholder="e.g. v2.0.4"
                        />
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
