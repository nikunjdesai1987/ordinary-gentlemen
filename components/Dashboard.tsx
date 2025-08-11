'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tab } from '@headlessui/react';
import { fplApi } from '@/lib/fpl-api';
import { 
  NewspaperIcon, 
  TrophyIcon, 
  PlayIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import NewsTab from './tabs/NewsTab';
import ScoreStrikeTab from './tabs/ScoreStrikeTab';
import ResultsTab from './tabs/ResultsTab';
import StatisticsTab from './tabs/StatisticsTab';
import AdminTab from './tabs/AdminTab';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Dashboard() {
  const { user, logout, managerFplId, isAdmin, isWhitelisted } = useAuth();
  const [loading, setLoading] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check admin access on component mount
  useEffect(() => {
    if (managerFplId && user) {
      console.log('🔄 Triggering admin check with managerFplId:', managerFplId, 'and user:', user.email);
      checkAdminAccess();
    } else {
      console.log('⏳ Waiting for managerFplId or user:', { managerFplId, userEmail: user?.email });
    }
  }, [managerFplId, user]);

  const checkAdminAccess = async () => {
    if (!managerFplId) {
      console.log('No managerFplId available yet');
      return;
    }
    
    try {
      console.log('🔐 Dashboard: Checking admin access for managerFplId:', managerFplId);
      
      // Get the manager_fplid from whitelist (which was verified during login)
      const standings = await fplApi.getLeagueStandings(607394);
      const adminEntry = standings.league?.admin_entry;
      
      console.log('📊 Dashboard: Admin entry from FPL API:', adminEntry);
      console.log('👤 Dashboard: Manager FPL ID from whitelist:', managerFplId);
      
      // Ensure both values are numbers for comparison
      const adminEntryNum = Number(adminEntry);
      const managerFplIdNum = Number(managerFplId);
      
      console.log('🔢 Dashboard: Converted values - Admin Entry:', adminEntryNum, 'Manager FPL ID:', managerFplIdNum);
      
      const isAdminUser = adminEntryNum === managerFplIdNum;
      console.log('✅ Dashboard: Admin access granted:', isAdminUser);
      
      // Note: isAdmin is now managed by AuthContext, so we just log the result
      console.log('✅ Dashboard: Admin status from context:', isAdmin);
      setAdminCheckComplete(true);
    } catch (error) {
      console.error('❌ Dashboard: Error checking admin access:', error);
      setAdminCheckComplete(true);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      alert('Logout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced tabs with responsive considerations and better mobile labels
  const tabs = [
    { name: 'Latest News', icon: NewspaperIcon, component: NewsTab, shortName: 'News', mobileName: 'News' },
    // Enhanced access tabs (only for whitelisted users)
    ...(isWhitelisted ? [
      { name: 'Score and Strike', icon: PlayIcon, component: ScoreStrikeTab, shortName: 'Score', mobileName: 'Score' },
      { name: 'Results', icon: TrophyIcon, component: ResultsTab, shortName: 'Results', mobileName: 'Results' },
      { name: 'My Performance', icon: ChartBarIcon, component: StatisticsTab, shortName: 'Stats', mobileName: 'Stats' },
    ] : []),
    // Admin tab (only for whitelisted admin users)
    ...(isWhitelisted && isAdmin ? [
      { name: 'Admin', icon: Cog6ToothIcon, component: AdminTab, shortName: 'Admin', mobileName: 'Admin' }
    ] : []),
  ];

  // Debug info
  console.log('🎯 Dashboard Debug:', {
    managerFplId,
    isAdmin,
    isWhitelisted,
    adminCheckComplete,
    userEmail: user?.email,
    tabsCount: tabs.length,
    hasAdminTab: tabs.some(tab => tab.name === 'Admin'),
    adminTabVisible: isWhitelisted && isAdmin,
    userIsAdmin: isAdmin,
    userIsWhitelisted: isWhitelisted
  });

  return (
    <div className="min-h-screen gradient-bg font-sans relative overflow-hidden">
      {/* Top Navigation Bar - Responsive */}
      <div className="glass-card px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 shadow-lg border-b border-white/20 relative z-10">
        <div className="flex justify-between items-center">
          {/* Profile Section - Responsive */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <img 
              src={user?.photoURL || '/default-avatar.png'} 
              alt="Profile" 
              className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full border-2 sm:border-3 border-primary-500 shadow-lg"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-sm sm:text-base lg:text-lg font-bold text-gray-800 drop-shadow-sm truncate">
                Welcome, {user?.displayName?.split(' ')[0] || 'User'}!
              </span>
              <span className="text-xs sm:text-sm text-gray-600 font-medium truncate max-w-[120px] sm:max-w-[200px] lg:max-w-none">
                {user?.email}
              </span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleLogout} 
              disabled={loading}
              className="btn-secondary flex items-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base py-2 px-3 sm:py-2 sm:px-4 lg:py-3 lg:px-6"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{loading ? 'Logging out...' : 'Logout'}</span>
              <span className="sm:hidden">{loading ? '...' : 'Out'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Responsive */}
      <div className="glass-card border-b border-white/20 shadow-lg relative z-5">
        <Tab.Group defaultIndex={0}>
          {/* Desktop Tab List */}
          <Tab.List className="hidden md:flex px-4 lg:px-8 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'flex items-center gap-2 px-4 lg:px-6 py-3 lg:py-4 text-sm lg:text-base font-semibold transition-all duration-300 border-b-3 relative overflow-hidden whitespace-nowrap flex-shrink-0',
                    selected
                      ? 'text-white bg-gradient-to-r from-primary-500 to-primary-600 border-primary-600 shadow-lg drop-shadow-md'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                  )
                }
              >
                <tab.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                {tab.name}
              </Tab>
            ))}
          </Tab.List>

          {/* Mobile Tab List - Improved with better labels */}
          <Tab.List className="md:hidden flex px-2 sm:px-4 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'flex flex-col items-center gap-1 px-2 sm:px-3 py-2 sm:py-3 text-xs font-semibold transition-all duration-300 border-b-2 relative overflow-hidden whitespace-nowrap flex-shrink-0 min-w-[70px] sm:min-w-[80px]',
                    selected
                      ? 'text-white bg-gradient-to-r from-primary-500 to-primary-600 border-primary-600 shadow-lg'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                  )
                }
              >
                <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-center leading-tight text-xs">{tab.mobileName}</span>
              </Tab>
            ))}
          </Tab.List>

          {/* Tab Panels - Responsive */}
          <Tab.Panels className="p-3 sm:p-4 lg:p-6 xl:p-8 2xl:p-10 max-w-7xl mx-auto">
            {tabs.map((tab) => (
              <Tab.Panel
                key={tab.name}
                className="glass-card rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 xl:p-8 2xl:p-9 shadow-xl border border-white/20"
              >
                <tab.component />
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
} 