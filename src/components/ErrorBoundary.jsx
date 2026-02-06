import { Component } from 'react'
import { handleError } from '../lib/errorHandler'
import './ErrorBoundary.css'

/**
 * Error Boundary Component
 * Catches React errors and displays fallback UI
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error,
            errorInfo
        })

        // Log error
        handleError(error, 'ErrorBoundary', {
            showToast: false,
            logToDatabase: true
        })

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Error Boundary caught an error:', error, errorInfo)
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        })
    }

    handleReload = () => {
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary-container">
                    <div className="error-boundary-content">
                        <div className="error-boundary-icon">⚠️</div>
                        
                        <h1 className="error-boundary-title">
                            Oops! Something went wrong
                        </h1>
                        
                        <p className="error-boundary-message">
                            We're sorry, but something unexpected happened. 
                            The error has been logged and we'll look into it.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="error-boundary-details">
                                <summary>Error Details (Development Only)</summary>
                                <div className="error-boundary-stack">
                                    <strong>Error:</strong> {this.state.error.toString()}
                                    <br /><br />
                                    <strong>Stack Trace:</strong>
                                    <pre>{this.state.errorInfo?.componentStack}</pre>
                                </div>
                            </details>
                        )}

                        <div className="error-boundary-actions">
                            <button 
                                onClick={this.handleReset}
                                className="error-boundary-btn error-boundary-btn-primary"
                            >
                                Try Again
                            </button>
                            <button 
                                onClick={this.handleReload}
                                className="error-boundary-btn error-boundary-btn-secondary"
                            >
                                Reload Page
                            </button>
                        </div>

                        <p className="error-boundary-help">
                            If this problem persists, please contact support.
                        </p>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
