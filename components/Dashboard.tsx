'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Tab } from '@headlessui/react'
import { 
  NewspaperIcon, 
  PlayIcon, 
  TrophyIcon, 
  ChartBarIcon, 
  Cog6ToothIcon 
} from '@heroicons/react/24/outline'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import NewsTab from './tabs/NewsTab'
import ScoreStrikeTab from './tabs/ScoreStrikeTab'
import ResultsTab from './tabs/ResultsTab'
import StatisticsTab from './tabs/StatisticsTab'
import AdminTab from './tabs/AdminTab'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Dashboard() {
  const { user, logout, isWhitelisted, isAdmin } = useAuth()
  const [selectedTab, setSelectedTab] = useState(0)

  // Define tabs based on user permissions
  const tabs = [
    { 
      name: 'Latest News', 
      icon: NewspaperIcon, 
      component: NewsTab, 
      mobileName: 'News', 
      phoneName: 'News',
      alwaysVisible: true 
    },
    // Enhanced access tabs (only for whitelisted users)
    ...(isWhitelisted ? [
      { 
        name: 'Score and Strike', 
        icon: PlayIcon, 
        component: ScoreStrikeTab, 
        mobileName: 'Score', 
        phoneName: 'Score',
        alwaysVisible: false 
      },
      { 
        name: 'Results', 
        icon: TrophyIcon, 
        component: ResultsTab, 
        mobileName: 'Results', 
        phoneName: 'Results',
        alwaysVisible: false 
      },
      { 
        name: 'My Performance', 
        icon: ChartBarIcon, 
        component: StatisticsTab, 
        mobileName: 'Stats', 
        phoneName: 'Stats',
        alwaysVisible: false 
      },
    ] : []),
    // Admin tab (only for whitelisted admin users)
    ...(isWhitelisted && isAdmin ? [
      { 
        name: 'Admin', 
        icon: Cog6ToothIcon, 
        component: AdminTab, 
        mobileName: 'Admin', 
        phoneName: 'Admin',
        alwaysVisible: false 
      }
    ] : []),
  ]

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md supports-backdrop:bg-[rgba(56,0,60,0.8)] border-b border-[color:var(--pl-border)]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left: App Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-[var(--pl-magenta)] to-[var(--pl-cyan)] flex items-center justify-center">
                <span className="text-white font-bold text-lg">OG</span>
              </div>
              <span className="font-bold text-xl hidden sm:block">Ordinary Gentlemen</span>
              <span className="font-bold text-xl sm:hidden">OG</span>
            </div>
          </div>

          {/* Right: User Profile & Actions */}
          <div className="flex items-center gap-4">
            {user && (
              <>
                <div className="hidden sm:flex items-center gap-3 text-sm">
                  <span className="text-[var(--color-text-secondary)]">Welcome,</span>
                  <span className="font-medium text-white truncate max-w-[120px]">
                    {user.displayName || user.email?.split('@')[0] || 'User'}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--pl-magenta)] to-[var(--pl-cyan)] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </span>
                </div>
              </>
            )}
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
            >
              Logout
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="sm:hidden"
            >
              Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 safe-area-inset">
        {/* Debug Info - Only in development */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mb-6 bg-[var(--pl-surface)]/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-[var(--color-text-secondary)]">User:</span>
                  <span className="text-white ml-2">{user?.email || 'None'}</span>
                </div>
                <div>
                  <span className="text-[var(--color-text-secondary)]">Whitelisted:</span>
                  <span className={`ml-2 ${isWhitelisted ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                    {isWhitelisted ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-secondary)]">Admin:</span>
                  <span className={`ml-2 ${isAdmin ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                    {isAdmin ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-secondary)]">Tabs:</span>
                  <span className="text-white ml-2">{tabs.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Navigation */}
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          {/* Desktop Tab List */}
          <Tab.List className="hidden lg:flex space-x-2 rounded-xl bg-[var(--color-surface)] p-2 border border-[color:var(--pl-border)]">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-3 px-6 text-sm font-medium leading-5 transition-all duration-200',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-[var(--color-primary)] focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-gradient-to-r from-[var(--pl-neon)] to-[var(--pl-cyan)] text-[var(--color-primary-contrast)] shadow-lg'
                      : 'text-[var(--color-text-secondary)] hover:bg-white/[0.12] hover:text-white'
                  )
                }
              >
                <div className="flex items-center gap-2">
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </div>
              </Tab>
            ))}
          </Tab.List>

          {/* Mobile Tab List */}
          <Tab.List className="lg:hidden flex px-2 overflow-x-auto scrollbar-hide gap-1 mb-6">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'flex flex-col items-center justify-center gap-2 px-3 py-4 text-sm font-semibold transition-all duration-300 border-b-2 relative overflow-hidden whitespace-nowrap flex-shrink-0 min-w-[80px] touch-target',
                    selected
                      ? 'text-white bg-gradient-to-r from-[var(--pl-neon)] to-[var(--pl-cyan)] border-[var(--pl-cyan)] shadow-lg'
                      : 'text-[var(--color-text-secondary)] hover:bg-white/[0.12] hover:text-white border-transparent'
                  )
                }
              >
                <tab.icon className="w-6 h-6" />
                <span className="text-center leading-tight text-xs font-medium">{tab.phoneName}</span>
              </Tab>
            ))}
          </Tab.List>

          {/* Tab Panels */}
          <Tab.Panels className="mt-6">
            {tabs.map((tab) => (
              <Tab.Panel
                key={tab.name}
                className={classNames(
                  'rounded-xl bg-[var(--color-surface)] shadow-lg border border-[color:var(--pl-border)]',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-[var(--color-primary)] focus:outline-none focus:ring-2'
                )}
              >
                <div className="p-4 sm:p-6 lg:p-8">
                  <tab.component />
                </div>
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </main>
    </div>
  )
} 