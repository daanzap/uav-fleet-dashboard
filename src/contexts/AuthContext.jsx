
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [role, setRole] = useState('viewer')
    const [department, setDepartment] = useState('R&D')
    const [displayName, setDisplayName] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) fetchProfile(session.user.id)
            else setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) fetchProfile(session.user.id)
            else {
                setRole('viewer')
                setDepartment('R&D')
                setDisplayName(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role, display_name, email, department')
                .eq('id', userId)
                .single()

            if (data) {
                setRole(data.role || 'viewer')
                setDepartment(data.department || 'R&D')
                setDisplayName(data.display_name ?? null)
            }
        } catch (err) {
            console.error('Error fetching profile:', err)
        } finally {
            setLoading(false)
        }
    }

    // Admin whitelist override
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
        // Build the full redirect URL including the base path
        const baseUrl = import.meta.env.BASE_URL || '/'
        const redirectUrl = `${window.location.origin}${baseUrl === '/' ? '' : baseUrl}`
        
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl
            }
        })
        if (error) console.error('Error signing in:', error)
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setRole('viewer')
        setDisplayName(null)
    }

    const updateDisplayName = async (newDisplayName) => {
        if (!user?.id) return
        const { error } = await supabase
            .from('profiles')
            .update({ display_name: newDisplayName || null })
            .eq('id', user.id)
        if (error) throw error
        setDisplayName(newDisplayName || null)
    }

    return (
        <AuthContext.Provider value={{ user, role: finalRole, department, displayName, loading, signUp, signIn, signInWithGoogle, signOut, updateDisplayName }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
