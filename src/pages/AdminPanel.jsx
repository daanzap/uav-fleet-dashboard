
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

import Header from '../components/Header'

export default function AdminPanel() {
    const { role } = useAuth()
    const [profiles, setProfiles] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (role === 'admin') {
            fetchProfiles()
        }
    }, [role])

    const fetchProfiles = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('email')

            if (error) throw error
            setProfiles(data || [])
        } catch (err) {
            console.error('Error fetching profiles:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleRoleChange = async (userId, newRole) => {
        try {
            // Optimistic update
            setProfiles(profiles.map(p => p.id === userId ? { ...p, role: newRole } : p))

            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId)

            if (error) throw error
        } catch (err) {
            alert('Failed to update role: ' + err.message)
            fetchProfiles() // Revert on error
        }
    }

    if (role !== 'admin') {
        return (
            <div className="dashboard-container">
                <Header title="Access Denied" />
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <p>Access Denied. Admins only.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="dashboard-container">
            <Header title="Admin Control Panel" />

            <div className="admin-content">
                <h2>User Management</h2>
                {loading ? <p>Loading users...</p> : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profiles.map(profile => (
                                <tr key={profile.id}>
                                    <td>{profile.email}</td>
                                    <td>
                                        <span className={`role-badge ${profile.role}`}>{profile.role}</span>
                                    </td>
                                    <td>
                                        <select
                                            value={profile.role}
                                            onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                                            disabled={profile.email === 'a.chang@deltaquad.com' || profile.email === 'chris@deltaquad.com'} // Prevent locking out super admins
                                        >
                                            <option value="viewer">Viewer</option>
                                            <option value="editor">Editor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
