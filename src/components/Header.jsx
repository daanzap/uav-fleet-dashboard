import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import CalendarOverviewModal from './CalendarOverviewModal'
import logoSrc from '../assets/logo.png'

export default function Header({ title }) {
    const { user, role, signOut } = useAuth()
    const [showMenu, setShowMenu] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const [showCalendarModal, setShowCalendarModal] = useState(false)
    const menuRef = useRef(null)
    const navigate = useNavigate()

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const handleLogout = async () => {
        await signOut()
        navigate('/')
    }

    const handleProfileClick = () => {
        navigate('/profile')
        setShowMenu(false)
    }

    const handleAdminClick = () => {
        if (role === 'admin') {
            navigate('/admin')
            setShowMenu(false)
        }
    }

    const handleAddVehicle = () => {
        // Trigger generic add action - in real app would open modal
        // For now we might need to pass this down or just alert
        const evt = new CustomEvent('open-add-vehicle-modal')
        window.dispatchEvent(evt)
    }

    const initial = user?.email ? user.email[0].toUpperCase() : '?'

    return (
        <header className="dashboard-header">
            <div className="title-section" onClick={() => navigate('/')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={logoSrc} alt="DQ" style={{ height: '2rem', width: 'auto', display: 'block' }} />
                    <h1 style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>
                        DQ VEHICLE DASHBOARD
                    </h1>
                </div>
            </div>

            <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

                {/* Search (Hidden in reference but user asked for it earlier, keeping it subtle) */}
                {showSearch ? (
                    <input
                        type="text"
                        className="search-input-header"
                        placeholder="Search..."
                        autoFocus
                        onBlur={(e) => !e.target.value && setShowSearch(false)}
                    />
                ) : (
                    <div className="icon-btn-header" onClick={() => setShowSearch(true)} title="Search">
                        🔍
                    </div>
                )}

                {/* Calendar Button */}
                <div className="icon-btn-header" title="Calendar" onClick={() => setShowCalendarModal(true)}>
                    📅
                </div>

                {/* Add Vehicle Button (Ref match) */}
                {role === 'admin' && (
                    <button className="btn-add-vehicle-header" onClick={handleAddVehicle}>
                        + ADD VEHICLE
                    </button>
                )}

                {/* Profile Section */}
                <div className="user-info" ref={menuRef}>
                    <div
                        className="profile-trigger"
                        onClick={() => setShowMenu(!showMenu)}
                        title={user?.email}
                    >
                        {initial}
                    </div>

                    {showMenu && (
                        <div className="profile-menu">
                            <div className="profile-menu-header">
                                <span className="user-email">{user?.email}</span>
                            </div>
                            <button className="profile-menu-item" onClick={handleProfileClick}>👤 Profile Page</button>
                            <button
                                className="profile-menu-item"
                                onClick={() => {
                                    alert('Change Log feature - Design TBD\n\nThis will show a comprehensive history of all system changes.')
                                    setShowMenu(false)
                                }}
                            >
                                📜 Change Log
                            </button>
                            <button
                                className={`profile-menu-item ${role === 'admin' ? '' : 'disabled'}`}
                                onClick={handleAdminClick}
                                style={{ opacity: role === 'admin' ? 1 : 0.5, cursor: role === 'admin' ? 'pointer' : 'default', display: 'flex', justifyContent: 'space-between' }}
                            >
                                <span>{role === 'admin' ? '⚡ Admin' : '👤 User'}</span>
                                {role === 'admin' && <span>➜</span>}
                            </button>
                            <button className="profile-menu-item danger" onClick={handleLogout}>Sign Out</button>
                        </div>
                    )}
                </div>
            </div>

            {showCalendarModal && (
                <CalendarOverviewModal onClose={() => setShowCalendarModal(false)} />
            )}
        </header>
    )
}
