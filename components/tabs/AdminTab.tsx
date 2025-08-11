'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fplApi } from '@/lib/fpl-api';
import { dbUtils, AdminConfig, LeagueInfo } from '@/lib/database';
import { formatCurrencyWithCoin } from '@/lib/currency-utils';

interface PayoutStructure {
  top20Winners: number[];
  scoreNStrike: number;
  weeklyWinner: number;
  chipUsage: { [key: string]: number };
}

interface ChipConfig {
  name: string;
  amount: number;
}



export default function AdminTab() {
  const { user, managerFplId, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [managerEntryFee, setManagerEntryFee] = useState('');
  const [totalManagers, setTotalManagers] = useState('');
  const [scoreStrikeWeeks, setScoreStrikeWeeks] = useState('38');
  const [weeklyWinnerWeeks, setWeeklyWinnerWeeks] = useState('38');
  const [totalChipTypes, setTotalChipTypes] = useState('3');
  const [chipNames, setChipNames] = useState<string[]>(['Triple Captain', 'Bench Boost', 'Free Hit']);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [isEditFinalized, setIsEditFinalized] = useState(false);
  const [availableChips, setAvailableChips] = useState<string[]>([]);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [configChanged, setConfigChanged] = useState(false);
  const [leagueName, setLeagueName] = useState<string>('League of Ordinary Gentlemen');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('607394');
  const [currentPage, setCurrentPage] = useState<'configuration' | 'payoutStructure' | 'summary' | 'addLeague'>('configuration');
  const [leagueConfigs, setLeagueConfigs] = useState<AdminConfig[]>([]);
  const [currentLeagueIndex, setCurrentLeagueIndex] = useState<number>(-1);
  const [newLeagueId, setNewLeagueId] = useState<string>('');
  const [newLeagueName, setNewLeagueName] = useState<string>('');
  const [verifyingLeague, setVerifyingLeague] = useState<boolean>(false);
  const [leagueVerificationError, setLeagueVerificationError] = useState<string | null>(null);
  const [currentLeagueInfo, setCurrentLeagueInfo] = useState<LeagueInfo | null>(null);
  
  // Payout structure state
  const [payoutStructure, setPayoutStructure] = useState<PayoutStructure>({
    top20Winners: [],
    scoreNStrike: 0,
    weeklyWinner: 0,
    chipUsage: {}
  });
  
  // Editable payout state (for edit mode)
  const [editablePayouts, setEditablePayouts] = useState<PayoutStructure>({
    top20Winners: [],
    scoreNStrike: 0,
    weeklyWinner: 0,
    chipUsage: {}
  });
  
  // Initialize admin tab for all users (admin or not)
  useEffect(() => {
    if (managerFplId) {
      initializeAdminTab();
    }
  }, [managerFplId]);

  // Show error message if access denied
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 text-xl font-semibold mb-4">{error}</div>
        <div className="text-gray-600">
          {error.includes('Admin privileges required') 
            ? 'You need to be the league admin to access this section.'
            : 'Please ensure your manager FPL ID is properly configured.'}
        </div>
      </div>
    );
  }



  // Load all league configurations for all users
  useEffect(() => {
    loadAllLeagueConfigs();
    initializeDefaultLeague();
  }, []);

  // Load current league info when selectedLeagueId changes
  useEffect(() => {
    loadCurrentLeagueInfo();
  }, [selectedLeagueId]);

  const loadAllLeagueConfigs = async () => {
    try {
      const configs = await dbUtils.getAllAdminConfigs();
      setLeagueConfigs(configs);
      
      // Set current league to the most recent one
      if (configs.length > 0) {
        setCurrentLeagueIndex(configs.length - 1);
        const latestConfig = configs[configs.length - 1];
        setManagerEntryFee(latestConfig.managerEntryFee.toString());
        setTotalManagers(latestConfig.totalManagers.toString());
        setPayoutStructure(latestConfig.payoutStructure);
        setIsConfirmed(latestConfig.isConfirmed);
        setLeagueName(`League ${configs.length}`);
        setSelectedLeagueId(latestConfig.leagueId.toString());
      }
    } catch (error) {
      console.error('Error loading league configs:', error);
    }
  };

  const initializeDefaultLeague = async () => {
    try {
      // Check if default league (607394) exists
      const existingLeague = await dbUtils.getLeagueInfo(607394);
      
      if (!existingLeague) {
        console.log('🔍 Initializing default league (607394)...');
        
        // Fetch league data from FPL API
        const leagueData = await fplApi.getLeagueStandings(607394);
        
        if (leagueData && leagueData.league) {
          const leagueInfo: LeagueInfo = {
            leagueId: 607394,
            leagueName: leagueData.league.name,
            leagueAdmin: leagueData.league.admin_entry ? 'Admin' : 'Unknown',
            adminId: leagueData.league.admin_entry || 0,
            isCreated: false,
            createdAt: new Date()
          };
          
          await dbUtils.saveLeagueInfo(leagueInfo);
          console.log('✅ Default league initialized:', leagueInfo.leagueName);
        }
      }
      

    } catch (error) {
      console.error('Error initializing default league:', error);
    }
  };



  const loadCurrentLeagueInfo = async () => {
    try {
      if (selectedLeagueId) {
        const leagueInfo = await dbUtils.getLeagueInfo(parseInt(selectedLeagueId));
        setCurrentLeagueInfo(leagueInfo || null);
      }
    } catch (error) {
      console.error('Error loading current league info:', error);
    }
  };

  // Fetch available chips from FPL API for all users
  useEffect(() => {
    fetchAvailableChips();
  }, []);

  const fetchAvailableChips = async () => {
    try {
      const bootstrapData = await fplApi.getBootstrapData();
      const chips = bootstrapData.chips || [];
      
      const availableChipOptions: string[] = [];
      
      chips.forEach((chip: any) => {
        const { name, start_event, stop_event } = chip;
        
        if (name === 'wildcard' && stop_event === 19) {
          availableChipOptions.push('WildCard I');
        } else if (name === 'wildcard' && stop_event === 38) {
          availableChipOptions.push('WildCard II');
        } else if (name === 'freehit' && stop_event === 19) {
          availableChipOptions.push('FreeHit I');
        } else if (name === 'bboost' && stop_event === 19) {
          availableChipOptions.push('BenchBoost I');
        } else if (name === '3xc' && stop_event === 19) {
          availableChipOptions.push('TripleCaptain I');
        } else if (name === 'freehit' && stop_event === 38) {
          availableChipOptions.push('FreeHit II');
        } else if (name === 'bboost' && stop_event === 38) {
          availableChipOptions.push('BenchBoost II');
        } else if (name === '3xc' && stop_event === 38) {
          availableChipOptions.push('TripleCaptain II');
        }
      });
      
      // Sort chips in the specified default order
      const defaultOrder = [
        'BenchBoost I',
        'FreeHit I', 
        'TripleCaptain I',
        'BenchBoost II',
        'FreeHit II',
        'TripleCaptain II',
        'WildCard I',
        'WildCard II'
      ];
      
      const sortedChips = defaultOrder.filter(chip => availableChipOptions.includes(chip));
      setAvailableChips(sortedChips);
    } catch (error) {
      console.error('Error fetching available chips:', error);
      // Fallback to default chips if API fails
      setAvailableChips(['BenchBoost I', 'FreeHit I', 'TripleCaptain I', 'BenchBoost II', 'FreeHit II', 'TripleCaptain II', 'WildCard I', 'WildCard II']);
    }
  };

  // Update chip names when total chip types changes
  useEffect(() => {
    const chipCount = parseInt(totalChipTypes) || 0;
    if (chipCount > 0) {
      const defaultChipOrder = [
        'BenchBoost I',
        'FreeHit I',
        'TripleCaptain I',
        'BenchBoost II',
        'FreeHit II',
        'TripleCaptain II',
        'WildCard I',
        'WildCard II'
      ];
      
      const newChipNames = defaultChipOrder.slice(0, chipCount);
      setChipNames(newChipNames);
    } else {
      setChipNames([]);
    }
  }, [totalChipTypes]);

  // Helper functions for chip management
  const updateChipName = (index: number, name: string) => {
    const newChipNames = [...chipNames];
    newChipNames[index] = name;
    setChipNames(newChipNames);
  };

  const initializeAdminTab = async () => {
    try {
      console.log('🚀 AdminTab: Starting initialization');
      setLoading(true);
      setError(null);

      // Double-check admin access
      if (!isAdmin) {
        console.log('❌ AdminTab: User does not have admin privileges');
        setError('Access denied: Admin privileges required');
        return;
      }

      if (!managerFplId) {
        console.log('❌ AdminTab: No managerFplId available');
        setError('Manager FPL ID not available');
        return;
      }

      console.log('📊 AdminTab: Fetching league standings');
      // Set league name from standings
      const standings = await fplApi.getLeagueStandings(607394);
      if (standings.league?.name) {
        setLeagueName(standings.league.name);
        console.log('✅ AdminTab: Set league name:', standings.league.name);
      }
      
      console.log('💾 AdminTab: Loading existing config');
      // Load existing config if available
      try {
        // Add timeout to prevent hanging
        const configPromise = dbUtils.getLatestAdminConfig();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 5000)
        );
        
        const existingConfig = await Promise.race([configPromise, timeoutPromise]) as any;
        
        if (existingConfig) {
          console.log('✅ AdminTab: Found existing config');
          setManagerEntryFee(existingConfig.managerEntryFee.toString());
          setTotalManagers(existingConfig.totalManagers.toString());
          setPayoutStructure(existingConfig.payoutStructure);
          setIsConfirmed(existingConfig.isConfirmed);
          
          // If there's a confirmed configuration, show the summary page
          if (existingConfig.isConfirmed) {
            setCurrentPage('summary');
            console.log('📋 AdminTab: Set to summary page');
          } else {
            // If there's an unconfirmed config, stay on configuration page
            setCurrentPage('configuration');
            console.log('⚙️ AdminTab: Set to configuration page');
          }
        } else {
          // No existing config found, start with configuration page
          setCurrentPage('configuration');
          console.log('🆕 AdminTab: No existing config, set to configuration page');
        }
      } catch (dbError: any) {
        console.error('❌ AdminTab: Database error loading config:', dbError);
        if (dbError.message === 'Database timeout') {
          setError(
            'Database connection timed out. This usually happens when the browser\'s local storage is corrupted. ' +
            'Please try clearing your browser data or use the button below to reset the database.'
          );
        } else if (dbError.name === 'VersionError') {
          setError(
            'Database version conflict detected. This usually happens when the app has been updated. ' +
            'Please clear your browser data or use the buttons below to reset the database.'
          );
        } else {
          setError(`Database error: ${dbError.message}`);
        }
      }
      
      console.log('✅ AdminTab: Initialization complete');
    } catch (error: any) {
      console.error('❌ AdminTab: Error initializing admin tab:', error);
      setError(`Failed to initialize admin tab: ${error.message}`);
    } finally {
      console.log('🏁 AdminTab: Setting loading to false');
      setLoading(false);
    }
  };

  const calculatePayoutStructure = () => {
    const entryFee = parseFloat(managerEntryFee);
    const totalManagersCount = parseInt(totalManagers);
    const scoreStrikeWeeksCount = parseInt(scoreStrikeWeeks);
    const weeklyWinnerWeeksCount = parseInt(weeklyWinnerWeeks);
    const totalChipTypesCount = parseInt(totalChipTypes);
    
    if (!entryFee || !totalManagersCount || !scoreStrikeWeeksCount || !weeklyWinnerWeeksCount || !totalChipTypesCount) {
      setError('Please enter valid values for all fields');
      return;
    }

    if (totalManagersCount < 4) {
      setError('Total Managers must be at least 4 for payout calculation');
      return;
    }

    // Step 1: Total Prize Pool
    const totalPrizePool = entryFee * totalManagersCount;
    
    // Step 2: Season Winners Pool - Top 20% Distribution
    const seasonWinnersPool = Math.ceil(totalPrizePool / 2 / 10) * 10; // Round up to nearest 10
    
    // Step 3: Season Winners Pool - Top 20% Distribution
    const paidWinners = Math.floor(totalManagersCount * 0.20); // Round down to nearest whole number
    const winners = calculateSeasonWinnersPayouts(seasonWinnersPool, paidWinners, entryFee);
    
    // Step 4: Side Contest Pool Breakdown
    // L = X*Y - A (Total manager*manager entry fee - Season Winners Pool)
    const sideContestPool = totalPrizePool - seasonWinnersPool;
    
    // S = W = (L*45)/100 (Score & Strike = Weekly Contest = 45% each)
    const scoreStrikePool = Math.round(sideContestPool * 0.45);
    const weeklyWinnerPool = Math.round(sideContestPool * 0.45);
    
    // Calculate weekly amounts with rounding to nearest $5
    let scoreStrikePerWeek = Math.round(scoreStrikePool / scoreStrikeWeeksCount / 5) * 5;
    let weeklyWinnerPerWeek = Math.round(weeklyWinnerPool / weeklyWinnerWeeksCount / 5) * 5;
    
    // Recalculate total S+W to ensure it equals (L*90)/100
    const totalSW = (scoreStrikePerWeek * scoreStrikeWeeksCount) + (weeklyWinnerPerWeek * weeklyWinnerWeeksCount);
    
    // H = L - (S+W) - remaining for chips
    const chipUsagePool = sideContestPool - totalSW;
    let chipUsagePerChip = Math.round(chipUsagePool / totalChipTypesCount / 5) * 5; // nearest $5
    
    // Rule: Si = Wi = Hi/2 - reduce the higher amount to match the lower amount
    let remainingAmount = 0;
    const chipUsagePerChipHalf = chipUsagePerChip / 2;
    
    // Find the minimum value among the three
    const minValue = Math.min(scoreStrikePerWeek, weeklyWinnerPerWeek, chipUsagePerChipHalf);
    
    // Calculate remaining amounts from each category
    if (scoreStrikePerWeek > minValue) {
      remainingAmount += (scoreStrikePerWeek - minValue) * scoreStrikeWeeksCount;
      scoreStrikePerWeek = minValue;
    }
    
    if (weeklyWinnerPerWeek > minValue) {
      remainingAmount += (weeklyWinnerPerWeek - minValue) * weeklyWinnerWeeksCount;
      weeklyWinnerPerWeek = minValue;
    }
    
    if (chipUsagePerChipHalf > minValue) {
      remainingAmount += (chipUsagePerChipHalf - minValue) * totalChipTypesCount * 2; // *2 because we're working with Hi/2
      chipUsagePerChip = minValue * 2; // Convert back to full Hi value
    } else {
      chipUsagePerChip = minValue * 2; // Convert back to full Hi value
    }
    
    // Add remaining amount to season winners pool starting from position 1
    let adjustedWinners = [...winners];
    if (remainingAmount > 0) {
      adjustedWinners = addRemainingToSeasonWinners(adjustedWinners, remainingAmount);
    }
    
    // Create chip usage object
    const chipUsage: { [key: string]: number } = {};
    chipNames.forEach(name => {
      chipUsage[name] = chipUsagePerChip;
    });

    const newPayoutStructure: PayoutStructure = {
      top20Winners: winners,
      scoreNStrike: scoreStrikePerWeek,
      weeklyWinner: weeklyWinnerPerWeek,
      chipUsage: chipUsage
    };

    setPayoutStructure(newPayoutStructure);
    setEditablePayouts(newPayoutStructure);
    setHasCalculated(true);
    setConfigChanged(false);
    setError(null);
  };

  // Helper function to calculate season winners payouts with proper logic
  const calculateSeasonWinnersPayouts = (seasonWinnersPool: number, paidWinners: number, entryFee: number): number[] => {
    const winners = [];
    
    // Step 1: Calculate bottom 20% of managers finishing in the money
    const bottom20Percent = Math.floor((paidWinners * 20) / 100);
    const bottom20Count = bottom20Percent < 0.5 ? Math.floor(bottom20Percent) : Math.ceil(bottom20Percent);
    
    // Step 2: Set aside entry fee for bottom 20%
    const bottom20EntryFees = bottom20Count * entryFee;
    const remainingPool = seasonWinnersPool - bottom20EntryFees;
    
    // Step 3: Calculate remaining top 80% managers
    const top80Count = paidWinners - bottom20Count;
    
    // Step 4: Distribute remaining pool among top 80% with descending payouts
    if (top80Count > 0) {
      // Calculate minimum payout for bottom manager (Eo)
      const minPayout = Math.round((130 * entryFee) / 100 / 5) * 5; // 130% of entry fee, rounded to nearest $5
      
      // Calculate descending payouts
      const payouts = calculateDescendingPayouts(remainingPool, top80Count, minPayout);
      
      // Add top 80% payouts
      winners.push(...payouts);
    }
    
    // Step 5: Add bottom 20% payouts (entry fee for each)
    for (let i = 0; i < bottom20Count; i++) {
      winners.push(entryFee);
    }
    
    return winners;
  };

  // Helper function to add remaining amount to season winners starting from position 1
  const addRemainingToSeasonWinners = (winners: number[], remainingAmount: number): number[] => {
    const adjustedWinners = [...winners];
    let amountToDistribute = remainingAmount;
    
    // Start from position 1 (index 0) and add in descending order
    for (let i = 0; i < adjustedWinners.length && amountToDistribute > 0; i++) {
      const increment = Math.min(amountToDistribute, 5); // Add in $5 increments
      adjustedWinners[i] += increment;
      amountToDistribute -= increment;
    }
    
    return adjustedWinners;
  };

  // Helper function to calculate descending payouts ensuring minimum payout
  const calculateDescendingPayouts = (totalPool: number, winnersCount: number, minPayout: number): number[] => {
    const payouts = [];
    let remainingPool = totalPool;
    
    // Calculate base increment to ensure descending order
    const baseIncrement = Math.max(5, Math.round((totalPool - (minPayout * winnersCount)) / (winnersCount * (winnersCount + 1) / 2)));
    
    for (let i = 0; i < winnersCount; i++) {
      let payout;
      if (i === winnersCount - 1) {
        // Last position gets minimum payout
        payout = minPayout;
      } else {
        // Other positions get incrementally more
        const increment = baseIncrement * (winnersCount - i);
        payout = minPayout + increment;
      }
      
      // Round to nearest $5
      payout = Math.round(payout / 5) * 5;
      payouts.push(payout);
      remainingPool -= payout;
    }
    
    // Adjust if there's remaining pool
    if (remainingPool > 0 && payouts.length > 0) {
      payouts[0] += Math.round(remainingPool / 5) * 5; // Add to first place
    }
    
    return payouts;
  };

  const recalculatePayoutStructure = () => {
    const entryFee = parseFloat(managerEntryFee);
    const totalManagersCount = parseInt(totalManagers);
    const scoreStrikeWeeksCount = parseInt(scoreStrikeWeeks);
    const weeklyWinnerWeeksCount = parseInt(weeklyWinnerWeeks);
    const totalChipTypesCount = parseInt(totalChipTypes);
    
    if (!entryFee || !totalManagersCount || !scoreStrikeWeeksCount || !weeklyWinnerWeeksCount || !totalChipTypesCount) {
      setError('Please enter valid values for all fields');
      return;
    }

    // Step 1: Total Prize Pool
    const totalPrizePool = entryFee * totalManagersCount;
    
    // Step 2: Season Winners Pool - Top 20% Distribution
    const seasonWinnersPool = Math.ceil(totalPrizePool / 2 / 10) * 10; // Round up to nearest 10
    
    // Step 3: Season Winners Pool - Top 20% Distribution
    const paidWinners = Math.floor(totalManagersCount * 0.20); // Round down to nearest whole number
    const winners = calculateSeasonWinnersPayouts(seasonWinnersPool, paidWinners, entryFee);
    
    // Step 4: Side Contest Pool Breakdown with randomization
    // L = X*Y - A (Total manager*manager entry fee - Season Winners Pool)
    const sideContestPool = totalPrizePool - seasonWinnersPool;
    
    // S = W = (L*45)/100 (Score & Strike = Weekly Contest = 45% each)
    const scoreStrikePool = Math.round(sideContestPool * 0.45);
    const weeklyWinnerPool = Math.round(sideContestPool * 0.45);
    
    // Add some randomization to the side contest allocations
    const variation = 0.1; // 10% variation
    const randomScoreStrikePool = scoreStrikePool + (Math.random() - 0.5) * scoreStrikePool * variation;
    const randomWeeklyWinnerPool = weeklyWinnerPool + (Math.random() - 0.5) * weeklyWinnerPool * variation;
    
    // Calculate weekly amounts with rounding to nearest $5
    let scoreStrikePerWeek = Math.round(randomScoreStrikePool / scoreStrikeWeeksCount / 5) * 5;
    let weeklyWinnerPerWeek = Math.round(randomWeeklyWinnerPool / weeklyWinnerWeeksCount / 5) * 5;
    
    // Recalculate total S+W to ensure it equals (L*90)/100
    const totalSW = (scoreStrikePerWeek * scoreStrikeWeeksCount) + (weeklyWinnerPerWeek * weeklyWinnerWeeksCount);
    
    // H = L - (S+W) - remaining for chips
    const chipUsagePool = sideContestPool - totalSW;
    let chipUsagePerChip = Math.round(chipUsagePool / totalChipTypesCount / 5) * 5; // nearest $5
    
    // Rule: Si = Wi = Hi/2 - reduce the higher amount to match the lower amount
    let remainingAmount = 0;
    const chipUsagePerChipHalf = chipUsagePerChip / 2;
    
    // Find the minimum value among the three
    const minValue = Math.min(scoreStrikePerWeek, weeklyWinnerPerWeek, chipUsagePerChipHalf);
    
    // Calculate remaining amounts from each category
    if (scoreStrikePerWeek > minValue) {
      remainingAmount += (scoreStrikePerWeek - minValue) * scoreStrikeWeeksCount;
      scoreStrikePerWeek = minValue;
    }
    
    if (weeklyWinnerPerWeek > minValue) {
      remainingAmount += (weeklyWinnerPerWeek - minValue) * weeklyWinnerWeeksCount;
      weeklyWinnerPerWeek = minValue;
    }
    
    if (chipUsagePerChipHalf > minValue) {
      remainingAmount += (chipUsagePerChipHalf - minValue) * totalChipTypesCount * 2; // *2 because we're working with Hi/2
      chipUsagePerChip = minValue * 2; // Convert back to full Hi value
    } else {
      chipUsagePerChip = minValue * 2; // Convert back to full Hi value
    }
    
    // Add remaining amount to season winners pool starting from position 1
    let adjustedWinners = [...winners];
    if (remainingAmount > 0) {
      adjustedWinners = addRemainingToSeasonWinners(adjustedWinners, remainingAmount);
    }
    
    // Create chip usage object
    const chipUsage: { [key: string]: number } = {};
    chipNames.forEach(name => {
      chipUsage[name] = chipUsagePerChip;
    });

    const newPayoutStructure: PayoutStructure = {
      top20Winners: winners,
      scoreNStrike: scoreStrikePerWeek,
      weeklyWinner: weeklyWinnerPerWeek,
      chipUsage: chipUsage
    };

    setPayoutStructure(newPayoutStructure);
    setEditablePayouts(newPayoutStructure);
    setHasCalculated(true);
    setConfigChanged(false);
    setError(null);
  };

  // Helper function to generate random descending payouts
  const generateRandomDescendingPayouts = (totalPool: number, winnersCount: number, entryFee: number): number[] => {
    const winners = [];
    let remainingPool = totalPool;
    
    // Last rank gets entry fee (rounded to nearest $5)
    const lastPayout = Math.round(entryFee / 5) * 5;
    winners.push(lastPayout);
    remainingPool -= lastPayout;
    
    // Generate random but descending payouts
    for (let i = 1; i < winnersCount; i++) {
      const position = winnersCount - i - 1;
      const minIncrement = Math.round(entryFee * 0.1); // Minimum 10% of entry fee
      const maxIncrement = Math.round(remainingPool / (winnersCount - i));
      
      const randomIncrement = Math.round(
        (minIncrement + Math.random() * (maxIncrement - minIncrement)) / 5
      ) * 5;
      
      const payout = Math.round((lastPayout + randomIncrement * (i + 1)) / 5) * 5;
      winners.unshift(payout);
      remainingPool -= payout;
    }
    
    return winners;
  };

  const clearAll = () => {
    // Clear all input fields
    setManagerEntryFee('');
    setTotalManagers('');
    setScoreStrikeWeeks('38');
    setWeeklyWinnerWeeks('38');
    setTotalChipTypes('3');
    setSelectedChips([]);
    setChipNames(['Triple Captain', 'Bench Boost', 'Free Hit']);
    
    // Reset payout structures
    setPayoutStructure({
      top20Winners: [],
      scoreNStrike: 0,
      weeklyWinner: 0,
      chipUsage: {}
    });
    setEditablePayouts({
      top20Winners: [],
      scoreNStrike: 0,
      weeklyWinner: 0,
      chipUsage: {}
    });
    
    // Reset all state flags
    setIsEditMode(false);
    setIsConfirmed(false);
    setHasCalculated(false);
    setConfigChanged(false);
    setError(null);
    
    // Reset page to configuration if currently on payout structure or summary
    if (currentPage === 'payoutStructure' || currentPage === 'summary') {
      setCurrentPage('configuration');
    }
    
    // Clear any cached calculations or stored data
    fplApi.clearCache();
    console.log('All fields and cache cleared successfully');
  };

  const enterEditMode = () => {
    setIsEditMode(true);
    setEditablePayouts({ ...payoutStructure });
    setCurrentPage('payoutStructure');
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    setEditablePayouts({ ...payoutStructure });
    setCurrentPage('configuration');
  };



  const confirmEdit = async () => {
    if (!user || !managerFplId) {
      setError('User not authenticated');
      return;
    }

    const totalPrizePool = parseFloat(managerEntryFee) * parseInt(totalManagers);
    const currentTotal = getTotalPayouts();

    if (Math.abs(totalPrizePool - currentTotal) > 1) {
      setError('Total payout amount must equal total prize pool');
      return;
    }

    try {
      // Check if there's an existing configuration to update
      const existingConfig = await dbUtils.getLatestAdminConfig();
      
      const adminConfig: AdminConfig = {
        managerEntryFee: parseFloat(managerEntryFee),
        totalManagers: parseInt(totalManagers),
        payoutStructure: editablePayouts,
        isConfirmed: true,
        timestamp: new Date(),
        adminId: managerFplId,
        leagueId: parseInt(selectedLeagueId),
        ...(existingConfig && { updatedAt: new Date() }) // Add updatedAt if updating existing config
      };

      await dbUtils.saveAdminConfig(adminConfig);
      
      // Mark the league as created
      await dbUtils.updateLeagueCreatedStatus(parseInt(selectedLeagueId), true);
      

      
      setPayoutStructure(editablePayouts);
      setIsConfirmed(true);
      setIsEditMode(false);
      setIsEditFinalized(false);
      setError(null);
      setCurrentPage('summary');
      console.log('Admin configuration saved successfully');
    } catch (err: any) {
      console.error('Error saving admin config:', err);
      if (err.name === 'VersionError') {
        setError(
          'Database version conflict detected. This usually happens when the app has been updated. ' +
          'Please clear your browser data or use the buttons below to reset the database.'
        );
      } else {
        setError(`Failed to save configuration: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const handleEditAfterConfirm = () => {
    const proceed = window.confirm(
      '⚠️ Warning: Updating payout structure will not result in backtracking already dispensed payouts.\n\n' +
      'This means any changes you make will only affect future payouts, not past ones.\n\n' +
      'Do you want to proceed with editing the payout structure?'
    );
    
    if (proceed) {
      setIsConfirmed(false);
      setIsEditMode(true);
      setError(null);
    }
  };



  const handleEditLeagueConfig = () => {
    const proceed = window.confirm(
      '⚠️ Warning: Editing league configuration will reset the current payout structure.\n\n' +
      'This will require you to recalculate the payouts after making changes.\n\n' +
      'Do you want to proceed with editing the league configuration?'
    );
    
    if (proceed) {
      setCurrentPage('configuration');
      setIsConfirmed(false);
      setIsEditMode(false);
      setHasCalculated(false);
      setError(null);
    }
  };



  const verifyLeagueId = async () => {
    if (!newLeagueId.trim()) {
      setLeagueVerificationError('Please enter a League ID');
      return;
    }

    const leagueId = parseInt(newLeagueId.trim());
    if (isNaN(leagueId) || leagueId <= 0) {
      setLeagueVerificationError('Please enter a valid League ID (positive number)');
      return;
    }

    setVerifyingLeague(true);
    setLeagueVerificationError(null);

    try {
      console.log(`🔍 Verifying League ID: ${leagueId}`);
      const leagueData = await fplApi.getLeagueStandings(leagueId);
      
      if (leagueData && leagueData.league) {
        const leagueName = leagueData.league.name;
        console.log(`✅ League verified: ${leagueName}`);
        setNewLeagueName(leagueName);
        setSelectedLeagueId(leagueId.toString());
        setLeagueName(leagueName);
        
        // Clear form data for new league
        setManagerEntryFee('');
        setTotalManagers('');
        setScoreStrikeWeeks('38');
        setWeeklyWinnerWeeks('38');
        setTotalChipTypes('3');
        setChipNames(['Triple Captain', 'Bench Boost', 'Free Hit']);
        setPayoutStructure({
          top20Winners: [],
          scoreNStrike: 0,
          weeklyWinner: 0,
          chipUsage: {}
        });
        setIsConfirmed(false);
        setIsEditMode(false);
        setHasCalculated(false);
        setConfigChanged(false);
        setError(null);
        
        // Proceed to configuration
        setCurrentPage('configuration');
      } else {
        setLeagueVerificationError('League not found or invalid League ID');
      }
    } catch (error: any) {
      console.error('❌ Error verifying league:', error);
      setLeagueVerificationError(
        error.response?.status === 404 
          ? 'League not found. Please check the League ID.' 
          : 'Error verifying league. Please try again.'
      );
    } finally {
      setVerifyingLeague(false);
    }
  };

  const cancelAddLeague = () => {
    setNewLeagueId('');
    setNewLeagueName('');
    setLeagueVerificationError(null);
    setCurrentPage('summary');
  };

  const updateEditablePayout = (field: keyof PayoutStructure, value: number | number[] | { [key: string]: number }) => {
    setEditablePayouts(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateWinnerPayout = (index: number, value: number) => {
    const newWinners = [...editablePayouts.top20Winners];
    newWinners[index] = value;
    updateEditablePayout('top20Winners', newWinners);
  };



  const updateChipUsageAmount = (chipName: string, amount: number) => {
    const newChipUsage = { ...editablePayouts.chipUsage };
    newChipUsage[chipName] = amount;
    updateEditablePayout('chipUsage', newChipUsage);
  };

  const getTotalPayouts = () => {
    const currentPayouts = isEditMode ? editablePayouts : payoutStructure;
    
    // Season Winners Pool
    const seasonWinnersTotal = currentPayouts.top20Winners.reduce((sum, payout) => sum + payout, 0);
    
    // Side Contest Totals
    const scoreStrikeTotal = currentPayouts.scoreNStrike * parseInt(scoreStrikeWeeks || '0');
    const weeklyWinnerTotal = currentPayouts.weeklyWinner * parseInt(weeklyWinnerWeeks || '0');
    const chipUsageTotal = Object.values(currentPayouts.chipUsage).reduce((sum, amount) => sum + amount, 0);
    
    // Total of all categories
    return seasonWinnersTotal + scoreStrikeTotal + weeklyWinnerTotal + chipUsageTotal;
  };

  const formatCurrency = (amount: number) => {
    return formatCurrencyWithCoin(amount);
  };

  const getSuggestionForField = (fieldName: string, currentValue: number) => {
    if (!isEditMode) return null;
    
    const totalPrizePool = parseFloat(managerEntryFee) * parseInt(totalManagers);
    const currentTotal = getTotalPayouts();
    const difference = totalPrizePool - currentTotal;
    
    if (Math.abs(difference) < 1) return null; // Already balanced
    
    // Calculate how much to add/subtract from this specific field
    let suggestion = 0;
    
    if (fieldName === 'scoreNStrike') {
      const weeks = parseInt(scoreStrikeWeeks || '0');
      if (weeks > 0) {
        suggestion = Math.round(difference / weeks / 5) * 5; // Round to nearest $5
      }
    } else if (fieldName === 'weeklyWinner') {
      const weeks = parseInt(weeklyWinnerWeeks || '0');
      if (weeks > 0) {
        suggestion = Math.round(difference / weeks / 5) * 5; // Round to nearest $5
      }
    } else if (fieldName === 'chipUsage') {
      const chipCount = Object.keys(editablePayouts.chipUsage).length;
      if (chipCount > 0) {
        suggestion = Math.round(difference / chipCount / 5) * 5; // Round to nearest $5
      }
    } else if (fieldName.startsWith('winner_')) {
      // For individual winner positions
      suggestion = Math.round(difference / 5) * 5; // Round to nearest $5
    }
    
    return suggestion;
  };

  const isFormValid = () => {
    return managerEntryFee !== '' && totalManagers !== '' && 
           scoreStrikeWeeks !== '' && weeklyWinnerWeeks !== '' && totalChipTypes !== '' &&
           parseFloat(managerEntryFee) > 0 && parseInt(totalManagers) >= 4 &&
           parseInt(scoreStrikeWeeks) >= 1 && parseInt(scoreStrikeWeeks) <= 38 &&
           parseInt(weeklyWinnerWeeks) >= 1 && parseInt(weeklyWinnerWeeks) <= 38 &&
           parseInt(totalChipTypes) >= 0 && parseInt(totalChipTypes) <= 8;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg text-gray-600">Loading admin panel...</div>
      </div>
    );
  }



  return (
    <div className="space-y-3 sm:space-y-4 max-w-6xl mx-auto">
      {/* Compact Header - FPL-style sizing */}
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-extrabold mb-2 sm:mb-3 bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent drop-shadow-md">
          ⚙️ Admin Panel
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600 font-medium">
          Manage league configuration and payout structure
        </p>
      </div>

      {/* Compact Error Display with Database Reset Options - FPL-style sizing */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
          <div className="text-red-600 mb-2 sm:mb-3 text-sm sm:text-base font-medium">{error}</div>
          {(error.includes('Database version conflict') || error.includes('Database connection timed out')) && (
            <div className="mt-2 sm:mt-3">
              <p className="text-xs sm:text-sm text-red-700 mb-2 sm:mb-3">
                This is a database issue. Try clearing your browser's IndexedDB:
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={async () => {
                    try {
                      console.log('🔄 Clearing database data...');
                      await dbUtils.clearAllData();
                      console.log('✅ Database cleared, reloading page...');
                      window.location.reload();
                    } catch (err: any) {
                      console.error('❌ Error clearing data:', err);
                      alert(`Failed to clear database: ${err.message || 'Unknown error'}`);
                    }
                  }}
                  className="px-3 sm:px-4 py-2 sm:py-3 bg-red-600 text-white rounded hover:bg-red-700 text-xs sm:text-sm font-semibold touch-target"
                >
                  Clear Database Data
                </button>
                <button
                  onClick={async () => {
                    try {
                      console.log('🔄 Deleting entire database...');
                      await dbUtils.deleteDatabase();
                      console.log('✅ Database deleted, reloading page...');
                      window.location.reload();
                    } catch (err: any) {
                      console.error('❌ Error deleting database:', err);
                      alert(`Failed to delete database: ${err.message || 'Unknown error'}`);
                    }
                  }}
                  className="px-3 sm:px-4 py-2 sm:py-3 bg-red-800 text-white rounded hover:bg-red-900 text-xs sm:text-sm font-semibold touch-target"
                >
                  Delete Database (Nuclear Option)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compact League Configuration Summary - FPL-style sizing */}
      {currentPage === 'summary' && (
        <div className="bg-white rounded-lg p-3 sm:p-4 border mb-3 sm:mb-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-3 gap-2 sm:gap-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">League Configuration Summary</h3>
            <div className="flex gap-2">
              <button
                onClick={handleEditLeagueConfig}
                className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-600 text-white rounded text-xs sm:text-sm hover:bg-gray-700 transition-colors touch-target font-medium"
                title="Edit current league configuration"
              >
                ✏️ Edit Current
              </button>
            </div>
          </div>
          
          {/* Compact Summary Layout - FPL-style sizing */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-3 sm:p-4 rounded-lg border border-gray-200">
            {/* Mobile: Full-width stacked, Desktop: Grid layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-4">
              {/* League Name */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Name:</span>
                <span className="text-xs sm:text-sm font-semibold text-blue-900">
                  {currentLeagueInfo?.leagueName || 'Ordinary Gentlemen'}
                </span>
              </div>

              {/* Participants */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Participants:</span>
                <span className="text-xs sm:text-sm font-semibold text-green-700">{totalManagers}</span>
              </div>

              {/* Total Prize Pool */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Total Pool:</span>
                <span className="text-xs sm:text-sm font-semibold text-purple-700">
                  {formatCurrency(parseFloat(managerEntryFee || '0') * parseInt(totalManagers || '0'))}
                </span>
              </div>

              {/* League Winners */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Winners:</span>
                <span className="text-xs sm:text-sm font-semibold text-yellow-700">
                  {formatCurrency(payoutStructure.top20Winners.reduce((sum, payout) => sum + payout, 0))}
                </span>
              </div>

              {/* Score & Strike */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Score & Strike:</span>
                <span className="text-xs sm:text-sm font-semibold text-red-700">
                  {formatCurrency(payoutStructure.scoreNStrike * parseInt(scoreStrikeWeeks || '0'))}
                </span>
              </div>

              {/* Weekly */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Weekly:</span>
                <span className="text-xs sm:text-sm font-semibold text-indigo-700">
                  {formatCurrency(payoutStructure.weeklyWinner * parseInt(weeklyWinnerWeeks || '0'))}
                </span>
              </div>

              {/* Chips */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Chips:</span>
                <span className="text-xs sm:text-sm font-semibold text-pink-700">
                  {formatCurrency(Object.values(payoutStructure.chipUsage).reduce((sum, amount) => sum + amount, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Input Fields - FPL-style sizing */}
      {currentPage === 'configuration' && (
        <div className="bg-white rounded-lg p-3 sm:p-4 lg:p-6 border">
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4">League Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manager Entry Fee
            </label>
            <div>
              <input
                type="text"
                value={managerEntryFee}
                onChange={(e) => {
                  setManagerEntryFee(e.target.value);
                  setConfigChanged(true);
                }}
                disabled={isEditMode || isConfirmed}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Managers
            </label>
            <input
              type="text"
              value={totalManagers}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 999 && /^\d+$/.test(value))) {
                  setTotalManagers(value);
                  setConfigChanged(true);
                }
              }}
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              disabled={isEditMode || isConfirmed}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Score and Strike
            </label>
            <input
              type="text"
              value={scoreStrikeWeeks}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 38 && /^\d+$/.test(value))) {
                  setScoreStrikeWeeks(value);
                  setConfigChanged(true);
                }
              }}
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              disabled={isEditMode || isConfirmed}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="38"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weekly
            </label>
            <input
              type="text"
              value={weeklyWinnerWeeks}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 38 && /^\d+$/.test(value))) {
                  setWeeklyWinnerWeeks(value);
                  setConfigChanged(true);
                }
              }}
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              disabled={isEditMode || isConfirmed}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="38"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chips
            </label>
            <input
              type="text"
              value={totalChipTypes}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 8 && /^\d+$/.test(value))) {
                  setTotalChipTypes(value);
                  setConfigChanged(true);
                }
              }}
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              disabled={isEditMode || isConfirmed}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="3"
            />
          </div>
        </div>

        {/* Chip Names */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chip Names
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {chipNames.map((name, index) => (
              <div key={index}>
                <select
                  value={name}
                  onChange={(e) => updateChipName(index, e.target.value)}
                  disabled={isEditMode || isConfirmed}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 bg-white text-gray-900 [appearance:none] bg-[length:12px_8px] bg-[right_12px_center] bg-no-repeat pr-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`
                  }}
                >
                  <option value="">Select Chip {index + 1}</option>
                  {availableChips.map((chip) => (
                    <option 
                      key={chip} 
                      value={chip}
                      disabled={chipNames.includes(chip) && chip !== name}
                      className="py-2 px-3 hover:bg-blue-50"
                    >
                      {chip}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={hasCalculated ? recalculatePayoutStructure : calculatePayoutStructure}
            disabled={(!isFormValid() && !configChanged) || isEditMode || isConfirmed}
            className={`px-4 py-2 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed ${
              hasCalculated 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {hasCalculated ? 'Recalculate' : 'Calculate'}
          </button>
          
          <button
            onClick={clearAll}
            disabled={isEditMode || isConfirmed}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            Clear
          </button>
          
          {payoutStructure.top20Winners.length > 0 && (
            <button
              onClick={enterEditMode}
              disabled={isConfirmed || isEditMode}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              ✏️ Edit Payout Structure
            </button>
          )}
          
          {/* Conditional Confirm Button */}
          {hasCalculated && (
            <button
              onClick={confirmEdit}
              disabled={(() => {
                const totalPrizePool = parseFloat(managerEntryFee || '0') * parseInt(totalManagers || '0');
                const calculatedPayouts = getTotalPayouts();
                return Math.abs(totalPrizePool - calculatedPayouts) > 1 || isConfirmed;
              })()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              ✓ Confirm
            </button>
          )}

          {/* Cancel Button - Only show when adding a new league */}
          {currentPage === 'configuration' && newLeagueId && (
            <button
              onClick={() => {
                const proceed = window.confirm(
                  '⚠️ Cancel League Configuration\n\n' +
                  'This will abort the current league configuration process and return to the league verification screen.\n\n' +
                  'All unsaved changes will be lost.\n\n' +
                  'Do you want to proceed?'
                );
                
                if (proceed) {
                  // Reset to league verification screen
                  setCurrentPage('addLeague');
                  setNewLeagueId('');
                  setNewLeagueName('');
                  setLeagueVerificationError(null);
                  setVerifyingLeague(false);
                }
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              title="Cancel and return to league verification"
            >
              ❌ Cancel Configuration
            </button>
          )}
        </div>
      </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 mb-3">{error}</div>
          {error.includes('VersionError') && (
            <div className="mt-3">
              <p className="text-sm text-red-700 mb-2">
                This is a database version conflict. Try clearing your browser's IndexedDB:
              </p>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      await dbUtils.clearAllData();
                      setError(null);
                      window.location.reload();
                    } catch (err) {
                      console.error('Error clearing database:', err);
                    }
                  }}
                  className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Clear Database Data
                </button>
                <button
                  onClick={async () => {
                    try {
                      await dbUtils.deleteDatabase();
                      setError(null);
                      window.location.reload();
                    } catch (err) {
                      console.error('Error deleting database:', err);
                    }
                  }}
                  className="px-3 py-1.5 bg-red-800 text-white rounded text-sm hover:bg-red-900"
                >
                  Delete Database (Nuclear Option)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Balance Notification */}
      {hasCalculated && !isEditMode && (() => {
        const totalPrizePool = parseFloat(managerEntryFee || '0') * parseInt(totalManagers || '0');
        const calculatedPayouts = getTotalPayouts();
        const difference = totalPrizePool - calculatedPayouts;
        const absDifference = Math.abs(difference);
        
        if (absDifference > 1) {
          const differenceText = difference > 0 
            ? `Add ${formatCurrency(absDifference)} to payouts`
            : `Subtract ${formatCurrency(absDifference)} from payouts`;
          
          return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="text-yellow-800">
                <strong>⚠️ Payout Mismatch:</strong> Calculated Payout Amounts ({formatCurrency(calculatedPayouts)}) ≠ Total Prize Pool ({formatCurrency(totalPrizePool)})
                <br />
                <span className="text-sm font-medium">{differenceText}</span>
                <br />
                <span className="text-sm">Click "Edit" to adjust winnings and balance the totals.</span>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Payout Structure Display */}
      {currentPage === 'payoutStructure' && payoutStructure.top20Winners.length > 0 && (
        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Payout Structure</h3>
            {isConfirmed && !isEditMode && (
              <button
                onClick={handleEditAfterConfirm}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                title="Edit payout structure"
              >
                ✏️
              </button>
            )}
          </div>
          
          {/* Top 20% Winners */}
          <div className="mb-4">
            <h4 className="text-base font-medium text-gray-800 mb-2">Top 20% Winners</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {(isEditMode ? editablePayouts : payoutStructure).top20Winners.map((payout, index) => (
                <div key={index} className="text-center">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {index + 1}{getOrdinalSuffix(index + 1)}
                  </label>
                  <input
                    type="text"
                    value={isEditMode ? editablePayouts.top20Winners[index] || 0 : `$${(payout || 0).toFixed(2)}`}
                    onChange={(e) => {
                      if (isEditMode) {
                        updateWinnerPayout(index, parseFloat(e.target.value) || 0);
                      }
                    }}
                    disabled={!isEditMode || isConfirmed}
                    className="w-full px-1 py-1 border border-gray-300 rounded text-center text-xs disabled:bg-gray-100"
                    title={isEditMode ? (() => {
                      const suggestion = getSuggestionForField(`winner_${index}`, editablePayouts.top20Winners[index]);
                      return suggestion ? `💡 Add ${formatCurrency(suggestion)} to balance totals` : '';
                    })() : ''}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Side Contest Prizes */}
          <div className="mb-4">
            <h4 className="text-base font-medium text-gray-800 mb-2">Side Contest Prizes</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  💥 Score & Strike (Per Week)
                </label>
                <input
                  type="text"
                  value={isEditMode ? editablePayouts.scoreNStrike || 0 : `$${(payoutStructure.scoreNStrike || 0).toFixed(2)}`}
                  onChange={(e) => {
                    if (isEditMode) {
                      updateEditablePayout('scoreNStrike', parseFloat(e.target.value) || 0);
                    }
                  }}
                  disabled={!isEditMode || isConfirmed}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                  title={isEditMode ? (() => {
                    const suggestion = getSuggestionForField('scoreNStrike', editablePayouts.scoreNStrike);
                    return suggestion ? `💡 Add ${formatCurrency(suggestion)} to balance totals` : '';
                  })() : ''}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  ⚡ Weekly Winner (Per Week)
                </label>
                <input
                  type="text"
                  value={isEditMode ? editablePayouts.weeklyWinner || 0 : `$${(payoutStructure.weeklyWinner || 0).toFixed(2)}`}
                  onChange={(e) => {
                    if (isEditMode) {
                      updateEditablePayout('weeklyWinner', parseFloat(e.target.value) || 0);
                    }
                  }}
                  disabled={!isEditMode || isConfirmed}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                  title={isEditMode ? (() => {
                    const suggestion = getSuggestionForField('weeklyWinner', editablePayouts.weeklyWinner);
                    return suggestion ? `💡 Add ${formatCurrency(suggestion)} to balance totals` : '';
                  })() : ''}
                />
              </div>
            </div>
          </div>

          {/* Chip Usage Prizes */}
          <div className="mb-4">
            <h4 className="text-base font-medium text-gray-800 mb-2">🎯 Chip Usage Prizes</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(isEditMode ? editablePayouts.chipUsage : payoutStructure.chipUsage).map(([chipName, amount]) => (
                <div key={chipName}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {chipName}
                  </label>
                  <input
                    type="text"
                    value={isEditMode ? amount || 0 : `$${(amount || 0).toFixed(2)}`}
                    onChange={(e) => {
                      if (isEditMode) {
                        updateChipUsageAmount(chipName, parseFloat(e.target.value) || 0);
                      }
                    }}
                    disabled={!isEditMode || isConfirmed}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs disabled:bg-gray-100"
                    title={isEditMode ? (() => {
                      const suggestion = getSuggestionForField('chipUsage', amount);
                      return suggestion ? `💡 Add ${formatCurrency(suggestion)} to balance totals` : '';
                    })() : ''}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Payout Breakdown */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h4 className="text-base font-medium text-gray-800 mb-2">Payout Breakdown</h4>
            
            {/* Compact Totals Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div className="text-center">
                <span className="text-xs text-gray-600">Season Winners:</span>
                <div className="text-sm font-semibold text-blue-600">
                  {formatCurrency((isEditMode ? editablePayouts : payoutStructure).top20Winners.reduce((sum, payout) => sum + payout, 0))}
                </div>
              </div>
              
              <div className="text-center">
                <span className="text-xs text-gray-600">Score & Strike:</span>
                <div className="text-sm font-semibold text-purple-600">
                  {formatCurrency((isEditMode ? editablePayouts : payoutStructure).scoreNStrike * parseInt(scoreStrikeWeeks || '0'))}
                </div>
              </div>
              
              <div className="text-center">
                <span className="text-xs text-gray-600">Weekly Winner:</span>
                <div className="text-sm font-semibold text-orange-600">
                  {formatCurrency((isEditMode ? editablePayouts : payoutStructure).weeklyWinner * parseInt(weeklyWinnerWeeks || '0'))}
                </div>
              </div>
              
              <div className="text-center">
                <span className="text-xs text-gray-600">Chip Usage:</span>
                <div className="text-sm font-semibold text-green-600">
                  {formatCurrency(Object.values((isEditMode ? editablePayouts : payoutStructure).chipUsage).reduce((sum, amount) => sum + amount, 0))}
                </div>
              </div>
            </div>

            {/* Total Prize Pool vs Calculated Payouts */}
            <div className="pt-3 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <span className="text-sm font-semibold text-gray-800">Total Prize Pool:</span>
                  <div className="text-base font-bold text-green-600">
                    {formatCurrency(parseFloat(managerEntryFee || '0') * parseInt(totalManagers || '0'))}
                  </div>
                </div>
                
                <div className="text-center">
                  <span className="text-sm font-semibold text-gray-800">Calculated Payouts:</span>
                  <div className="text-base font-bold text-blue-600">
                    {formatCurrency(getTotalPayouts())}
                  </div>
                </div>
              </div>
              
              {isEditMode && (
                <div className="mt-2 text-xs text-center">
                  {(() => {
                    const totalPrizePool = parseFloat(managerEntryFee || '0') * parseInt(totalManagers || '0');
                    const calculatedPayouts = getTotalPayouts();
                    const difference = totalPrizePool - calculatedPayouts;
                    const absDifference = Math.abs(difference);
                    
                    if (absDifference <= 1) {
                      return <span className="text-green-600">✓ Balanced - Payouts match Prize Pool</span>;
                    } else {
                      const differenceText = difference > 0 
                        ? `Add ${formatCurrency(absDifference)} to payouts`
                        : `Subtract ${formatCurrency(absDifference)} from payouts`;
                      return (
                        <span className="text-red-600">
                          ✗ Unbalanced - Payouts must equal Prize Pool
                          <br />
                          <span className="text-red-500 font-medium">{differenceText}</span>
                        </span>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Score & Strike Rollover Rules */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Score & Strike Rollover Rules</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <div>• Weekly prize pool: {formatCurrency((isEditMode ? editablePayouts : payoutStructure).scoreNStrike)} per week</div>
              <div>• Predict score + goalscorer correctly to win</div>
              <div>• Multiple winners: share pot equally</div>
              <div>• No winner: pot rolls over to next gameweek</div>
              <div>• GW38: if no winner, pot goes to manager with most wins</div>
            </div>
          </div>

          {/* Confirmed Configuration Display */}
          {isConfirmed && !isEditMode && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-green-800 mb-1">✅ Configuration Confirmed</h4>
                  <div className="text-xs text-green-700 space-y-1">
                    <div>• League configuration and payout structure saved</div>
                    <div>• All calculations locked and ready for distribution</div>
                    <div>• Click pencil icon above to make changes</div>
                  </div>
                </div>
                <button
                  onClick={handleEditAfterConfirm}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                  title="Edit payout structure"
                >
                  ✏️ Edit
                </button>
              </div>
            </div>
          )}

          {/* Confirm and Cancel Buttons - Bottom Right Corner */}
          {isEditMode && (
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={cancelEdit}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmEdit}
                disabled={(() => {
                  const totalPrizePool = parseFloat(managerEntryFee || '0') * parseInt(totalManagers || '0');
                  const calculatedPayouts = getTotalPayouts();
                  return Math.abs(totalPrizePool - calculatedPayouts) > 1;
                })()}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Confirm
              </button>
            </div>
          )}

          {/* Cancel Configuration Button - Only show when adding a new league */}
          {currentPage === 'payoutStructure' && newLeagueId && (
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  const proceed = window.confirm(
                    '⚠️ Cancel League Configuration\n\n' +
                    'This will abort the current league configuration process and return to the league verification screen.\n\n' +
                    'All unsaved changes will be lost.\n\n' +
                    'Do you want to proceed?'
                  );
                  
                  if (proceed) {
                    // Reset to league verification screen
                    setCurrentPage('addLeague');
                    setNewLeagueId('');
                    setNewLeagueName('');
                    setLeagueVerificationError(null);
                    setVerifyingLeague(false);
                    setIsEditMode(false);
                  }
                }}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                title="Cancel and return to league verification"
              >
                ❌ Cancel Configuration
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function for ordinal suffixes
function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
} 