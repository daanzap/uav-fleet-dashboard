
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function EditVehicleModal({ vehicle, onClose }) {
    const { user } = useAuth()
    const isNew = !vehicle?.id

    const [formData, setFormData] = useState({
        name: vehicle?.name || '',
        type: vehicle?.type || 'uav',
        status: vehicle?.status || 'Available',
        risk_level: vehicle?.risk_level || 'low',
        hw_config: vehicle?.hw_config || '',
        sw_version: vehicle?.sw_version || '',
        image_url: vehicle?.image_url || '',
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
            // 1. Upsert Vehicle
            const payload = { ...formData }
            if (!isNew) payload.id = vehicle.id

            const { data, error } = await supabase
                .from('vehicles')
                .upsert(payload)
                .select()
                .single()

            if (error) throw error

            // 2. Log Activity
            await supabase.from('activities').insert({
                vehicle_id: data.id,
                user_id: user.id,
                action_type: 'status_change',
                content: isNew ? `Created vehicle ${data.name}` : `Updated vehicle details (SW: ${data.sw_version})`
            })

            onClose()
            window.location.reload()
        } catch (err) {
            alert('Error saving vehicle: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{isNew ? 'Add New Vehicle' : 'Edit Vehicle'}</h2>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name</label>
                        <input name="name" required value={formData.name} onChange={handleChange} />
                    </div>

                    <div className="row">
                        <div className="form-group">
                            <label>Type</label>
                            <select name="type" value={formData.type} onChange={handleChange}>
                                <option value="uav">UAV</option>
                                <option value="ugv">UGV</option>
                                <option value="usv">USV</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Risk Level</label>
                            <select name="risk_level" value={formData.risk_level} onChange={handleChange}>
                                <option value="low">Low (✅)</option>
                                <option value="middle">Middle (🛡️)</option>
                                <option value="high">High (⚠️)</option>
                            </select>
                        </div>
                    </div>

                    <div className="row">
                        <div className="form-group">
                            <label>Status</label>
                            <select name="status" value={formData.status} onChange={handleChange}>
                                <option value="Available">Available</option>
                                <option value="Mission">Mission</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Decommissioned">Decommissioned</option>
                            </select>
                        </div>
                    </div>

                    <div className="row">
                        <div className="form-group">
                            <label>HW Config</label>
                            <input name="hw_config" value={formData.hw_config} onChange={handleChange} placeholder="e.g. V3.1 Frame" />
                        </div>
                        <div className="form-group">
                            <label>SW Version</label>
                            <input name="sw_version" value={formData.sw_version} onChange={handleChange} placeholder="e.g. v2.0.4" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Image URL</label>
                        <input name="image_url" value={formData.image_url} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label>Notes</label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" />
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Vehicle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
