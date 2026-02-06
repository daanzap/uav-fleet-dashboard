import { useState, useEffect } from 'react'
import { getChangeHistory, formatChangedFields, getFieldLabel } from '../lib/changeLogger'
import './ChangeHistoryModal.css'

export default function ChangeHistoryModal({ entityType, entityId, entityName, onClose }) {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedEntries, setExpandedEntries] = useState(new Set())

    useEffect(() => {
        loadHistory()
    }, [entityType, entityId])

    const loadHistory = async () => {
        setLoading(true)
        try {
            const data = await getChangeHistory(entityType, entityId)
            setHistory(data)
        } catch (err) {
            console.error('Error loading change history:', err)
        } finally {
            setLoading(false)
        }
    }

    const toggleExpanded = (entryId) => {
        setExpandedEntries(prev => {
            const newSet = new Set(prev)
            if (newSet.has(entryId)) {
                newSet.delete(entryId)
            } else {
                newSet.add(entryId)
            }
            return newSet
        })
    }

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp)
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getActionIcon = (actionType) => {
        switch (actionType) {
            case 'create': return '✨'
            case 'update': return '✏️'
            case 'delete': return '🗑️'
            default: return '📝'
        }
    }

    const getActionColor = (actionType) => {
        switch (actionType) {
            case 'create': return '#10b981'
            case 'update': return '#3b82f6'
            case 'delete': return '#ef4444'
            default: return '#6b7280'
        }
    }

    const renderValue = (value) => {
        if (value === null || value === undefined) return <em style={{ color: '#94a3b8' }}>empty</em>
        if (typeof value === 'object') return <code>{JSON.stringify(value, null, 2)}</code>
        if (typeof value === 'boolean') return value ? 'Yes' : 'No'
        return String(value)
    }

    const handleModalClick = (e) => {
        e.stopPropagation()
    }

    return (
        <div className="change-history-overlay" onClick={onClose}>
            <div className="change-history-container" onClick={handleModalClick}>
                {/* Header */}
                <div className="change-history-header">
                    <div className="change-history-icon">📜</div>
                    <div>
                        <h2>Change History</h2>
                        <p className="change-history-subtitle">{entityName}</p>
                    </div>
                    <button onClick={onClose} className="change-history-close">×</button>
                </div>

                {/* Body */}
                <div className="change-history-body">
                    {loading ? (
                        <div className="change-history-loading">
                            <div className="spinner"></div>
                            <p>Loading change history...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="change-history-empty">
                            <p>No change history available</p>
                            <small>Changes will appear here once edits are made</small>
                        </div>
                    ) : (
                        <div className="change-history-timeline">
                            {history.map((entry, index) => {
                                const isExpanded = expandedEntries.has(entry.id)
                                const changedFields = formatChangedFields(entry.changed_fields)
                                const hasDetails = changedFields.length > 0 || entry.notes

                                return (
                                    <div key={entry.id} className="timeline-entry">
                                        {/* Timeline connector */}
                                        {index < history.length - 1 && (
                                            <div className="timeline-connector"></div>
                                        )}

                                        {/* Timeline dot */}
                                        <div 
                                            className="timeline-dot" 
                                            style={{ backgroundColor: getActionColor(entry.action_type) }}
                                        >
                                            {getActionIcon(entry.action_type)}
                                        </div>

                                        {/* Timeline content */}
                                        <div className="timeline-content">
                                            <div className="timeline-header">
                                                <div className="timeline-header-left">
                                                    <span 
                                                        className="timeline-action"
                                                        style={{ color: getActionColor(entry.action_type) }}
                                                    >
                                                        {entry.action_type.charAt(0).toUpperCase() + entry.action_type.slice(1)}
                                                    </span>
                                                    <span className="timeline-user">
                                                        by {entry.user_display_name || entry.user_email}
                                                    </span>
                                                </div>
                                                <span className="timeline-timestamp">
                                                    {formatTimestamp(entry.created_at)}
                                                </span>
                                            </div>

                                            {entry.notes && (
                                                <div className="timeline-notes">
                                                    {entry.notes}
                                                </div>
                                            )}

                                            {/* Changed fields summary */}
                                            {changedFields.length > 0 && (
                                                <div className="timeline-changes-summary">
                                                    <button
                                                        className="timeline-expand-btn"
                                                        onClick={() => toggleExpanded(entry.id)}
                                                    >
                                                        {isExpanded ? '▼' : '▶'} 
                                                        {changedFields.length} field{changedFields.length !== 1 ? 's' : ''} changed
                                                    </button>
                                                </div>
                                            )}

                                            {/* Expanded details */}
                                            {isExpanded && changedFields.length > 0 && (
                                                <div className="timeline-changes-details">
                                                    {changedFields.map(({ field, oldValue, newValue }) => (
                                                        <div key={field} className="change-field">
                                                            <div className="change-field-label">
                                                                {getFieldLabel(field)}
                                                            </div>
                                                            <div className="change-field-values">
                                                                <div className="change-old-value">
                                                                    <span className="value-label">Before:</span>
                                                                    {renderValue(oldValue)}
                                                                </div>
                                                                <div className="change-arrow">→</div>
                                                                <div className="change-new-value">
                                                                    <span className="value-label">After:</span>
                                                                    {renderValue(newValue)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="change-history-footer">
                    <button className="change-history-btn-close" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
