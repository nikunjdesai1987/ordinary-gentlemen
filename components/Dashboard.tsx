'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Tab } from '@headlessui/react'
import { 
  NewspaperIcon, 
  PlayIcon, 
  TrophyIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import NewsTab from './tabs/NewsTab'
import ScoreStrikeTab from './tabs/ScoreStrikeTab'
import ResultsTab from './tabs/ResultsTab'
import StatisticsTab from './tabs/StatisticsTab'
import HeadsUpTab from './tabs/HeadsUpTab'
import AdminTab from './tabs/AdminTab'
import { dbUtils } from '../lib/database'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Dashboard() {
  const { user, logout, isWhitelisted, isAdmin, managerFplId } = useAuth()
  const [selectedTab, setSelectedTab] = useState(0)
  const [headsUpConfig, setHeadsUpConfig] = useState<any>(null)

  // Load heads up configuration to determine if user should see Heads Up tab
  useEffect(() => {
    const loadHeadsUpConfig = async () => {
      if (managerFplId && isWhitelisted) {
        try {
          const config = await dbUtils.getHeadsUpConfig();
          setHeadsUpConfig(config);
        } catch (error) {
          console.error('Error loading heads up config:', error);
        }
      }
    };

    loadHeadsUpConfig();
  }, [managerFplId, isWhitelisted]);

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
      // Heads Up tab - only show if user is in heads up configuration
      ...(headsUpConfig && headsUpConfig.managers.includes(managerFplId) ? [
        { 
          name: 'Heads Up', 
          icon: UserGroupIcon, 
          component: HeadsUpTab, 
          mobileName: 'Heads', 
          phoneName: 'Heads',
          alwaysVisible: false 
        }
      ] : []),
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
                  <span className="font-medium text-[var(--color-text-primary)] truncate max-w-[120px]">
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
                      : 'text-[var(--color-text-secondary)] hover:bg-[rgba(0,212,163,0.08)] hover:text-[var(--color-text-primary)]'
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
                      ? 'text-[var(--color-primary-contrast)] bg-gradient-to-r from-[var(--pl-neon)] to-[var(--pl-cyan)] border-[var(--pl-cyan)] shadow-lg'
                      : 'text-[var(--color-text-secondary)] hover:bg-[rgba(0,212,163,0.08)] hover:text-[var(--color-text-primary)] border-transparent'
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