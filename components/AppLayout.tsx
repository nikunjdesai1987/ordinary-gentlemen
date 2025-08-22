'use client'

import { ReactNode, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  HomeIcon, 
  PlayIcon, 
  TrophyIcon, 
  PuzzlePieceIcon, 
  UserIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface AppLayoutProps {
  children: ReactNode
  currentTab?: string
}

export default function AppLayout({ children, currentTab = 'home' }: AppLayoutProps) {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon, shortName: 'Home' },
    { name: 'Score & Strike', href: '/score-strike', icon: PlayIcon, shortName: 'Score' },
    { name: 'Standings', href: '/standings', icon: TrophyIcon, shortName: 'Standings' },
    { name: 'Chips', href: '/chips', icon: PuzzlePieceIcon, shortName: 'Chips' },
    { name: 'Profile', href: '/profile', icon: UserIcon, shortName: 'Profile' },
  ]

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md supports-backdrop:bg-[rgba(56,0,60,0.8)] border-b border-[color:var(--pl-border)]">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          {/* Left: App Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-[rgba(0,212,163,0.08)] transition-colors"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
            
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[var(--pl-magenta)] to-[var(--pl-cyan)] flex items-center justify-center">
                <span className="text-white font-bold text-sm">OG</span>
              </div>
              <span className="font-bold text-lg hidden sm:block">Ordinary Gentlemen</span>
              <span className="font-bold text-lg sm:hidden">OG</span>
            </div>
          </div>

          {/* Center: Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-sm text-[var(--pl-muted)]">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`hover:text-[var(--color-text-primary)] transition-colors ${
                  currentTab === item.name.toLowerCase() ? 'text-[var(--color-text-primary)] font-semibold' : ''
                }`}
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Right: User Profile & Actions */}
          <div className="flex items-center gap-3">
            {user && (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <span className="text-[var(--pl-muted)]">Welcome,</span>
                  <span className="font-medium text-[var(--color-text-primary)] truncate max-w-[120px]">
                    {user.displayName || user.email?.split('@')[0] || 'User'}
                  </span>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-[var(--pl-magenta)] to-[var(--pl-cyan)] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </span>
                </div>
              </>
            )}
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-small"
            >
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm">
                            <div className="fixed inset-y-0 left-0 w-64 bg-[var(--color-surface)] border-r border-[color:var(--pl-border)] p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[var(--pl-magenta)] to-[var(--pl-cyan)] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">OG</span>
                </div>
                <span className="font-bold text-lg">Menu</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-[rgba(0,212,163,0.08)] transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <nav className="space-y-2">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    currentTab === item.name.toLowerCase() 
                      ? 'bg-primary text-[color:var(--color-primary-contrast)]' 
                      : 'text-[var(--pl-muted)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(0,212,163,0.08)]'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 safe-area-inset">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[color:var(--pl-border)] bg-[rgba(255,255,255,0.95)] backdrop-blur-md safe-area-bottom">
        <div className="grid grid-cols-5 h-16 text-xs">
          {navigation.map((item) => (
            <button
              key={item.name}
              className="mobile-nav-item"
              data-active={currentTab === item.name.toLowerCase()}
            >
              <item.icon className="mobile-nav-icon" />
              <span className="mobile-nav-label">{item.shortName}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom Safe Area Spacer */}
      <div className="lg:hidden h-16 safe-area-bottom"></div>
    </div>
  )
}
