'use client'

import { useAuth } from '../contexts/AuthContext'
import LoginPage from '../components/LoginPage'
import Dashboard from '../components/Dashboard'
import { useEffect } from 'react'
import { AuthProvider } from '../contexts/AuthContext'

function AppContent() {
  const { user, loading } = useAuth()

  // iOS viewport height fix
  useEffect(() => {
    const setVH = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
    }
    
    setVH()
    window.addEventListener('resize', setVH)
    window.addEventListener('orientationchange', setVH)
    
    return () => {
      window.removeEventListener('resize', setVH)
      window.removeEventListener('orientationchange', setVH)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center safe-area-inset">
        <div className="card p-8 text-center space-y-4">
          <div className="loading-spinner w-12 h-12 mx-auto"></div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Preparing your dashboard</h2>
            <p className="text-muted">Loading your FPL experience...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {user ? <Dashboard /> : <LoginPage />}
    </div>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
} 