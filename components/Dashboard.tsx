'client';

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

  // Mobile-first tabs with phone-optimized names
  const tabs = [
    { name: 'Latest News', icon: NewspaperIcon, component: NewsTab, mobileName: 'News', phoneName: 'News' },
    // Enhanced access tabs (only for whitelisted users)
    ...(isWhitelisted ? [
      { name: 'Score and Strike', icon: PlayIcon, component: ScoreStrikeTab, mobileName: 'Score', phoneName: 'Score' },
      { name: 'Results', icon: TrophyIcon, component: ResultsTab, mobileName: 'Results', phoneName: 'Results' },
      { name: 'My Performance', icon: ChartBarIcon, component: StatisticsTab, mobileName: 'Stats', phoneName: 'Stats' },
    ] : []),
    // Admin tab (only for whitelisted admin users)
    ...(isWhitelisted && isAdmin ? [
      { name: 'Admin', icon: Cog6ToothIcon, component: AdminTab, mobileName: 'Admin', phoneName: 'Admin' }
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
      {/* Mobile-First Top Navigation Bar */}
      <div className="glass-card px-4 py-4 sm:px-6 sm:py-4 lg:px-8 lg:py-5 shadow-lg border-b border-white/20 relative z-10">
        <div className="flex justify-between items-center">
          {/* Mobile-Optimized Profile Section */}
          <div className="flex items-center gap-3 sm:gap-4">
            <img 
              src={user?.photoURL || '/default-avatar.png'} 
              alt="Profile" 
              className="w-12 h-12 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full border-3 border-primary-500 shadow-lg"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-base sm:text-base lg:text-lg font-bold text-gray-800 drop-shadow-sm truncate">
                Welcome, {user?.displayName?.split(' ')[0] || 'User'}!
              </span>
              <span className="text-sm sm:text-sm text-gray-600 font-medium truncate max-w-[140px] sm:max-w-[200px] lg:max-w-none">
                {user?.email}
              </span>
            </div>
          </div>

          {/* Mobile-Optimized Logout Button */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleLogout} 
              disabled={loading}
              className="btn-secondary flex items-center gap-2 py-3 px-4 sm:py-2 sm:px-4 lg:py-3 lg:px-6 text-sm sm:text-sm lg:text-base touch-target"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{loading ? 'Logging out...' : 'Logout'}</span>
              <span className="sm:hidden">{loading ? '...' : 'Out'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-First Tab Navigation */}
      <div className="glass-card border-b border-white/20 shadow-lg relative z-5">
        <Tab.Group defaultIndex={0}>
          {/* Desktop Tab List - Hidden on mobile */}
          <Tab.List className="hidden lg:flex px-6 lg:px-8 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'flex items-center gap-3 px-6 lg:px-8 py-4 lg:py-5 text-base lg:text-lg font-semibold transition-all duration-300 border-b-3 relative overflow-hidden whitespace-nowrap flex-shrink-0',
                    selected
                      ? 'text-white bg-gradient-to-r from-primary-500 to-primary-600 border-primary-600 shadow-lg drop-shadow-md'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                  )
                }
              >
                <tab.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                {tab.name}
              </Tab>
            ))}
          </Tab.List>

          {/* Mobile-First Tab List - Large touch targets, phone-optimized */}
          <Tab.List className="lg:hidden flex px-2 sm:px-3 overflow-x-auto scrollbar-hide gap-1">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'flex flex-col items-center justify-center gap-2 px-3 py-4 text-sm font-semibold transition-all duration-300 border-b-2 relative overflow-hidden whitespace-nowrap flex-shrink-0 min-w-[80px] sm:min-w-[90px] touch-target',
                    selected
                      ? 'text-white bg-gradient-to-r from-primary-500 to-primary-600 border-primary-600 shadow-lg'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                  )
                }
              >
                <tab.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                <span className="text-center leading-tight text-xs sm:text-sm font-medium">{tab.phoneName}</span>
              </Tab>
            ))}
          </Tab.List>

          {/* Mobile-First Tab Panels - Phone-optimized spacing */}
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