import Header from '../components/Header'
import { useAuth } from '../contexts/AuthContext'

export default function Profile() {
    const { user, role } = useAuth()

    return (
        <div className="dashboard-container">
            <Header title="User Profile" />

            <div className="dashboard-content" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div className="vehicle-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%', background: '#2196F3',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold'
                        }}>
                            {user?.email?.[0].toUpperCase()}
                        </div>
                        <div>
                            <h2 style={{ margin: 0 }}>{user?.email}</h2>
                            <span className={`status-badge ${role === 'admin' ? 'mission' : 'available'}`} style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                                {role.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #333', paddingTop: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', color: '#888' }}>Account Details</h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ color: '#666', fontSize: '0.9rem' }}>Email Address</label>
                                <p style={{ margin: '0.2rem 0' }}>{user?.email}</p>
                            </div>
                            <div>
                                <label style={{ color: '#666', fontSize: '0.9rem' }}>User ID</label>
                                <p style={{ margin: '0.2rem 0', fontFamily: 'monospace', color: '#888' }}>{user?.id}</p>
                            </div>
                            <div>
                                <label style={{ color: '#666', fontSize: '0.9rem' }}>Last Sign In</label>
                                <p style={{ margin: '0.2rem 0', color: '#888' }}>{new Date(user?.last_sign_in_at).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #333' }}>
                        <p style={{ color: '#666', fontStyle: 'italic' }}>
                            Account settings are managed via the central DeltaQuad directory.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
