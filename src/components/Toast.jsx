import { useState, useEffect, createContext, useContext } from 'react'
import './Toast.css'

// Toast Context
const ToastContext = createContext()

// Toast types
export const ToastType = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
}

/**
 * Toast Provider - Wrap your app with this
 */
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = (message, type = ToastType.INFO, duration = 5000) => {
        const id = Date.now() + Math.random()
        const toast = { id, message, type, duration }
        
        setToasts(prev => [...prev, toast])

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id)
            }, duration)
        }

        return id
    }

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }

    const showSuccess = (message, duration) => addToast(message, ToastType.SUCCESS, duration)
    const showError = (message, duration) => addToast(message, ToastType.ERROR, duration)
    const showWarning = (message, duration) => addToast(message, ToastType.WARNING, duration)
    const showInfo = (message, duration) => addToast(message, ToastType.INFO, duration)

    return (
        <ToastContext.Provider value={{ 
            addToast, 
            removeToast, 
            showSuccess, 
            showError, 
            showWarning, 
            showInfo 
        }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    )
}

/**
 * Hook to use toast notifications
 */
export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

/**
 * Toast Container - Displays all toasts
 */
function ToastContainer({ toasts, onRemove }) {
    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    toast={toast}
                    onClose={() => onRemove(toast.id)}
                />
            ))}
        </div>
    )
}

/**
 * Individual Toast Component
 */
function Toast({ toast, onClose }) {
    const [isExiting, setIsExiting] = useState(false)

    const handleClose = () => {
        setIsExiting(true)
        setTimeout(() => {
            onClose()
        }, 300) // Match animation duration
    }

    // Auto-close on duration
    useEffect(() => {
        if (toast.duration > 0) {
            const timer = setTimeout(() => {
                handleClose()
            }, toast.duration)
            return () => clearTimeout(timer)
        }
    }, [toast.duration])

    const getIcon = () => {
        switch (toast.type) {
            case ToastType.SUCCESS:
                return '✓'
            case ToastType.ERROR:
                return '✕'
            case ToastType.WARNING:
                return '⚠'
            case ToastType.INFO:
                return 'ℹ'
            default:
                return 'ℹ'
        }
    }

    return (
        <div 
            className={`toast toast-${toast.type} ${isExiting ? 'toast-exit' : ''}`}
            role="alert"
            aria-live="polite"
        >
            <div className="toast-icon">{getIcon()}</div>
            <div className="toast-message">{toast.message}</div>
            <button 
                className="toast-close" 
                onClick={handleClose}
                aria-label="Close notification"
            >
                ×
            </button>
        </div>
    )
}

export default Toast
