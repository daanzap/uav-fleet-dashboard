
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function ActivityLog({ vehicle, onClose }) {
    const { user } = useAuth()
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [newComment, setNewComment] = useState('')
    const [filter, setFilter] = useState('')

    useEffect(() => {
        fetchLogs()
    }, [vehicle.id])

    const fetchLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('activities')
                .select(`
          *,
          profiles:user_id (email, role, avatar_url)
        `)
                .eq('vehicle_id', vehicle.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setLogs(data || [])
        } catch (err) {
            console.error('Error fetching logs:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddComment = async () => {
        if (!newComment.trim()) return

        try {
            const { error } = await supabase.from('activities').insert({
                vehicle_id: vehicle.id,
                user_id: user.id,
                action_type: 'comment',
                content: newComment
            })

            if (error) throw error
            setNewComment('')
            fetchLogs() // Refresh
        } catch (err) {
            alert('Failed to add comment: ' + err.message)
        }
    }

    const filteredLogs = logs.filter(log =>
        log.content.toLowerCase().includes(filter.toLowerCase()) ||
        log.action_type.toLowerCase().includes(filter.toLowerCase()) ||
        log.profiles?.email?.toLowerCase().includes(filter.toLowerCase())
    )

    return (
        <div className="modal-overlay">
            <div className="modal-content large">
                <div className="modal-header">
                    <h2>Activity Log: {vehicle.name}</h2>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>

                <div className="log-controls">
                    <input
                        className="search-input"
                        placeholder="Search history..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>

                <div className="log-list">
                    {loading ? <p>Loading history...</p> : filteredLogs.map(log => (
                        <div key={log.id} className={`log-item ${log.action_type}`}>
                            <div className="log-meta">
                                <span className="user">{log.profiles?.email || 'Unknown User'}</span>
                                <span className="time">{new Date(log.created_at).toLocaleString()}</span>
                            </div>
                            <div className="log-content">
                                <strong>[{log.action_type.toUpperCase()}]</strong> {log.content}
                            </div>
                        </div>
                    ))}
                    {!loading && filteredLogs.length === 0 && <p className="empty">No activities found.</p>}
                </div>

                <div className="add-comment-section">
                    <textarea
                        placeholder="Add a note or comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button className="btn-primary" onClick={handleAddComment}>Post Comment</button>
                </div>
            </div>
        </div>
    )
}
