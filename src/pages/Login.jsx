
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'


export default function Login() {
    const { signIn, signUp } = useAuth()
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [message, setMessage] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const generateStrongPassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+"
        let pass = ""
        for (let i = 0; i < 16; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setPassword(pass)
        setShowPassword(true) // Auto show so user can copy it
    }

    const validatePassword = (pass) => {
        const minLength = 12
        const hasUpper = /[A-Z]/.test(pass)
        const hasLower = /[a-z]/.test(pass)
        const hasNumber = /[0-9]/.test(pass)
        const hasSpecial = /[!@#$%^&*()_+]/.test(pass) // Consistent with generator chars

        if (pass.length < minLength) return "Password must be at least 12 characters long."
        if (!hasUpper) return "Password must contain at least one uppercase letter."
        if (!hasLower) return "Password must contain at least one lowercase letter."
        if (!hasNumber) return "Password must contain at least one number."
        if (!hasSpecial) return "Password must contain at least one special character (!@#$%^&*()_+)."
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        try {
            if (isSignUp) {
                // Enforce Strong Password
                const passwordError = validatePassword(password)
                if (passwordError) {
                    throw new Error(passwordError)
                }

                // SignUp Logic
                await signUp(email, password)
                setMessage('Registration successful! Please check your email for the confirmation link.')
            } else {
                // SignIn Logic
                await signIn(email, password)
            }
        } catch (error) {
            setMessage(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
                <p style={{ marginBottom: '1.5rem', color: '#888' }}>
                    {isSignUp ? 'Join the DeltaQuad Fleet System' : 'Sign in to access the dashboard'}
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        className="search-input"
                        type="email"
                        name="email"
                        autoComplete="username"
                        placeholder="Email (@deltaquad.com)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <div style={{ position: 'relative' }}>
                        <input
                            className="search-input"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            autoComplete={isSignUp ? "new-password" : "current-password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ width: '100%', paddingRight: '80px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.8rem'
                            }}
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>

                    {isSignUp && (
                        <button
                            type="button"
                            onClick={generateStrongPassword}
                            style={{
                                background: 'transparent', border: '1px dashed #666', color: '#aaa',
                                padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem'
                            }}
                        >
                            ✨ Generate Strong Password
                        </button>
                    )}

                    <button type="submit" className="auth-button" disabled={loading} style={{ background: isSignUp ? '#2196F3' : '#4CAF50' }}>
                        {loading ? 'Processing...' : (isSignUp ? 'Register' : 'Sign In')}
                    </button>
                </form>

                {message && <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', color: '#FFC107' }}>{message}</div>}

                <div style={{ marginTop: '1.5rem', borderTop: '1px solid #333', paddingTop: '1rem' }}>
                    <button
                        style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
                    >
                        {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Register'}
                    </button>
                </div>
            </div>
        </div >
    )
}
