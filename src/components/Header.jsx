import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Header({ title }) {
    const { user, role, signOut } = useAuth()
    const [showMenu, setShowMenu] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
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

    const initial = user?.email ? user.email[0].toUpperCase() : '?'

    return (
        <header className="dashboard-header">
            <div className="title-section" onClick={() => navigate('/')}>
                <h1>{title || "Fleet Dashboard"}</h1>
            </div>

            <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>

                {/* Search Icon & Input */}
                <div className="search-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {showSearch && (
                        <input
                            type="text"
                            className="search-input-header"
                            placeholder="Search fleet..."
                            autoFocus
                            onBlur={(e) => !e.target.value && setShowSearch(false)}
                            style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #444', background: '#222', color: 'white' }}
                        />
                    )}
                    <div
                        className="icon-btn"
                        onClick={() => setShowSearch(!showSearch)}
                        style={{ cursor: 'pointer', fontSize: '1.2rem', color: '#ccc' }}
                        title="Search"
                    >
                        🔍
                    </div>
                </div>

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

                            {/* Profile Page Link */}
                            <button
                                className="profile-menu-item"
                                onClick={handleProfileClick}
                            >
                                👤 Profile Page
                            </button>

                            {/* Admin / User Role Item */}
                            <button
                                className={`profile-menu-item ${role === 'admin' ? '' : 'disabled'}`}
                                onClick={handleAdminClick}
                                style={{
                                    opacity: role === 'admin' ? 1 : 0.5,
                                    cursor: role === 'admin' ? 'pointer' : 'default',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <span>{role === 'admin' ? '⚡ Admin' : '👤 User'}</span>
                                {role === 'admin' && <span style={{ fontSize: '0.8em' }}>➜</span>}
                            </button>

                            <button
                                className="profile-menu-item danger"
                                onClick={handleLogout}
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
