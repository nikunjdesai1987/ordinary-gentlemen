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
  Cog6ToothIcon
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
  const { user, logout, managerFplId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

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
      
      setIsAdmin(isAdminUser);
      setAdminCheckComplete(true);
    } catch (error) {
      console.error('❌ Dashboard: Error checking admin access:', error);
      setIsAdmin(false);
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

  // Only show Admin tab if user is confirmed as league admin and admin check is complete
  const tabs = [
    { name: 'Latest News', icon: NewspaperIcon, component: NewsTab },
    { name: 'Score and Strike', icon: PlayIcon, component: ScoreStrikeTab },
    { name: 'Results', icon: TrophyIcon, component: ResultsTab },
    { name: 'My Performance', icon: ChartBarIcon, component: StatisticsTab },
    // Admin tab is only included if user is verified as league admin and admin check is complete
    ...(isAdmin && managerFplId && adminCheckComplete ? [{ name: 'Admin', icon: Cog6ToothIcon, component: AdminTab }] : []),
  ];

  // Debug info
  console.log('🎯 Dashboard Debug:', {
    managerFplId,
    isAdmin,
    adminCheckComplete,
    userEmail: user?.email,
    tabsCount: tabs.length,
    hasAdminTab: tabs.some(tab => tab.name === 'Admin'),
    adminTabIncluded: isAdmin && managerFplId && adminCheckComplete
  });

  return (
    <div className="min-h-screen gradient-bg font-sans relative overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center glass-card px-8 py-5 shadow-lg border-b border-white/20 relative z-10">
        <div className="flex items-center gap-4">
          <img 
            src={user?.photoURL || '/default-avatar.png'} 
            alt="Profile" 
            className="w-12 h-12 rounded-full border-3 border-primary-500 shadow-lg"
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-800 drop-shadow-sm">
              Welcome, {user?.displayName}!
            </span>
            <span className="text-sm text-gray-600 font-medium">
              {user?.email}
            </span>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          {loading ? 'Logging out...' : 'Logout'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="glass-card border-b border-white/20 shadow-lg relative z-5">
        <Tab.Group defaultIndex={0}>
          <Tab.List className="flex px-8">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'flex items-center gap-2 px-6 py-4 text-base font-semibold transition-all duration-300 border-b-3 relative overflow-hidden',
                    selected
                      ? 'text-white bg-gradient-to-r from-primary-500 to-primary-600 border-primary-600 shadow-lg drop-shadow-md'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                  )
                }
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="p-10 max-w-7xl mx-auto">
            {tabs.map((tab) => (
              <Tab.Panel
                key={tab.name}
                className="glass-card rounded-3xl p-9 shadow-xl border border-white/20"
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