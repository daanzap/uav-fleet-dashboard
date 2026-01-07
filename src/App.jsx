
import { useAuth, AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import './App.css'


function AppRoutes() {
  const { user, role } = useAuth()

  if (!user) return <Login />

  // Simple "client-side router" for demo purposes
  const path = window.location.pathname
  if (path === '/admin') return <AdminPanel />

  return <Dashboard />
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
