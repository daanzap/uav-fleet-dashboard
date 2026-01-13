import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
    const { signIn, signUp } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [message, setMessage] = useState('')
    const [robotChecked, setRobotChecked] = useState(false)

    // Password validation logic
    const validatePassword = (pass) => {
        if (pass.length < 12) return "Password must be at least 12 characters."
        if (!/[A-Z]/.test(pass)) return "Needs an uppercase letter."
        if (!/[a-z]/.test(pass)) return "Needs a lowercase letter."
        if (!/[0-9]/.test(pass)) return "Needs a number."
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!robotChecked) {
            setMessage('Please verify you are not a robot.')
            return
        }

        setLoading(true)
        setMessage('')

        try {
            if (isSignUp) {
                const passError = validatePassword(password)
                if (passError) throw new Error(passError)
                await signUp(email, password)
                setMessage('Registration successful! Check email.')
            } else {
                await signIn(email, password)
                navigate('/')
            }
        } catch (error) {
            setMessage(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem' }}>
                {/* Logo or Title Area */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                        {isSignUp ? 'Create Account' : 'Sign In'}
                    </h1>
                    <p style={{ color: '#aaa', fontSize: '0.95rem' }}>
                        to continue to UAV Fleet Command
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

                    <div className="input-group">
                        <label style={{ display: 'none' }}>Email</label>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={styles.input}
                        />
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'none' }}>Password</label>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={styles.input}
                        />
                    </div>

                    {/* Fake ReCAPTCHA */}
                    <div
                        onClick={() => setRobotChecked(!robotChecked)}
                        style={styles.captchaParams}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '24px', height: '24px',
                                border: '2px solid #c1c1c1', borderRadius: '2px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'white', cursor: 'pointer'
                            }}>
                                {robotChecked && <span style={{ color: 'green', fontWeight: 'bold' }}>✓</span>}
                            </div>
                            <span style={{ fontSize: '0.9rem', color: '#333' }}>I'm not a robot</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/RecaptchaLogo.svg/1024px-RecaptchaLogo.svg.png" alt="" style={{ width: '20px', opacity: 0.5 }} />
                            <span style={{ fontSize: '0.6rem', color: '#999' }}>reCAPTCHA</span>
                        </div>
                    </div>

                    {message && <div style={styles.error}>{message}</div>}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
                            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: '500' }}
                        >
                            {isSignUp ? 'Sign In instead' : 'Create account'}
                        </button>

                        <button type="submit" style={styles.button} disabled={loading}>
                            {loading ? '...' : (isSignUp ? 'Sign Up' : 'Next')}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}

const styles = {
    input: {
        width: '100%',
        padding: '13px 15px',
        fontSize: '1rem',
        borderRadius: '4px',
        border: '1px solid #555',
        background: '#121212',
        color: 'white',
        outline: 'none',
        transition: 'border-color 0.2s'
    },
    button: {
        padding: '10px 24px',
        background: '#2563eb',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '0.95rem'
    },
    captchaParams: {
        background: '#f9f9f9',
        border: '1px solid #d3d3d3',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '0.5rem',
        maxWidth: '300px'
    },
    error: {
        color: '#ff4444',
        fontSize: '0.9rem',
        textAlign: 'left'
    }
}
