import Header from '../components/Header'

export default function AdminPanel() {
    return (
        <div className="dashboard-container">
            <Header title="Admin Control Panel" />

            <div className="dashboard-content" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingTop: '4rem' }}>
                <div style={{ padding: '3rem', border: '2px dashed #444', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                    <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0', opacity: 0.3 }}>🔧</h1>
                    <h2>Admin Dashboard</h2>
                    <p style={{ color: '#888' }}>This area is under construction.</p>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Only visible to whitelisted administrators.</p>
                </div>
            </div>
        </div>
    )
}
