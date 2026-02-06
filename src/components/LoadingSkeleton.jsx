import './LoadingSkeleton.css'

/**
 * Reusable skeleton loading components
 * Provides visual feedback during data loading
 */

// Vehicle Card Skeleton
export function VehicleCardSkeleton() {
    return (
        <div className="vehicle-card skeleton-card">
            <div className="skeleton skeleton-image"></div>
            <div className="skeleton-content">
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton skeleton-text"></div>
                <div className="skeleton skeleton-text short"></div>
                <div className="skeleton-actions">
                    <div className="skeleton skeleton-button"></div>
                    <div className="skeleton skeleton-button"></div>
                </div>
            </div>
        </div>
    )
}

// Calendar Day Cell Skeleton
export function CalendarDaySkeleton() {
    return (
        <div className="calendar-day-cell skeleton-cell">
            <div className="skeleton skeleton-day-number"></div>
        </div>
    )
}

// Form Field Skeleton
export function FormFieldSkeleton({ width = '100%' }) {
    return (
        <div className="skeleton-form-field" style={{ width }}>
            <div className="skeleton skeleton-label"></div>
            <div className="skeleton skeleton-input"></div>
        </div>
    )
}

// Generic Loading Spinner
export function LoadingSpinner({ size = 'medium', text = null }) {
    const sizeClass = `spinner-${size}`
    
    return (
        <div className="loading-spinner-container">
            <div className={`loading-spinner ${sizeClass}`}>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
            </div>
            {text && <p className="loading-text">{text}</p>}
        </div>
    )
}

// Inline Spinner (for buttons)
export function InlineSpinner() {
    return (
        <span className="inline-spinner">
            <span className="spinner-dot"></span>
            <span className="spinner-dot"></span>
            <span className="spinner-dot"></span>
        </span>
    )
}

// Dashboard Grid Skeleton
export function DashboardSkeleton({ count = 6 }) {
    return (
        <div className="vehicle-grid">
            {Array.from({ length: count }).map((_, i) => (
                <VehicleCardSkeleton key={i} />
            ))}
        </div>
    )
}

// Calendar Grid Skeleton
export function CalendarGridSkeleton() {
    return (
        <div className="calendar-overview-grid skeleton-calendar">
            {/* Day headers */}
            <div className="calendar-day-header">Mon</div>
            <div className="calendar-day-header">Tue</div>
            <div className="calendar-day-header">Wed</div>
            <div className="calendar-day-header">Thu</div>
            <div className="calendar-day-header">Fri</div>
            <div className="calendar-day-header">Sat</div>
            <div className="calendar-day-header">Sun</div>
            
            {/* Skeleton cells */}
            {Array.from({ length: 42 }).map((_, i) => (
                <CalendarDaySkeleton key={i} />
            ))}
        </div>
    )
}
