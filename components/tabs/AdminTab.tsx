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
  const [currentPage, setCurrentPage] = useState<'leagueConfiguration' | 'scoreAndStrike' | 'headsUpSetup' | 'weeklyUtility'>('leagueConfiguration');
  const [leagueConfigs, setLeagueConfigs] = useState<AdminConfig[]>([]);
  const [currentLeagueIndex, setCurrentLeagueIndex] = useState<number>(-1);
  const [newLeagueId, setNewLeagueId] = useState<string>('');
  const [newLeagueName, setNewLeagueName] = useState<string>('');
  const [verifyingLeague, setVerifyingLeague] = useState<boolean>(false);
  const [leagueVerificationError, setLeagueVerificationError] = useState<string | null>(null);
  const [currentLeagueInfo, setCurrentLeagueInfo] = useState<LeagueInfo | null>(null);
  
  // Score and Strike state
  const [selectedGameweek, setSelectedGameweek] = useState<number>(1);
  const [gameweeks, setGameweeks] = useState<any[]>([]);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [leagueStandings, setLeagueStandings] = useState<any[]>([]);
  const [scoreStrikeEntries, setScoreStrikeEntries] = useState<any[]>([]);
  const [loadingScoreStrike, setLoadingScoreStrike] = useState(false);
  const [entryFormData, setEntryFormData] = useState<{[key: number]: {
    fixtureId: number;
    homeGoals: number;
    awayGoals: number;
    playerName: string;
  }}>({});

  // Heads Up Setup state
  const [headsUpEntryAmount, setHeadsUpEntryAmount] = useState<string>('');
  const [selectedHeadsUpManagers, setSelectedHeadsUpManagers] = useState<number[]>([]);
  const [headsUpConfigConfirmed, setHeadsUpConfigConfirmed] = useState(false);
  const [headsUpConfig, setHeadsUpConfig] = useState<{
    entryAmount: number;
    managers: number[];
    isActive: boolean;
    createdAt: Date;
  } | null>(null);

  // Weekly Utility state
  const [importingWeeklyData, setImportingWeeklyData] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    importedCount?: number;
    gameweek?: number;
  } | null>(null);
  const [weeklyWinners, setWeeklyWinners] = useState<any[]>([]);
  
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

  // Initialize Score and Strike data when component mounts or when switching to Score and Strike tab
  useEffect(() => {
    if (currentPage === 'scoreAndStrike' && managerFplId) {
      loadScoreAndStrikeData();
    }
  }, [currentPage, managerFplId]);

  // Initialize Heads Up Setup data when component mounts or when switching to Heads Up Setup tab
  useEffect(() => {
    if (currentPage === 'headsUpSetup' && managerFplId) {
      loadHeadsUpData();
    }
  }, [currentPage, managerFplId]);

  // Initialize Weekly Utility data when component mounts or when switching to Weekly Utility tab
  useEffect(() => {
    if (currentPage === 'weeklyUtility' && managerFplId) {
      loadWeeklyWinnersData();
    }
  }, [currentPage, managerFplId]);

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

  // Load Score and Strike data when page changes
  useEffect(() => {
    if (currentPage === 'scoreAndStrike') {
      loadScoreAndStrikeData();
    }
  }, [currentPage, selectedLeagueId]);

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

  const loadScoreAndStrikeData = async () => {
    try {
      setLoadingScoreStrike(true);
      
      // Load teams and players first
      const [teamsData, playersData] = await Promise.all([
        fplApi.getTeams(),
        fplApi.getPlayers()
      ]);
      setTeams(teamsData);
      setPlayers(playersData);
      
      // Load league standings
      const standingsData = await fplApi.getLeagueStandings(parseInt(selectedLeagueId));
      setLeagueStandings(standingsData.standings?.results || []);
      
      // Load ALL fixtures to get unique gameweeks
      const allFixturesData = await fplApi.getFixtures();
      
      // Extract unique gameweeks from fixtures endpoint
      const uniqueGameweeks = Array.from(new Set(allFixturesData.map(fixture => fixture.event)))
        .sort((a, b) => a - b)
        .map(eventId => ({
          id: eventId,
          name: `Gameweek ${eventId}`,
          event: eventId
        }));
      
      setGameweeks(uniqueGameweeks);
      
      // If no gameweek is selected or selected gameweek doesn't exist in fixtures, use first available
      if (!selectedGameweek || !uniqueGameweeks.find(gw => gw.id === selectedGameweek)) {
        setSelectedGameweek(uniqueGameweeks[0]?.id || 1);
      }
      
      // Load fixtures for selected gameweek
      const fixturesData = allFixturesData.filter(fixture => fixture.event === selectedGameweek);
      setFixtures(fixturesData);
      
      // Load existing score and strike entries for the gameweek
      const existingEntries = await dbUtils.getScoreStrikeEntriesByFixture(0, selectedGameweek);
      setScoreStrikeEntries(existingEntries);
      
      console.log('Score and Strike data loaded:', {
        gameweeks: uniqueGameweeks.length,
        fixtures: fixturesData.length,
        teams: teamsData.length,
        players: playersData.length,
        managers: standingsData.standings?.results?.length || 0,
        selectedGameweek,
        fixturesForGameweek: fixturesData.length
      });
      
    } catch (error) {
      console.error('Error loading Score and Strike data:', error);
    } finally {
      setLoadingScoreStrike(false);
    }
  };

  // Separate function to load fixtures for a specific gameweek
  const loadFixturesForGameweek = async (gameweek: number) => {
    try {
      console.log(`Loading fixtures for gameweek ${gameweek}...`);
      
      // Load ALL fixtures and filter for the specific gameweek
      const allFixturesData = await fplApi.getFixtures();
      const fixturesForGameweek = allFixturesData.filter(fixture => fixture.event === gameweek);
      
      setFixtures(fixturesForGameweek);
      
      console.log(`Fixtures loaded for GW${gameweek}:`, {
        totalFixtures: allFixturesData.length,
        fixturesForGameweek: fixturesForGameweek.length,
        gameweekIds: fixturesForGameweek.map(f => f.event),
        fixtureDetails: fixturesForGameweek.map(f => ({
          id: f.id,
          homeTeam: f.team_h,
          awayTeam: f.team_a,
          event: f.event
        }))
      });
      
      // Load existing score and strike entries for the new gameweek
      const existingEntries = await dbUtils.getScoreStrikeEntriesByFixture(0, gameweek);
      setScoreStrikeEntries(existingEntries);
      
    } catch (error) {
      console.error(`Error loading fixtures for gameweek ${gameweek}:`, error);
    }
  };

  // Heads Up Setup functions
  const loadHeadsUpData = async () => {
    try {
      // Load league standings to get available managers
      const standingsData = await fplApi.getLeagueStandings(parseInt(selectedLeagueId));
      setLeagueStandings(standingsData.standings?.results || []);
      
      // Load existing heads up configuration if any
      const existingConfig = await dbUtils.getHeadsUpConfig();
      if (existingConfig) {
        setHeadsUpConfig(existingConfig);
        setHeadsUpEntryAmount(existingConfig.entryAmount.toString());
        setSelectedHeadsUpManagers(existingConfig.managers);
        setHeadsUpConfigConfirmed(existingConfig.isActive);
      }
      
      console.log('Heads Up data loaded:', {
        managers: standingsData.standings?.results?.length || 0,
        existingConfig: existingConfig ? 'Found' : 'None'
      });
      
    } catch (error) {
      console.error('Error loading Heads Up data:', error);
    }
  };

  const handleManagerSelection = (managerId: number) => {
    setSelectedHeadsUpManagers(prev => {
      if (prev.includes(managerId)) {
        return prev.filter(id => id !== managerId);
      } else {
        return prev.concat(managerId);
      }
    });
  };

  const confirmHeadsUpConfig = async () => {
    try {
      if (!headsUpEntryAmount || parseFloat(headsUpEntryAmount) <= 0) {
        setError('Please enter a valid entry amount');
        return;
      }
      
      if (selectedHeadsUpManagers.length < 2) {
        setError('Please select at least 2 managers for heads up games');
        return;
      }
      
      const config = {
        entryAmount: parseFloat(headsUpEntryAmount),
        managers: selectedHeadsUpManagers,
        isActive: true,
        createdAt: new Date()
      };
      
      await dbUtils.saveHeadsUpConfig(config);
      setHeadsUpConfig(config);
      setHeadsUpConfigConfirmed(true);
      setError(null);
      
      console.log('Heads Up configuration confirmed:', config);
      
    } catch (error) {
      console.error('Error confirming Heads Up configuration:', error);
      setError('Failed to save Heads Up configuration');
    }
  };

  const resetHeadsUpConfig = () => {
    setHeadsUpConfig(null);
    setHeadsUpEntryAmount('');
    setSelectedHeadsUpManagers([]);
    setHeadsUpConfigConfirmed(false);
    setError(null);
  };

  // Weekly Utility functions
  const importWeeklyDataFromFPL = async () => {
    try {
      setImportingWeeklyData(true);
      setImportResult(null);
      setError(null);

      console.log('🔄 Starting weekly data import from FPL API...');
      
      // Get current gameweek from FPL API
      const gameweeksData = await fplApi.getGameweeks();
      const currentGameweek = gameweeksData.find(gw => gw.is_current);
      
      if (!currentGameweek) {
        throw new Error('Could not determine current gameweek from FPL API');
      }

      console.log(`📅 Current gameweek: ${currentGameweek.id} - ${currentGameweek.name}`);

      // Get league standings from FPL API for the current gameweek
      const standingsData = await fplApi.getLeagueStandings(parseInt(selectedLeagueId));
      const standings = standingsData.standings?.results || [];

      if (standings.length === 0) {
        throw new Error('No league standings found from FPL API');
      }

      console.log(`👥 Found ${standings.length} managers in league standings for GW${currentGameweek.id}`);

      // Check if data already exists for this gameweek
      const existingEntries = await dbUtils.getWeeklyWinnersByGameweek(currentGameweek.id);
      
      if (existingEntries.length > 0) {
        console.log(`⚠️ Found ${existingEntries.length} existing entries for GW${currentGameweek.id}`);
        
        // Always overwrite for the same gameweek to ensure data consistency
        console.log(`🔄 Overwriting existing data for GW${currentGameweek.id} to ensure consistency`);
        
        // Delete existing entries for this gameweek
        await dbUtils.deleteWeeklyWinnersByGameweek(currentGameweek.id);
        console.log(`🗑️ Deleted ${existingEntries.length} existing entries for GW${currentGameweek.id}`);
      }

      // Create weekly winner entries for all managers
      const weeklyWinnerEntries = standings.map((standing: any) => ({
        gameweek: currentGameweek.id,
        name: currentGameweek.name,
        managerName: standing.player_name,
        managerFplId: standing.entry,
        managerScore: standing.event_total,
        isCurrent: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Mark all existing entries as not current (only the latest imported gameweek should be current)
      await dbUtils.markAllWeeklyWinnersAsNotCurrent();

      // Save all new entries
      let importedCount = 0;
      for (const entry of weeklyWinnerEntries) {
        await dbUtils.saveWeeklyWinner(entry);
        importedCount++;
      }

      console.log(`✅ Successfully imported ${importedCount} weekly winner entries for Gameweek ${currentGameweek.id}`);

      setImportResult({
        success: true,
        message: `Successfully imported ${importedCount} entries for Gameweek ${currentGameweek.id}`,
        importedCount,
        gameweek: currentGameweek.id
      });

      // Refresh the page data if we're on a relevant tab
      if (currentPage === 'headsUpSetup') {
        loadHeadsUpData();
      }

      // Refresh the weekly winners data on this tab
      if (currentPage === 'weeklyUtility') {
        loadWeeklyWinnersData();
      }

    } catch (error) {
      console.error('❌ Error importing weekly data:', error);
      setError(`Failed to import weekly data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setImportResult({
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setImportingWeeklyData(false);
    }
  };

  const loadWeeklyWinnersData = async () => {
    try {
      const allWeeklyWinners = await dbUtils.getAllWeeklyWinners();
      setWeeklyWinners(allWeeklyWinners);
      console.log('Weekly winners data loaded:', allWeeklyWinners.length);
    } catch (error) {
      console.error('Error loading weekly winners data:', error);
      setError('Failed to load weekly winners data');
    }
  };

  const handleGameweekChange = async (gameweek: number) => {
    console.log(`Gameweek changed to: ${gameweek}`);
    setSelectedGameweek(gameweek);
    
    // Immediately load fixtures for the new gameweek
    await loadFixturesForGameweek(gameweek);
  };

  const saveScoreStrikeEntry = async (managerFplId: number, fixtureId: number, homeGoals: number, awayGoals: number, playerName: string) => {
    try {
      const manager = leagueStandings.find(m => m.entry === managerFplId);
      if (!manager) {
        console.error('Manager not found:', managerFplId);
        return;
      }

      const entry = {
        fplleague_id: parseInt(selectedLeagueId),
        manager_email: manager.player_name, // Using player_name as email for now
        manager_fplid: managerFplId,
        manager_f_name: manager.player_name.split(' ')[0] || '',
        manager_l_name: manager.player_name.split(' ').slice(1).join(' ') || '',
        manager_scrname: manager.entry_name,
        fixture_id: fixtureId,
        gameweek: selectedGameweek,
        home_goal: homeGoals,
        away_goal: awayGoals,
        player_name: playerName,
        submitted_timestamp: new Date()
      };

      await dbUtils.saveScoreStrikeEntry(entry);
      
      // Reload entries to show the new one
      const updatedEntries = await dbUtils.getScoreStrikeEntriesByFixture(0, selectedGameweek);
      setScoreStrikeEntries(updatedEntries);
      
      console.log('Score and Strike entry saved successfully');
    } catch (error) {
      console.error('Error saving Score and Strike entry:', error);
    }
  };

  const updateEntryFormData = (managerFplId: number, field: string, value: any) => {
    setEntryFormData(prev => ({
      ...prev,
      [managerFplId]: {
        ...prev[managerFplId],
        [field]: value
      }
    }));
  };

  // Function to get priority fixture for Score & Strike game engine logic
  // This uses the EXACT same logic as the main Score & Strike tab
  // NOTE: Admin tab has NO fixture locking - admins can enter data for any gameweek/fixture
  const getPriorityFixture = (manager: any, gameweek: number) => {
    if (!fixtures.length) {
      console.log(`❌ No fixtures available for gameweek ${gameweek}`);
      return null;
    }
    
    console.log('=== SELECTING GAME BY TEAM PRIORITY (Admin Tab) ===');
    console.log(`Gameweek: ${gameweek}`);
    console.log('Available fixtures:', fixtures.length);
    console.log('Fixtures data:', fixtures.map(f => ({
      id: f.id,
      event: f.event,
      team_h: f.team_h,
      team_a: f.team_a
    })));

    // Priority team IDs as specified in main Score & Strike tab
    const PRIORITY_TEAM_IDS = [1, 7, 12, 13, 14, 18];
    const SECONDARY_TEAM_IDS = [2, 15];
    
    // Priority order for team_h selection
    const TEAM_H_PRIORITY_ORDER = [13, 12, 1, 14, 7, 18];
    const TEAM_A_PRIORITY_ORDER = [15, 2];

    // Convert fixtures to include team IDs
    const fixturesWithIds = fixtures.map(fixture => {
      const homeTeam = teams.find(t => t.id === fixture.team_h);
      const awayTeam = teams.find(t => t.id === fixture.team_a);
      return {
        fixture,
        homeTeamId: fixture.team_h,
        awayTeamId: fixture.team_a,
        homeTeam,
        awayTeam
      };
    });

    console.log('Fixtures with team IDs:', fixturesWithIds.map(f => ({
      id: f.fixture.id,
      homeTeam: f.homeTeam?.name,
      homeTeamId: f.homeTeamId,
      awayTeam: f.awayTeam?.name,
      awayTeamId: f.awayTeamId
    })));

    // Rule 1: Both team_h and team_a in PRIORITY_TEAM_IDS
    const bothPriority = fixturesWithIds.filter(f => 
      f.homeTeamId && f.awayTeamId &&
      PRIORITY_TEAM_IDS.includes(f.homeTeamId) && 
      PRIORITY_TEAM_IDS.includes(f.awayTeamId)
    );

    if (bothPriority.length > 0) {
      console.log('Found fixtures with both teams in priority list:', bothPriority.length);
      // Sort by team_h priority order
      const sorted = bothPriority.sort((a, b) => {
        const aIndex = TEAM_H_PRIORITY_ORDER.indexOf(a.homeTeamId!);
        const bIndex = TEAM_H_PRIORITY_ORDER.indexOf(b.homeTeamId!);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      });
      
      console.log('Selected fixture (both priority):', {
        homeTeam: sorted[0].homeTeam?.name,
        awayTeam: sorted[0].awayTeam?.name,
        fixtureId: sorted[0].fixture.id
      });
      
      return sorted[0];
    }

    // Rule 2: team_h in PRIORITY_TEAM_IDS and team_a in SECONDARY_TEAM_IDS
    const priorityHomeSecondaryAway = fixturesWithIds.filter(f => 
      f.homeTeamId && f.awayTeamId &&
      PRIORITY_TEAM_IDS.includes(f.homeTeamId) && 
      SECONDARY_TEAM_IDS.includes(f.awayTeamId)
    );

    if (priorityHomeSecondaryAway.length > 0) {
      console.log('Found fixtures with priority home vs secondary away:', priorityHomeSecondaryAway.length);
      // Sort by team_h priority order first, then team_a priority order
      const sorted = priorityHomeSecondaryAway.sort((a, b) => {
        const aHomeIndex = TEAM_H_PRIORITY_ORDER.indexOf(a.homeTeamId!);
        const bHomeIndex = TEAM_H_PRIORITY_ORDER.indexOf(b.homeTeamId!);
        if (aHomeIndex !== bHomeIndex) {
          return (aHomeIndex === -1 ? 999 : aHomeIndex) - (bHomeIndex === -1 ? 999 : bHomeIndex);
        }
        const aAwayIndex = TEAM_A_PRIORITY_ORDER.indexOf(a.awayTeamId!);
        const bAwayIndex = TEAM_A_PRIORITY_ORDER.indexOf(b.awayTeamId!);
        return (aAwayIndex === -1 ? 999 : aAwayIndex) - (bAwayIndex === -1 ? 999 : bAwayIndex);
      });
      
      console.log('Selected fixture (priority home + secondary away):', {
        homeTeam: sorted[0].homeTeam?.name,
        awayTeam: sorted[0].awayTeam?.name,
        fixtureId: sorted[0].fixture.id
      });
      
      return sorted[0];
    }

    // Rule 3: team_h in PRIORITY_TEAM_IDS (any away team)
    const priorityHome = fixturesWithIds.filter(f => 
      f.homeTeamId && PRIORITY_TEAM_IDS.includes(f.homeTeamId)
    );

    if (priorityHome.length > 0) {
      console.log('Found fixtures with priority home team:', priorityHome.length);
      // Sort by team_h priority order
      const sorted = priorityHome.sort((a, b) => {
        const aIndex = TEAM_H_PRIORITY_ORDER.indexOf(a.homeTeamId!);
        const bIndex = TEAM_H_PRIORITY_ORDER.indexOf(b.homeTeamId!);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      });
      
      console.log('Selected fixture (priority home):', {
        homeTeam: sorted[0].homeTeam?.name,
        awayTeam: sorted[0].awayTeam?.name,
        fixtureId: sorted[0].fixture.id
      });
      
      return sorted[0];
    }

    // Rule 4: team_a in PRIORITY_TEAM_IDS (any home team)
    const priorityAway = fixturesWithIds.filter(f => 
      f.awayTeamId && PRIORITY_TEAM_IDS.includes(f.awayTeamId)
    );

    if (priorityAway.length > 0) {
      console.log('Found fixtures with priority away team:', priorityAway.length);
      // Sort by team_a priority (using reversed TEAM_H_PRIORITY_ORDER)
      const sorted = priorityAway.sort((a, b) => {
        const aIndex = TEAM_H_PRIORITY_ORDER.indexOf(a.awayTeamId!);
        const bIndex = TEAM_H_PRIORITY_ORDER.indexOf(b.awayTeamId!);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      });
      
      console.log('Selected fixture (priority away):', {
        homeTeam: sorted[0].homeTeam?.name,
        awayTeam: sorted[0].awayTeam?.name,
        fixtureId: sorted[0].fixture.id
      });
      
      return sorted[0];
    }

    // Rule 5: Any team from SECONDARY_TEAM_IDS
    const secondaryTeam = fixturesWithIds.filter(f => 
      (f.homeTeamId && SECONDARY_TEAM_IDS.includes(f.homeTeamId)) ||
      (f.awayTeamId && SECONDARY_TEAM_IDS.includes(f.awayTeamId))
    );

    if (secondaryTeam.length > 0) {
      console.log('Found fixtures with secondary teams:', secondaryTeam.length);
      console.log('Selected fixture (secondary teams):', {
        homeTeam: secondaryTeam[0].homeTeam?.name,
        awayTeam: secondaryTeam[0].awayTeam?.name,
        fixtureId: secondaryTeam[0].fixture.id
      });
      
      return secondaryTeam[0];
    }

    // Fallback: First available fixture
    if (fixturesWithIds.length > 0) {
      console.log('Using fallback: first available fixture');
      console.log('Selected fixture (fallback):', {
        homeTeam: fixturesWithIds[0].homeTeam?.name,
        awayTeam: fixturesWithIds[0].awayTeam?.name,
        fixtureId: fixturesWithIds[0].fixture.id
      });
      
      return fixturesWithIds[0];
    }

    console.log('No fixtures available');
    return null;
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
          
          // If there's a confirmed configuration, show the summary view
          if (existingConfig.isConfirmed) {
            console.log('📋 AdminTab: Configuration confirmed, showing summary view');
          } else {
            // If there's an unconfirmed config, stay on configuration view
            console.log('⚙️ AdminTab: Configuration unconfirmed, showing configuration view');
          }
        } else {
          // No existing config found, start with configuration view
          console.log('🆕 AdminTab: No existing config, starting with configuration view');
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
    
            // Reset page to league configuration
        setCurrentPage('leagueConfiguration');
    
    // Clear any cached calculations or stored data
    fplApi.clearCache();
    console.log('All fields and cache cleared successfully');
  };

  const enterEditMode = () => {
    setIsEditMode(true);
    setEditablePayouts({ ...payoutStructure });
            // Stay on league configuration page
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    setEditablePayouts({ ...payoutStructure });
    // Stay on current page, just exit edit mode
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
      // Stay on league configuration page
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
      // Enter edit mode for league configuration
      setIsConfirmed(false);
      setIsEditMode(true);
      setHasCalculated(false);
      setError(null);
    }
  };

  const handleEditPayoutStructure = () => {
    const proceed = window.confirm(
      '⚠️ Warning: Editing payout structure will allow you to adjust prize amounts.\n\n' +
      'Make sure the total payouts equal the total prize pool.\n\n' +
      'Do you want to proceed with editing the payout structure?'
    );
    
    if (proceed) {
      // Enter edit mode for payout structure
      setIsEditMode(true);
      setEditablePayouts({ ...payoutStructure });
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
        // Stay on league configuration page
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
            // Stay on league configuration page
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
      {/* Subtabs Navigation */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setCurrentPage('leagueConfiguration')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              currentPage === 'leagueConfiguration'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🏆 League Configuration
          </button>
          <button
            onClick={() => setCurrentPage('scoreAndStrike')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              currentPage === 'scoreAndStrike'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🎯 Score & Strike
          </button>
          <button
            onClick={() => setCurrentPage('headsUpSetup')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              currentPage === 'headsUpSetup'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🥊 Heads Up Setup
          </button>
          <button
            onClick={() => setCurrentPage('weeklyUtility')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              currentPage === 'weeklyUtility'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🔄 Weekly Utility
          </button>
        </div>
      </div>

      {/* Compact Error Display with Database Reset Options - FPL-style sizing */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-5 mb-4 sm:mb-5">
          <div className="text-red-600 mb-3 sm:mb-4 text-base sm:text-lg font-medium">{error}</div>
          {(error.includes('Database version conflict') || error.includes('Database connection timed out')) && (
            <div className="mt-3 sm:mt-4">
              <p className="text-sm sm:text-base text-red-700 mb-3 sm:mb-4">
                This is a database issue. Try clearing your browser's IndexedDB:
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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
                  className="px-4 sm:px-5 py-3 sm:py-4 bg-red-600 text-white rounded hover:bg-red-700 text-sm sm:text-base font-semibold touch-target"
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
                  className="px-4 sm:px-5 py-3 sm:py-4 bg-red-800 text-white rounded hover:bg-red-900 text-sm sm:text-base font-semibold touch-target"
                >
                  Delete Database (Nuclear Option)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* League Configuration Tab Content */}
      {currentPage === 'leagueConfiguration' && !isEditMode && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">League Configuration</h2>
                <p className="text-blue-100 text-sm">Current league setup and prize distribution</p>
              </div>
              <button
                onClick={handleEditLeagueConfig}
                className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-md flex items-center gap-2 self-start"
                title="Edit current league configuration"
              >
                <span className="text-lg">✏️</span>
                <span>Edit Configuration</span>
              </button>
            </div>
          </div>
          
          {/* Content Section */}
          <div className="p-6">
            {/* League Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* League Details Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2 text-lg">
                  <span className="text-xl">🏆</span>
                  League Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Name:</span>
                    <span className="font-bold text-blue-900 text-right max-w-[60%] break-words">
                  {currentLeagueInfo?.leagueName || 'Ordinary Gentlemen'}
                </span>
              </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Participants:</span>
                    <span className="font-bold text-blue-900 text-xl">{totalManagers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Entry Fee:</span>
                    <span className="font-bold text-green-700 text-lg">
                      {formatCurrency(parseFloat(managerEntryFee || '0'))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Pool Card */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
                <h3 className="font-semibold text-green-800 mb-4 flex items-center gap-2 text-lg">
                  <span className="text-xl">💰</span>
                  Total Prize Pool
                </h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-800 mb-2">
                  {formatCurrency(parseFloat(managerEntryFee || '0') * parseInt(totalManagers || '0'))}
                  </div>
                  <div className="text-sm text-gray-600">
                    {totalManagers} × {formatCurrency(parseFloat(managerEntryFee || '0'))}
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div className={`bg-gradient-to-br p-5 rounded-xl border ${
                isConfirmed 
                  ? 'from-green-50 to-green-100 border-green-200' 
                  : 'from-yellow-50 to-yellow-100 border-yellow-200'
              }`}>
                <h3 className={`font-semibold mb-4 flex items-center gap-2 text-lg ${
                  isConfirmed ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  <span className="text-xl">{isConfirmed ? '✅' : '⚠️'}</span>
                  Configuration Status
                </h3>
                <div className="text-center">
                  <div className={`text-xl font-bold mb-2 ${
                    isConfirmed ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {isConfirmed ? 'Confirmed' : 'Pending'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {isConfirmed ? 'Ready for season' : 'Needs confirmation'}
                  </div>
                </div>
              </div>
            </div>

            {/* Prize Distribution Section */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Prize Distribution Breakdown
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Season Winners */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className="text-yellow-600 text-3xl mb-3">🏆</div>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Season Winners</div>
                  <div className="text-xl font-bold text-yellow-700 mb-2">
                  {formatCurrency(payoutStructure.top20Winners.reduce((sum, payout) => sum + payout, 0))}
                  </div>
                  <div className="text-xs text-gray-500">
                    Top {Math.floor(parseInt(totalManagers || '0') * 0.20)} positions
                  </div>
              </div>

              {/* Score & Strike */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className="text-red-600 text-3xl mb-3">🎯</div>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Score & Strike</div>
                  <div className="text-xl font-bold text-red-700 mb-2">
                  {formatCurrency(payoutStructure.scoreNStrike * parseInt(scoreStrikeWeeks || '0'))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(payoutStructure.scoreNStrike)} × {scoreStrikeWeeks} weeks
                  </div>
              </div>

                {/* Weekly Winners */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className="text-indigo-600 text-3xl mb-3">⚡</div>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Weekly Winners</div>
                  <div className="text-xl font-bold text-indigo-700 mb-2">
                  {formatCurrency(payoutStructure.weeklyWinner * parseInt(weeklyWinnerWeeks || '0'))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(payoutStructure.weeklyWinner)} × {weeklyWinnerWeeks} weeks
                  </div>
              </div>

                {/* Chip Usage */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className="text-pink-600 text-3xl mb-3">🎮</div>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Chip Bonuses</div>
                  <div className="text-xl font-bold text-pink-700 mb-2">
                  {formatCurrency(Object.values(payoutStructure.chipUsage).reduce((sum, amount) => sum + amount, 0))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {Object.keys(payoutStructure.chipUsage).length} chip types
                  </div>
                </div>
              </div>

              {/* Summary Balance Check */}
              {payoutStructure.top20Winners.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-300">
                  <div className="flex justify-between items-center text-center">
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 font-medium">Total Pool</div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(parseFloat(managerEntryFee || '0') * parseInt(totalManagers || '0'))}
                      </div>
                    </div>
                    <div className="text-3xl text-gray-400 mx-4">=</div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 font-medium">Total Payouts</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(
                          payoutStructure.top20Winners.reduce((sum, payout) => sum + payout, 0) +
                          (payoutStructure.scoreNStrike * parseInt(scoreStrikeWeeks || '0')) +
                          (payoutStructure.weeklyWinner * parseInt(weeklyWinnerWeeks || '0')) +
                          Object.values(payoutStructure.chipUsage).reduce((sum, amount) => sum + amount, 0)
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-3">
                                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <span>✓</span>
                        Prize distribution balanced
                </span>
              </div>
            </div>
                )}
          </div>
        </div>

          {/* Payout Structure Display */}
          {payoutStructure.top20Winners.length > 0 && (
            <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  Detailed Payout Structure
                </h3>
                {!isEditMode && (
                  <button
                    onClick={handleEditPayoutStructure}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium"
                    title="Edit payout structure"
                  >
                    ✏️ Edit Payouts
                  </button>
                )}
              </div>
              
              {/* Top 20% Winners */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-800 mb-3">Top 20% Winners</h4>
                <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {payoutStructure.top20Winners.map((payout, index) => (
                    <div key={index} className="text-center">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {index + 1}{getOrdinalSuffix(index + 1)}
                      </label>
                      <div className="px-2 py-2 bg-white border border-gray-200 rounded text-center text-sm font-medium text-gray-900">
                        {formatCurrency(payout || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Side Contest Prizes */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-800 mb-3">Side Contest Prizes</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💥 Score & Strike (Per Week)
                    </label>
                    <div className="px-3 py-2 bg-white border border-gray-200 rounded text-base font-medium text-gray-900">
                      {formatCurrency(payoutStructure.scoreNStrike || 0)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ⚡ Weekly Winner (Per Week)
                    </label>
                    <div className="px-3 py-2 bg-white border border-gray-200 rounded text-base font-medium text-gray-900">
                      {formatCurrency(payoutStructure.weeklyWinner || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chip Usage Prizes */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-800 mb-3">🎯 Chip Usage Prizes</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(payoutStructure.chipUsage).map(([chipName, amount]) => (
                    <div key={chipName}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {chipName}
                      </label>
                      <div className="px-3 py-2 bg-white border border-gray-200 rounded text-base font-medium text-gray-900">
                        {formatCurrency(amount || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}




        </div>
      )}

      {/* Score and Strike Management */}
      {currentPage === 'scoreAndStrike' && (
        <div className="bg-white rounded-lg p-4 sm:p-5 lg:p-6 border">
          <div className="mb-4 sm:mb-5">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">🎯 Score & Strike Management</h3>
          </div>
          


          {/* Gameweek Selection */}
          <div className="mb-6">
            <label className="block text-base font-medium text-gray-700 mb-3">
              Select Gameweek
            </label>
            <select
              value={selectedGameweek}
              onChange={(e) => handleGameweekChange(parseInt(e.target.value))}
              className="w-full md:w-64 px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            >
              {gameweeks.map((gw) => (
                <option key={gw.id} value={gw.id}>
                  GW {gw.id} - {gw.name}
                </option>
              ))}
            </select>

          </div>

          {/* Loading State */}
          {loadingScoreStrike && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading Score and Strike data...</p>
            </div>
          )}



          {/* Score and Strike Entries Table */}
          {!loadingScoreStrike && leagueStandings.length > 0 && (
            <div className="space-y-4">
              {/* Entries Table */}
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Manager Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Fixture</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">Home Goals</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">Away Goals</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Goalscorer</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leagueStandings.map((manager) => {
                      const existingEntry = scoreStrikeEntries.find(
                        entry => entry.manager_fplid === manager.entry && entry.gameweek === selectedGameweek
                      );
                      
                      return (
                        <tr key={manager.entry} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium text-gray-900">{manager.player_name}</div>
                              <div className="text-sm text-gray-500">{manager.entry_name}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              const priorityFixture = getPriorityFixture(manager, selectedGameweek);
                              if (priorityFixture) {
                                // Auto-set the fixture ID in form data
                                if (!entryFormData[manager.entry]?.fixtureId && !existingEntry?.fixture_id) {
                                  setTimeout(() => updateEntryFormData(manager.entry, 'fixtureId', priorityFixture.fixture.id), 0);
                                }
                                
                                return (
                                  <div className="text-sm">
                                    <div className="font-medium text-gray-900">
                                      {priorityFixture.homeTeam?.name || `Team ${priorityFixture.fixture.team_h}`} vs {priorityFixture.awayTeam?.name || `Team ${priorityFixture.fixture.team_a}`}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Game Engine Selection
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <div className="text-sm text-gray-500">
                                  No fixtures available
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              className="w-20 px-3 py-2 border border-gray-300 rounded text-center text-sm"
                              value={entryFormData[manager.entry]?.homeGoals || existingEntry?.home_goal || 0}
                              onChange={(e) => updateEntryFormData(manager.entry, 'homeGoals', parseInt(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              className="w-20 px-3 py-2 border border-gray-300 rounded text-center text-sm"
                              value={entryFormData[manager.entry]?.awayGoals || existingEntry?.away_goal || 0}
                              onChange={(e) => updateEntryFormData(manager.entry, 'awayGoals', parseInt(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              value={entryFormData[manager.entry]?.playerName || existingEntry?.player_name || ''}
                              onChange={(e) => updateEntryFormData(manager.entry, 'playerName', e.target.value)}
                            >
                              <option value="">Select Player</option>
                              {players
                                .filter(player => {
                                  // Filter players by teams in the priority fixture
                                  const priorityFixture = getPriorityFixture(manager, selectedGameweek);
                                  if (!priorityFixture) return false;
                                  return player.team === priorityFixture.fixture.team_h || player.team === priorityFixture.fixture.team_a;
                                })
                                .map((player) => (
                                  <option key={player.id} value={player.web_name}>
                                    {player.web_name} ({teams.find(t => t.id === player.team)?.name || `Team ${player.team}`})
                                  </option>
                                ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                const priorityFixture = getPriorityFixture(manager, selectedGameweek);
                                if (!priorityFixture) {
                                  alert('No priority fixture available for this gameweek');
                                  return;
                                }
                                
                                const formData = entryFormData[manager.entry];
                                if (formData) {
                                  const { homeGoals, awayGoals, playerName } = formData;
                                  
                                  if (homeGoals > 0 || awayGoals > 0) {
                                    saveScoreStrikeEntry(manager.entry, priorityFixture.fixture.id, homeGoals, awayGoals, playerName);
                                  } else {
                                    alert('Please enter valid scores (at least one goal)');
                                  }
                                } else {
                                  alert('Please fill in all fields before saving');
                                }
                              }}
                              className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                            >
                              💾 Save
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No Data State */}
          {!loadingScoreStrike && leagueStandings.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500 text-xl mb-4">📊</div>
              <p className="text-lg font-semibold text-gray-600">No league standings found</p>
              <p className="text-sm text-gray-500 mt-2">Please ensure the league is properly configured</p>
            </div>
          )}
        </div>
      )}

      {/* Heads Up Setup Tab Content */}
      {currentPage === 'headsUpSetup' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Heads Up Setup</h2>
                <p className="text-red-100 text-sm">Configure weekly heads-up games between league managers</p>
              </div>
            </div>
          </div>
          
          {/* Content Section */}
          <div className="p-6">
            {!headsUpConfigConfirmed ? (
              /* Configuration Form */
              <div className="space-y-6">
                {/* Entry Amount */}
                <div className="max-w-md">
                  <label className="block text-base font-medium text-gray-700 mb-3">
                    💰 Entry Amount (per manager)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={headsUpEntryAmount}
                      onChange={(e) => setHeadsUpEntryAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-base"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Enter the amount each manager pays to participate</p>
                </div>

                {/* Manager Selection */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-3">
                    👥 Select Managers
                  </label>
                  <p className="text-sm text-gray-600 mb-4">Choose at least 2 managers for heads-up games</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {leagueStandings.map((manager) => (
                      <div key={manager.entry} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`manager-${manager.entry}`}
                          checked={selectedHeadsUpManagers.includes(manager.entry)}
                          onChange={() => handleManagerSelection(manager.entry)}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`manager-${manager.entry}`} className="ml-3 text-sm font-medium text-gray-700">
                          {manager.player_name}
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  {selectedHeadsUpManagers.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Selected:</span> {selectedHeadsUpManagers.length} manager(s)
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={confirmHeadsUpConfig}
                    disabled={!headsUpEntryAmount || parseFloat(headsUpEntryAmount) <= 0 || selectedHeadsUpManagers.length < 2}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
                  >
                    ✅ Confirm Configuration
                  </button>
                  
                  <button
                    onClick={resetHeadsUpConfig}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>
            ) : (
              /* Configuration Summary */
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Heads Up Configuration Confirmed!</h3>
                  <p className="text-gray-600">Weekly heads-up games are now active</p>
                </div>

                {/* Configuration Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">💰</span>
                      Entry Amount
                    </h4>
                    <div className="text-3xl font-bold text-green-600">
                      {formatCurrency(headsUpConfig?.entryAmount || 0)}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Per manager per week</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">👥</span>
                      Participating Managers
                    </h4>
                    <div className="text-3xl font-bold text-blue-600">
                      {headsUpConfig?.managers.length || 0}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Active participants</p>
                  </div>
                </div>

                {/* Manager List */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Selected Managers</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {headsUpConfig?.managers.map((managerId) => {
                      const manager = leagueStandings.find(m => m.entry === managerId);
                      return (
                        <div key={managerId} className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                          <span className="font-medium text-gray-800">
                            {manager?.player_name || `Manager ${managerId}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center">
                  <button
                    onClick={resetHeadsUpConfig}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-md"
                  >
                    🔄 Reset Configuration
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weekly Utility Tab Content */}
      {currentPage === 'weeklyUtility' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Weekly Utility</h2>
                <p className="text-green-100 text-sm">Import and manage weekly data from FPL API</p>
              </div>
            </div>
          </div>
          
          {/* Content Section */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Import Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🔄</span>
                  Import Weekly Data from FPL API
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">What this does:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Fetches current gameweek from FPL API bootstrap endpoint</li>
                      <li>• Imports league standings for the current gameweek</li>
                      <li>• Stores data in weeklyWinners table with all required columns</li>
                      <li>• Ensures unique entries per gameweek + manager combination</li>
                      <li>• Automatically overwrites existing data for the same gameweek</li>
                      <li>• Marks new entries as current gameweek</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">⚠️ Important Notes:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• This will automatically overwrite existing data for the current gameweek</li>
                      <li>• Only run this after FPL gameweek results are final</li>
                      <li>• Each manager can have only one entry per gameweek</li>
                      <li>• Previous gameweek data is preserved and marked as not current</li>
                      <li>• League ID: {selectedLeagueId}</li>
                      <li>• Data source: FPL API league standings endpoint</li>
                    </ul>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={importWeeklyDataFromFPL}
                      disabled={importingWeeklyData}
                      className={`px-8 py-4 text-lg font-semibold rounded-lg transition-colors shadow-lg ${
                        importingWeeklyData
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {importingWeeklyData ? (
                        <div className="flex items-center gap-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          <span>Importing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🚀</span>
                          <span>Import Weekly Data</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Import Results */}
              {importResult && (
                <div className={`rounded-lg p-6 border-2 ${
                  importResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`text-2xl ${
                      importResult.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {importResult.success ? '✅' : '❌'}
                    </div>
                    <h3 className={`text-lg font-semibold ${
                      importResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {importResult.success ? 'Import Successful' : 'Import Failed'}
                    </h3>
                  </div>
                  
                  <p className={`text-base ${
                    importResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {importResult.message}
                  </p>
                  
                  {importResult.success && importResult.importedCount && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {importResult.importedCount}
                          </div>
                          <div className="text-sm text-green-700">Entries Imported</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            GW {importResult.gameweek}
                          </div>
                          <div className="text-sm text-blue-700">Gameweek</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Current Weekly Winners Data */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Current Weekly Winners Data
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          GameWeek
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Manager Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          FPL ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Is Current
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {weeklyWinners.length > 0 ? (
                        weeklyWinners
                          .sort((a, b) => b.gameweek - a.gameweek || b.managerScore - a.managerScore)
                          .slice(0, 20) // Show top 20 entries
                          .map((winner) => (
                            <tr key={winner.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                GW {winner.gameweek}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {winner.managerName}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {winner.managerFplId}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                <span className="font-medium">{winner.managerScore}</span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  winner.isCurrent 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {winner.isCurrent ? 'Yes' : 'No'}
                                </span>
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            <div className="text-xl mb-2">📊</div>
                            <p>No weekly winners data found</p>
                            <p className="text-sm mt-1">Use the import button above to fetch data from FPL API</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {weeklyWinners.length > 20 && (
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Showing top 20 entries. Total entries: {weeklyWinners.length}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Form - Only show when editing */}
      {currentPage === 'leagueConfiguration' && isEditMode && (
        <div className="bg-white rounded-lg p-4 sm:p-5 lg:p-6 border">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4 sm:mb-5">League Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-5 sm:mb-6">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-3">
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
                disabled={!isEditMode || isConfirmed}
                className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-base"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-base font-medium text-gray-700 mb-3">
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
              disabled={!isEditMode || isConfirmed}
              className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-base"
              placeholder="0"
            />
          </div>
          
          <div>
            <label className="block text-base font-medium text-gray-700 mb-3">
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
              disabled={!isEditMode || isConfirmed}
              className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-base"
              placeholder="38"
            />
          </div>
          
          <div>
            <label className="block text-base font-medium text-gray-700 mb-3">
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
              disabled={!isEditMode || isConfirmed}
              className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-base"
              placeholder="38"
            />
          </div>
          
          <div>
            <label className="block text-base font-medium text-gray-700 mb-3">
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
              disabled={!isEditMode || isConfirmed}
              className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-base"
              placeholder="3"
            />
          </div>
        </div>

        {/* Chip Names */}
        <div className="mb-6">
          <label className="block text-base font-medium text-gray-700 mb-3">
            Chip Names
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chipNames.map((name, index) => (
              <div key={index}>
                <select
                  value={name}
                  onChange={(e) => updateChipName(index, e.target.value)}
                  disabled={!isEditMode || isConfirmed}
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 bg-white text-gray-900 text-base [appearance:none] bg-[length:16px_12px] bg-[right_16px_center] bg-no-repeat pr-12"
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
                      className="py-3 px-4 hover:bg-blue-50 text-base"
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
        <div className="flex flex-wrap gap-4">
          <button
            onClick={hasCalculated ? recalculatePayoutStructure : calculatePayoutStructure}
            disabled={(!isFormValid() && !configChanged) || !isEditMode || isConfirmed}
            className={`px-5 py-3 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed text-base font-medium ${
              hasCalculated 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {hasCalculated ? 'Recalculate' : 'Calculate'}
          </button>
          
          <button
            onClick={clearAll}
            disabled={!isEditMode || isConfirmed}
            className="px-5 py-3 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-base font-medium"
          >
            Clear
          </button>
          
          {payoutStructure.top20Winners.length > 0 && (
            <button
              onClick={enterEditMode}
              disabled={isConfirmed || !isEditMode}
              className="px-5 py-3 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-base font-medium"
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
              className="px-5 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-base font-medium"
            >
              ✓ Confirm
            </button>
          )}

          {/* Cancel Button - Only show when adding a new league */}
          {currentPage === 'leagueConfiguration' && newLeagueId && (
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
                  setCurrentPage('leagueConfiguration');
                  setNewLeagueId('');
                  setNewLeagueName('');
                  setLeagueVerificationError(null);
                  setVerifyingLeague(false);
                }
              }}
              className="px-5 py-3 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-base font-medium"
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-5">
          <div className="text-red-800 mb-4 text-base">{error}</div>
          {error.includes('VersionError') && (
            <div className="mt-4">
              <p className="text-base text-red-700 mb-3">
                This is a database version conflict. Try clearing your browser's IndexedDB:
              </p>
              <div className="flex gap-3">
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
                  className="px-4 py-2 bg-red-600 text-white rounded text-base hover:bg-red-700"
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
                  className="px-4 py-2 bg-red-800 text-white rounded text-base hover:bg-red-900"
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
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 mb-5">
              <div className="text-yellow-800 text-base">
                <strong>⚠️ Payout Mismatch:</strong> Calculated Payout Amounts ({formatCurrency(calculatedPayouts)}) ≠ Total Prize Pool ({formatCurrency(totalPrizePool)})
                <br />
                <span className="text-base font-medium">{differenceText}</span>
                <br />
                <span className="text-base">Click "Edit" to adjust winnings and balance the totals.</span>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Payout Structure Display */}
      {currentPage === 'leagueConfiguration' && payoutStructure.top20Winners.length > 0 && (
        <div className="bg-white rounded-lg p-5 border shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Payout Structure</h3>
            {isConfirmed && !isEditMode && (
              <button
                onClick={handleEditAfterConfirm}
                className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                title="Edit payout structure"
              >
                ✏️
              </button>
            )}
          </div>
          
          {/* Top 20% Winners */}
          <div className="mb-5">
            <h4 className="text-lg font-medium text-gray-800 mb-3">Top 20% Winners</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {(isEditMode ? editablePayouts : payoutStructure).top20Winners.map((payout, index) => (
                <div key={index} className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-2 py-2 border border-gray-300 rounded text-center text-sm disabled:bg-gray-100"
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
          <div className="mb-5">
            <h4 className="text-lg font-medium text-gray-800 mb-3">Side Contest Prizes</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded text-base disabled:bg-gray-100"
                  title={isEditMode ? (() => {
                    const suggestion = getSuggestionForField('scoreNStrike', editablePayouts.scoreNStrike);
                    return suggestion ? `💡 Add ${formatCurrency(suggestion)} to balance totals` : '';
                  })() : ''}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded text-base disabled:bg-gray-100"
                  title={isEditMode ? (() => {
                    const suggestion = getSuggestionForField('weeklyWinner', editablePayouts.weeklyWinner);
                    return suggestion ? `💡 Add ${formatCurrency(suggestion)} to balance totals` : '';
                  })() : ''}
                />
              </div>
            </div>
          </div>

          {/* Chip Usage Prizes */}
          <div className="mb-5">
            <h4 className="text-lg font-medium text-gray-800 mb-3">🎯 Chip Usage Prizes</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(isEditMode ? editablePayouts.chipUsage : payoutStructure.chipUsage).map(([chipName, amount]) => (
                <div key={chipName}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-100"
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
          <div className="mt-5 pt-4 border-t border-gray-200">
            <h4 className="text-lg font-medium text-gray-800 mb-3">Payout Breakdown</h4>
            
            {/* Compact Totals Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <span className="text-sm text-gray-600">Season Winners:</span>
                <div className="text-base font-semibold text-blue-600">
                  {formatCurrency((isEditMode ? editablePayouts : payoutStructure).top20Winners.reduce((sum, payout) => sum + payout, 0))}
                </div>
              </div>
              
              <div className="text-center">
                <span className="text-sm text-gray-600">Score & Strike:</span>
                <div className="text-base font-semibold text-purple-600">
                  {formatCurrency((isEditMode ? editablePayouts : payoutStructure).scoreNStrike * parseInt(scoreStrikeWeeks || '0'))}
                </div>
              </div>
              
              <div className="text-center">
                <span className="text-sm text-gray-600">Weekly Winner:</span>
                <div className="text-base font-semibold text-orange-600">
                  {formatCurrency((isEditMode ? editablePayouts : payoutStructure).weeklyWinner * parseInt(weeklyWinnerWeeks || '0'))}
                </div>
              </div>
              
              <div className="text-center">
                <span className="text-sm text-gray-600">Chip Usage:</span>
                <div className="text-base font-semibold text-green-600">
                  {formatCurrency(Object.values((isEditMode ? editablePayouts : payoutStructure).chipUsage).reduce((sum, amount) => sum + amount, 0))}
                </div>
              </div>
            </div>

            {/* Total Prize Pool vs Calculated Payouts */}
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-5">
                <div className="text-center">
                  <span className="text-base font-semibold text-gray-800">Total Prize Pool:</span>
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(parseFloat(managerEntryFee || '0') * parseInt(totalManagers || '0'))}
                  </div>
                </div>
                
                <div className="text-center">
                  <span className="text-base font-semibold text-gray-800">Calculated Payouts:</span>
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(getTotalPayouts())}
                  </div>
                </div>
              </div>
              
              {isEditMode && (
                <div className="mt-3 text-sm text-center">
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
          <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-base font-medium text-blue-800 mb-3">Score & Strike Rollover Rules</h4>
            <div className="text-sm text-blue-700 space-y-2">
              <div>• Weekly prize pool: {formatCurrency((isEditMode ? editablePayouts : payoutStructure).scoreNStrike)} per week</div>
              <div>• Predict score + goalscorer correctly to win</div>
              <div>• Multiple winners: share pot equally</div>
              <div>• No winner: pot rolls over to next gameweek</div>
              <div>• GW38: if no winner, pot goes to manager with most wins</div>
            </div>
          </div>

          {/* Confirmed Configuration Display */}
          {isConfirmed && !isEditMode && (
            <div className="mt-5 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-medium text-green-800 mb-2">✅ Configuration Confirmed</h4>
                  <div className="text-sm text-green-700 space-y-2">
                    <div>• League configuration and payout structure saved</div>
                    <div>• All calculations locked and ready for distribution</div>
                    <div>• Click pencil icon above to make changes</div>
                  </div>
                </div>
                <button
                  onClick={handleEditAfterConfirm}
                  className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
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
          {currentPage === 'leagueConfiguration' && newLeagueId && (
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
                    setCurrentPage('leagueConfiguration');
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