
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
    // TEMPORARY MOCK MODE FOR UI VERIFICATION
    // Because Supabase Email Provider is currently disabled/misconfigured
    const [user, setUser] = useState({
        id: 'mock-user-123',
        email: 'a.chang@deltaquad.com', // Admin Email
        last_sign_in_at: new Date().toISOString()
    })
    const [role, setRole] = useState('admin')
    const [loading, setLoading] = useState(true) // Initialize loading state

    // Disable real Supabase effect for now
    /*
    useEffect(() => {
        // ... standard supabase logic ...
    }, [])
    */
    useEffect(() => { setLoading(false) }, [])

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single()

            if (data) {
                setRole(data.role)
            }
        } catch (err) {
            console.error('Error fetching profile:', err)
        } finally {
            setLoading(false)
        }
    }

    // DERIVED ROLE LOGIC (Admin whitelist override)
    const finalRole = (user?.email && ['a.chang@deltaquad.com', 'chris@deltaquad.com'].includes(user.email))
        ? 'admin'
        : role

    const signUp = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        })
        if (error) throw error
        return data
    }

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) throw error
        return data
    }

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        })
        if (error) console.error('Error signing in:', error)
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setRole('viewer')
    }

    return (
        <AuthContext.Provider value={{ user, role: finalRole, loading, signUp, signIn, signInWithGoogle, signOut }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
