
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Header({ title }) {
    const { user, role, signOut } = useAuth()
    const [showMenu, setShowMenu] = useState(false)
    const menuRef = useRef(null)

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
        window.location.href = '/'
    }

    const initial = user?.email ? user.email[0].toUpperCase() : '?'

    return (
        <header className="dashboard-header">
            <div className="title-section" onClick={() => window.location.href = '/'}>
                <h1>{title || "Fleet Dashboard"}</h1>
            </div>

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
                            <span className={`user-role-badge ${role}`}>{role}</span>
                        </div>

                        {role === 'admin' && (
                            <button
                                className="profile-menu-item"
                                onClick={() => window.location.href = '/admin'}
                            >
                                ⚙️ Manage Users
                            </button>
                        )}

                        <button
                            className="profile-menu-item danger"
                            onClick={handleLogout}
                        >
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </header>
    )
}
