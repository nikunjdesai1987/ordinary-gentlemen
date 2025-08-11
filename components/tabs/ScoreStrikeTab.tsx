'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dbUtils, Prediction, ScoreStrikeEntry } from '@/lib/database';
import { fplApi, FPLFixture, FPLGameweek } from '@/lib/fpl-api';

interface Fixture {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamId?: number | null;
  awayTeamId?: number | null;
  kickoffTime: Date;
  gameweek: number;
  isFinished: boolean;
  homeScore?: number;
  awayScore?: number;
  goalscorers?: string[];
}

interface UserPrediction {
  id?: number;
  fixtureId: number;
  homeGoals: number;
  awayGoals: number;
  goalscorer: string;
  submittedAt: Date;
  isCorrect?: boolean;
  points?: number;
}

interface Player {
  id: number;
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  element_type: number;
  now_cost: number;
  total_points: number;
  form: string;
  points_per_game: string;
  selected_by_percent: string;
}

interface Team {
  id: number;
  name: string;
  short_name: string;
}

interface ElementType {
  id: number;
  singular_name_short: string;
}

// Game selection strategies
type GameSelectionStrategy = 'first_available' | 'random' | 'highest_priority' | 'manual';

export default function ScoreStrikeTab() {
  const { user, managerFplId } = useAuth();
  const [currentGameweek, setCurrentGameweek] = useState<FPLGameweek | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [userPredictions, setUserPredictions] = useState<UserPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [homeGoals, setHomeGoals] = useState('');
  const [awayGoals, setAwayGoals] = useState('');
  const [goalscorer, setGoalscorer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedEntry, setSubmittedEntry] = useState<any>(null);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [fixtureLocked, setFixtureLocked] = useState(false);
  const [currentPot, setCurrentPot] = useState<number>(0);
  const [potLoading, setPotLoading] = useState(false);

  // Player data state
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [elementTypes, setElementTypes] = useState<ElementType[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);

  // Game selection state - now using team priority logic
  const [selectionStrategy, setSelectionStrategy] = useState<GameSelectionStrategy>('highest_priority');

  // Priority teams for game selection (configurable)
  const PRIORITY_TEAMS = [
    'Manchester City',
    'Liverpool',
    'Arsenal',
    'Manchester United',
    'Chelsea',
    'Tottenham Hotspur',
    'Newcastle United',
    'Aston Villa'
  ];

  // New game selection logic based on specific team ID requirements
  const selectGameByTeamPriority = (fixtures: Fixture[]): Fixture | null => {
    if (!fixtures || fixtures.length === 0) return null;

    console.log('=== SELECTING GAME BY TEAM PRIORITY ===');
    console.log('Available fixtures:', fixtures.length);

    // Priority team IDs as specified
    const PRIORITY_TEAM_IDS = [1, 7, 12, 13, 14, 18];
    const SECONDARY_TEAM_IDS = [2, 15];
    
    // Priority order for team_h selection
    const TEAM_H_PRIORITY_ORDER = [13, 12, 1, 14, 7, 18];
    const TEAM_A_PRIORITY_ORDER = [15, 2];

    // Helper function to get team ID from team name
    const getTeamId = (teamName: string, teams: any[]): number | null => {
      const team = teams.find(t => t.name === teamName);
      return team ? team.id : null;
    };

    // Helper function to get priority index
    const getPriorityIndex = (teamId: number, priorityOrder: number[]): number => {
      const index = priorityOrder.indexOf(teamId);
      return index === -1 ? 999 : index;
    };

    // Get teams data for ID mapping
    const getTeamsData = async () => {
      try {
        return await fplApi.getTeams();
      } catch (error) {
        console.error('Error fetching teams for ID mapping:', error);
        return [];
      }
    };

    // Main selection logic
    const performSelection = async () => {
      const teams = await getTeamsData();
      
      // Convert fixtures to include team IDs
      const fixturesWithIds = fixtures.map(fixture => {
        const homeTeamId = getTeamId(fixture.homeTeam, teams);
        const awayTeamId = getTeamId(fixture.awayTeam, teams);
        return {
          ...fixture,
          homeTeamId,
          awayTeamId
        };
      });

      console.log('Fixtures with team IDs:', fixturesWithIds.map(f => ({
        id: f.id,
        homeTeam: f.homeTeam,
        homeTeamId: f.homeTeamId,
        awayTeam: f.awayTeam,
        awayTeamId: f.awayTeamId
      })));

      // Rule 1: Both team_h and team_a in PRIORITY_TEAM_IDS
      const bothPriority = fixturesWithIds.filter(f => 
        f.homeTeamId && f.awayTeamId &&
        PRIORITY_TEAM_IDS.includes(f.homeTeamId) && 
        PRIORITY_TEAM_IDS.includes(f.awayTeamId)
      );

      if (bothPriority.length > 0) {
        console.log('Rule 1: Found fixtures with both teams in priority list:', bothPriority.length);
        
        // Sort by team_h priority order
        bothPriority.sort((a, b) => {
          const aIndex = getPriorityIndex(a.homeTeamId!, TEAM_H_PRIORITY_ORDER);
          const bIndex = getPriorityIndex(b.homeTeamId!, TEAM_H_PRIORITY_ORDER);
          return aIndex - bIndex;
        });

        const selected = bothPriority[0];
        console.log('Selected by Rule 1:', {
          fixtureId: selected.id,
          homeTeam: selected.homeTeam,
          homeTeamId: selected.homeTeamId,
          awayTeam: selected.awayTeam,
          awayTeamId: selected.awayTeamId
        });
        return selected;
      }

      // Rule 2: team_h in PRIORITY_TEAM_IDS and team_a in SECONDARY_TEAM_IDS
      const homePriorityAwaySecondary = fixturesWithIds.filter(f => 
        f.homeTeamId && f.awayTeamId &&
        PRIORITY_TEAM_IDS.includes(f.homeTeamId) && 
        SECONDARY_TEAM_IDS.includes(f.awayTeamId)
      );

      if (homePriorityAwaySecondary.length > 0) {
        console.log('Rule 2: Found fixtures with priority home team and secondary away team:', homePriorityAwaySecondary.length);
        
        // Sort by team_h priority order
        homePriorityAwaySecondary.sort((a, b) => {
          const aIndex = getPriorityIndex(a.homeTeamId!, TEAM_H_PRIORITY_ORDER);
          const bIndex = getPriorityIndex(b.homeTeamId!, TEAM_H_PRIORITY_ORDER);
          return aIndex - bIndex;
        });

        const selected = homePriorityAwaySecondary[0];
        console.log('Selected by Rule 2:', {
          fixtureId: selected.id,
          homeTeam: selected.homeTeam,
          homeTeamId: selected.homeTeamId,
          awayTeam: selected.awayTeam,
          awayTeamId: selected.awayTeamId
        });
        return selected;
      }

      // Rule 3: team_a in PRIORITY_TEAM_IDS and team_h in SECONDARY_TEAM_IDS
      const awayPriorityHomeSecondary = fixturesWithIds.filter(f => 
        f.homeTeamId && f.awayTeamId &&
        PRIORITY_TEAM_IDS.includes(f.awayTeamId) && 
        SECONDARY_TEAM_IDS.includes(f.homeTeamId)
      );

      if (awayPriorityHomeSecondary.length > 0) {
        console.log('Rule 3: Found fixtures with priority away team and secondary home team:', awayPriorityHomeSecondary.length);
        
        // Sort by team_a priority order
        awayPriorityHomeSecondary.sort((a, b) => {
          const aIndex = getPriorityIndex(a.awayTeamId!, TEAM_A_PRIORITY_ORDER);
          const bIndex = getPriorityIndex(b.awayTeamId!, TEAM_A_PRIORITY_ORDER);
          return aIndex - bIndex;
        });

        const selected = awayPriorityHomeSecondary[0];
        console.log('Selected by Rule 3:', {
          fixtureId: selected.id,
          homeTeam: selected.homeTeam,
          homeTeamId: selected.homeTeamId,
          awayTeam: selected.awayTeam,
          awayTeamId: selected.awayTeamId
        });
        return selected;
      }

      // Fallback: No matches found
      console.log('No fixtures match the priority criteria, returning first available');
      return fixtures[0];
    };

    // Execute the selection logic
    performSelection().then(selected => {
      if (selected) {
        setSelectedFixture(selected);
        console.log('✅ Game selected and set:', selected);
      }
    }).catch(error => {
      console.error('❌ Error in game selection:', error);
    });

    return null; // Return null initially, selection happens asynchronously
  };

  // Test function to pull specific fixture from Gameweek 1
  const testGameweek1Fixture = async () => {
    try {
      console.log('=== TESTING: Pulling specific fixture from Gameweek 1 ===');
      
      // Get all fixtures from the dedicated fixtures API
      const allFixtures = await fplApi.getFixtures();
      console.log('Total fixtures from fixtures API:', allFixtures.length);
      
      // Filter for Gameweek 1 (event = 1)
      const gameweek1Fixtures = allFixtures.filter((fixture: FPLFixture) => fixture.event === 1);
      console.log('Gameweek 1 fixtures found:', gameweek1Fixtures.length);
      
      // Get teams for mapping
      const teams = await fplApi.getTeams();
      console.log('Teams loaded from bootstrap API:', teams.length);
      
      // Display all Gameweek 1 fixtures with details
      console.log('=== ALL GAMEWEEK 1 FIXTURES FROM FIXTURES API ===');
      gameweek1Fixtures.forEach((fixture: FPLFixture, index: number) => {
        const homeTeam = teams.find((team: any) => team.id === fixture.team_h);
        const awayTeam = teams.find((team: any) => team.id === fixture.team_a);
        
        console.log(`Fixture ${index + 1}:`, {
          id: fixture.id,
          event: fixture.event,
          homeTeamId: fixture.team_h,
          homeTeamName: homeTeam?.name || 'Unknown',
          homeTeamShort: homeTeam?.short_name || 'Unknown',
          awayTeamId: fixture.team_a,
          awayTeamName: awayTeam?.name || 'Unknown',
          awayTeamShort: awayTeam?.short_name || 'Unknown',
          kickoffTime: fixture.kickoff_time,
          finished: fixture.finished,
          started: fixture.started,
          minutes: fixture.minutes,
          homeScore: fixture.team_h_score,
          awayScore: fixture.team_a_score
        });
      });
      
      // Select a specific fixture (let's pick the first one)
      const selectedFixture = gameweek1Fixtures[0];
      if (selectedFixture) {
        const homeTeam = teams.find((team: any) => team.id === selectedFixture.team_h);
        const awayTeam = teams.find((team: any) => team.id === selectedFixture.team_a);
        
        console.log('=== SELECTED TEST FIXTURE ===');
        console.log('Fixture Details:', {
          id: selectedFixture.id,
          event: selectedFixture.event,
          pulse_id: selectedFixture.pulse_id
        });
        console.log('Home Team:', {
          id: selectedFixture.team_h,
          name: homeTeam?.name || 'Unknown',
          shortName: homeTeam?.short_name || 'Unknown'
        });
        console.log('Away Team:', {
          id: selectedFixture.team_a,
          name: awayTeam?.name || 'Unknown',
          shortName: awayTeam?.short_name || 'Unknown'
        });
        console.log('Match Details:', {
          kickoffTime: selectedFixture.kickoff_time,
          finished: selectedFixture.finished,
          started: selectedFixture.started,
          minutes: selectedFixture.minutes,
          homeScore: selectedFixture.team_h_score,
          awayScore: selectedFixture.team_a_score
        });
        
        // Create a mapped fixture object for testing
        const mappedFixture = {
          id: selectedFixture.id,
          homeTeam: homeTeam?.name || 'Unknown',
          awayTeam: awayTeam?.name || 'Unknown',
          homeTeamId: selectedFixture.team_h,
          awayTeamId: selectedFixture.team_a,
          kickoffTime: new Date(selectedFixture.kickoff_time),
          gameweek: selectedFixture.event,
          isFinished: selectedFixture.finished,
          homeScore: selectedFixture.team_h_score,
          awayScore: selectedFixture.team_a_score,
        };
        
        console.log('=== MAPPED FIXTURE OBJECT FOR UI ===');
        console.log(mappedFixture);
        
        // Set this as the selected fixture for testing
        setSelectedFixture(mappedFixture);
        console.log('✅ Test fixture set as selected fixture');
        
        return mappedFixture;
      } else {
        console.log('❌ No fixtures found for Gameweek 1');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error in test function:', error);
      return null;
    }
  };

  // Test function for Gameweek 2 with team priority selection
  const testGameweek2WithPriority = async () => {
    try {
      console.log('=== TESTING: Gameweek 2 with Team Priority Selection ===');
      
      // Get all fixtures from the dedicated fixtures API
      const allFixtures = await fplApi.getFixtures();
      console.log('Total fixtures from fixtures API:', allFixtures.length);
      
      // Filter for Gameweek 2 (event = 2)
      const gameweek2Fixtures = allFixtures.filter((fixture: FPLFixture) => fixture.event === 2);
      console.log('Gameweek 2 fixtures found:', gameweek2Fixtures.length);
      
      // Get teams for mapping
      const teams = await fplApi.getTeams();
      console.log('Teams loaded from bootstrap API:', teams.length);
      
      // Display all Gameweek 2 fixtures with details
      console.log('=== ALL GAMEWEEK 2 FIXTURES FROM FIXTURES API ===');
      gameweek2Fixtures.forEach((fixture: FPLFixture, index: number) => {
        const homeTeam = teams.find((team: any) => team.id === fixture.team_h);
        const awayTeam = teams.find((team: any) => team.id === fixture.team_a);
        
        console.log(`Fixture ${index + 1}:`, {
          id: fixture.id,
          event: fixture.event,
          homeTeamId: fixture.team_h,
          homeTeamName: homeTeam?.name || 'Unknown',
          homeTeamShort: homeTeam?.short_name || 'Unknown',
          awayTeamId: fixture.team_a,
          awayTeamName: awayTeam?.name || 'Unknown',
          awayTeamShort: awayTeam?.short_name || 'Unknown',
          kickoffTime: fixture.kickoff_time,
          finished: fixture.finished,
          started: fixture.started,
          minutes: fixture.minutes,
          homeScore: fixture.team_h_score,
          awayScore: fixture.team_a_score
        });
      });
      
      // Map fixtures to our internal format
      const mappedFixtures = gameweek2Fixtures.map((fixture: FPLFixture) => {
        const homeTeam = teams.find((team: any) => team.id === fixture.team_h);
        const awayTeam = teams.find((team: any) => team.id === fixture.team_a);
        
        return {
          id: fixture.id,
          homeTeam: homeTeam?.name || 'Unknown',
          awayTeam: awayTeam?.name || 'Unknown',
          homeTeamId: fixture.team_h,
          awayTeamId: fixture.team_a,
          kickoffTime: new Date(fixture.kickoff_time),
          gameweek: fixture.event,
          isFinished: fixture.finished,
          homeScore: fixture.team_h_score,
          awayScore: fixture.team_a_score,
        };
      });

      console.log('=== MAPPED FIXTURES FOR PRIORITY SELECTION ===');
      console.log('Mapped fixtures:', mappedFixtures.map(f => ({
        id: f.id,
        homeTeam: f.homeTeam,
        awayTeam: f.awayTeam,
        gameweek: f.gameweek
      })));

      // Apply team priority selection logic
      console.log('=== APPLYING TEAM PRIORITY SELECTION LOGIC ===');
      const selectedFixture = selectGameByTeamPriority(mappedFixtures);
      
      console.log('=== GAMEWEEK 2 TEST COMPLETE ===');
      return selectedFixture;
      
    } catch (error) {
      console.error('❌ Error in Gameweek 2 test function:', error);
      return null;
    }
  };

  // Test function for Gameweek 5 with team priority selection
  const testGameweek5WithPriority = async () => {
    try {
      console.log('=== TESTING: Gameweek 5 with Team Priority Selection ===');
      
      // Get all fixtures from the dedicated fixtures API
      const allFixtures = await fplApi.getFixtures();
      console.log('Total fixtures from fixtures API:', allFixtures.length);
      
      // Filter for Gameweek 5 (event = 5)
      const gameweek5Fixtures = allFixtures.filter((fixture: FPLFixture) => fixture.event === 5);
      console.log('Gameweek 5 fixtures found:', gameweek5Fixtures.length);
      
      // Get teams for mapping
      const teams = await fplApi.getTeams();
      console.log('Teams loaded from bootstrap API:', teams.length);
      
      // Display all Gameweek 5 fixtures with details
      console.log('=== ALL GAMEWEEK 5 FIXTURES FROM FIXTURES API ===');
      gameweek5Fixtures.forEach((fixture: FPLFixture, index: number) => {
        const homeTeam = teams.find((team: any) => team.id === fixture.team_h);
        const awayTeam = teams.find((team: any) => team.id === fixture.team_a);
        
        console.log(`Fixture ${index + 1}:`, {
          id: fixture.id,
          // code: fixture.code, // Removed - property doesn't exist on FPLFixture
          event: fixture.event,
          homeTeamId: fixture.team_h,
          homeTeamName: homeTeam?.name || 'Unknown',
          homeTeamShort: homeTeam?.short_name || 'Unknown',
          awayTeamId: fixture.team_a,
          awayTeamName: awayTeam?.name || 'Unknown',
          awayTeamShort: awayTeam?.short_name || 'Unknown',
          kickoffTime: fixture.kickoff_time,
          finished: fixture.finished,
          started: fixture.started,
          minutes: fixture.minutes,
          homeScore: fixture.team_h_score,
          awayScore: fixture.team_a_score
        });
      });
      
      // Map fixtures to our internal format
      const mappedFixtures = gameweek5Fixtures.map((fixture: FPLFixture) => {
        const homeTeam = teams.find((team: any) => team.id === fixture.team_h);
        const awayTeam = teams.find((team: any) => team.id === fixture.team_a);
        
        return {
          id: fixture.id,
          homeTeam: homeTeam?.name || 'Unknown',
          awayTeam: awayTeam?.name || 'Unknown',
          homeTeamId: fixture.team_h,
          awayTeamId: fixture.team_a,
          kickoffTime: new Date(fixture.kickoff_time),
          gameweek: fixture.event,
          isFinished: fixture.finished,
          homeScore: fixture.team_h_score,
          awayScore: fixture.team_a_score,
        };
      });

      console.log('=== MAPPED FIXTURES FOR PRIORITY SELECTION ===');
      console.log('Mapped fixtures:', mappedFixtures.map(f => ({
        id: f.id,
        homeTeam: f.homeTeam,
        awayTeam: f.awayTeam,
        gameweek: f.gameweek
      })));

      // Apply team priority selection logic
      console.log('=== APPLYING TEAM PRIORITY SELECTION LOGIC ===');
      const selectedFixture = selectGameByTeamPriority(mappedFixtures);
      
      console.log('=== GAMEWEEK 5 TEST COMPLETE ===');
      return selectedFixture;
      
    } catch (error) {
      console.error('❌ Error in Gameweek 5 test function:', error);
      return null;
    }
  };

  // Generic test function for any gameweek
  const testGameweekWithPriority = async (gameweekNumber: number) => {
    try {
      console.log(`=== TESTING: Gameweek ${gameweekNumber} with Team Priority Selection ===`);
      
      // Get all fixtures from the dedicated fixtures API
      const allFixtures = await fplApi.getFixtures();
      console.log('Raw fixtures response:', allFixtures);
      console.log('Fixtures type:', typeof allFixtures);
      console.log('Is array?', Array.isArray(allFixtures));
      
      if (!allFixtures) {
        console.error('❌ No fixtures returned from API');
        return null;
      }
      
      if (!Array.isArray(allFixtures)) {
        console.error('❌ Fixtures is not an array:', allFixtures);
        return null;
      }
      
      console.log('Total fixtures from fixtures API:', allFixtures.length);
      
      // Filter for the specified gameweek
      const gameweekFixtures = allFixtures.filter((fixture: FPLFixture) => fixture.event === gameweekNumber);
      console.log(`Gameweek ${gameweekNumber} fixtures found:`, gameweekFixtures.length);
      
      if (gameweekFixtures.length === 0) {
        console.log(`❌ No fixtures found for Gameweek ${gameweekNumber}`);
        return null;
      }
      
      // Get teams for mapping
      const teams = await fplApi.getTeams();
      console.log('Teams loaded from bootstrap API:', teams.length);
      
      // Display all fixtures for the gameweek with details
      console.log(`=== ALL GAMEWEEK ${gameweekNumber} FIXTURES FROM FIXTURES API ===`);
      gameweekFixtures.forEach((fixture: FPLFixture, index: number) => {
        const homeTeam = teams.find((team: any) => team.id === fixture.team_h);
        const awayTeam = teams.find((team: any) => team.id === fixture.team_a);
        
        console.log(`Fixture ${index + 1}:`, {
          id: fixture.id,
          // code: fixture.code, // Removed - property doesn't exist on FPLFixture
          event: fixture.event,
          homeTeamId: fixture.team_h,
          homeTeamName: homeTeam?.name || 'Unknown',
          homeTeamShort: homeTeam?.short_name || 'Unknown',
          awayTeamId: fixture.team_a,
          awayTeamName: awayTeam?.name || 'Unknown',
          awayTeamShort: awayTeam?.short_name || 'Unknown',
          kickoffTime: fixture.kickoff_time,
          finished: fixture.finished,
          started: fixture.started,
          minutes: fixture.minutes,
          homeScore: fixture.team_h_score,
          awayScore: fixture.team_a_score
        });
      });
      
      // Map fixtures to our internal format
      const mappedFixtures = gameweekFixtures.map((fixture: FPLFixture) => {
        const homeTeam = teams.find((team: any) => team.id === fixture.team_h);
        const awayTeam = teams.find((team: any) => team.id === fixture.team_a);
        
        return {
          id: fixture.id,
          homeTeam: homeTeam?.name || 'Unknown',
          awayTeam: awayTeam?.name || 'Unknown',
          homeTeamId: fixture.team_h,
          awayTeamId: fixture.team_a,
          kickoffTime: new Date(fixture.kickoff_time),
          gameweek: fixture.event,
          isFinished: fixture.finished,
          homeScore: fixture.team_h_score,
          awayScore: fixture.team_a_score,
        };
      });

      console.log(`=== MAPPED FIXTURES FOR GAMEWEEK ${gameweekNumber} PRIORITY SELECTION ===`);
      console.log('Mapped fixtures:', mappedFixtures.map(f => ({
        id: f.id,
        homeTeam: f.homeTeam,
        awayTeam: f.awayTeam,
        gameweek: f.gameweek
      })));

      // Apply team priority selection logic and get the selected fixture
      console.log('=== APPLYING TEAM PRIORITY SELECTION LOGIC ===');
      
      // Priority team IDs as specified
      const PRIORITY_TEAM_IDS = [1, 7, 12, 13, 14, 18];
      const SECONDARY_TEAM_IDS = [2, 15];
      
      // Priority order for team_h selection
      const TEAM_H_PRIORITY_ORDER = [13, 12, 1, 14, 7, 18];
      const TEAM_A_PRIORITY_ORDER = [15, 2];

      // Helper function to get priority index
      const getPriorityIndex = (teamId: number, priorityOrder: number[]): number => {
        const index = priorityOrder.indexOf(teamId);
        return index === -1 ? 999 : index;
      };

      let selectedFixture: Fixture | null = null;

      // Rule 1: Both team_h and team_a in PRIORITY_TEAM_IDS
      const bothPriority = mappedFixtures.filter(f => 
        f.homeTeamId && f.awayTeamId &&
        PRIORITY_TEAM_IDS.includes(f.homeTeamId) && 
        PRIORITY_TEAM_IDS.includes(f.awayTeamId)
      );

      if (bothPriority.length > 0) {
        console.log('Rule 1: Found fixtures with both teams in priority list:', bothPriority.length);
        
        // Sort by team_h priority order
        bothPriority.sort((a, b) => {
          const aIndex = getPriorityIndex(a.homeTeamId!, TEAM_H_PRIORITY_ORDER);
          const bIndex = getPriorityIndex(b.homeTeamId!, TEAM_H_PRIORITY_ORDER);
          return aIndex - bIndex;
        });

        selectedFixture = bothPriority[0];
        console.log('Selected by Rule 1:', {
          fixtureId: selectedFixture?.id,
          homeTeam: selectedFixture?.homeTeam,
          homeTeamId: selectedFixture?.homeTeamId,
          awayTeam: selectedFixture?.awayTeam,
          awayTeamId: selectedFixture?.awayTeamId
        });
      }

      // Rule 2: team_h in PRIORITY_TEAM_IDS and team_a in SECONDARY_TEAM_IDS
      if (!selectedFixture) {
        const homePriorityAwaySecondary = mappedFixtures.filter(f => 
          f.homeTeamId && f.awayTeamId &&
          PRIORITY_TEAM_IDS.includes(f.homeTeamId) && 
          SECONDARY_TEAM_IDS.includes(f.awayTeamId)
        );

        if (homePriorityAwaySecondary.length > 0) {
          console.log('Rule 2: Found fixtures with priority home team and secondary away team:', homePriorityAwaySecondary.length);
          
          // Sort by team_h priority order
          homePriorityAwaySecondary.sort((a, b) => {
            const aIndex = getPriorityIndex(a.homeTeamId!, TEAM_H_PRIORITY_ORDER);
            const bIndex = getPriorityIndex(b.homeTeamId!, TEAM_H_PRIORITY_ORDER);
            return aIndex - bIndex;
          });

          selectedFixture = homePriorityAwaySecondary[0];
          console.log('Selected by Rule 2:', {
            fixtureId: selectedFixture?.id,
            homeTeam: selectedFixture?.homeTeam,
            homeTeamId: selectedFixture?.homeTeamId,
            awayTeam: selectedFixture?.awayTeam,
            awayTeamId: selectedFixture?.awayTeamId
          });
        }
      }

      // Rule 3: team_a in PRIORITY_TEAM_IDS and team_h in SECONDARY_TEAM_IDS
      if (!selectedFixture) {
        const awayPriorityHomeSecondary = mappedFixtures.filter(f => 
          f.homeTeamId && f.awayTeamId &&
          PRIORITY_TEAM_IDS.includes(f.awayTeamId) && 
          SECONDARY_TEAM_IDS.includes(f.homeTeamId)
        );

        if (awayPriorityHomeSecondary.length > 0) {
          console.log('Rule 3: Found fixtures with priority away team and secondary home team:', awayPriorityHomeSecondary.length);
          
          // Sort by team_a priority order
          awayPriorityHomeSecondary.sort((a, b) => {
            const aIndex = getPriorityIndex(a.awayTeamId!, TEAM_A_PRIORITY_ORDER);
            const bIndex = getPriorityIndex(b.awayTeamId!, TEAM_A_PRIORITY_ORDER);
            return aIndex - bIndex;
          });

          selectedFixture = awayPriorityHomeSecondary[0];
          console.log('Selected by Rule 3:', {
            fixtureId: selectedFixture?.id,
            homeTeam: selectedFixture?.homeTeam,
            homeTeamId: selectedFixture?.homeTeamId,
            awayTeam: selectedFixture?.awayTeam,
            awayTeamId: selectedFixture?.awayTeamId
          });
        }
      }

      // Fallback: No matches found
      if (!selectedFixture) {
        console.log('No fixtures match the priority criteria, returning first available');
        selectedFixture = mappedFixtures[0];
      }

      // Set the selected fixture in the UI
      if (selectedFixture) {
        setSelectedFixture(selectedFixture);
        console.log('✅ Game selected and set for Gameweek', gameweekNumber, ':', selectedFixture);
        
        // Store all fixtures for this gameweek (removed for production)
        
        // Clear any existing form data
        setHomeGoals('');
        setAwayGoals('');
        setGoalscorer('');
        setSubmittedEntry(null);
        
        // Force update available players after a short delay to ensure state is updated
        setTimeout(() => {
          console.log('🔄 Forcing update of available players for new fixture');
          if (players.length > 0 && teams.length > 0 && elementTypes.length > 0) {
            updateAvailablePlayers();
          } else {
            console.log('⚠️ Player data not yet loaded, will update when available');
          }
        }, 100);
      }
      
      console.log(`=== GAMEWEEK ${gameweekNumber} TEST COMPLETE ===`);
      return selectedFixture;
      
    } catch (error) {
      console.error(`❌ Error in Gameweek ${gameweekNumber} test function:`, error);
      return null;
    }
  };

  // Fetch current gameweek and fixtures
  useEffect(() => {
    fetchGameweekData();
  }, []);

  // Fetch user predictions when user or fixtures change
  useEffect(() => {
    if (user && fixtures.length > 0) {
      fetchUserPredictions();
    }
  }, [user, fixtures]);

  // Auto-select game when fixtures or strategy changes
  useEffect(() => {
    if (fixtures.length > 0 && selectionStrategy !== 'manual') {
      const selected = selectGameByTeamPriority(fixtures);
      setSelectedFixture(selected);
    }
  }, [fixtures, selectionStrategy]);

  // Load player data when component mounts
  useEffect(() => {
    fetchPlayerData();
  }, []);

  // Update available players when fixture changes
  useEffect(() => {
    if (selectedFixture && players.length > 0 && teams.length > 0 && elementTypes.length > 0) {
      updateAvailablePlayers();
    }
  }, [selectedFixture, players, teams, elementTypes]);

  // Check fixture lock status when selected fixture changes
  useEffect(() => {
    if (selectedFixture) {
      checkFixtureLockStatus();
      // Don't auto-load user entry - only show submitted entry if it exists
      checkForSubmittedEntry();
    }
  }, [selectedFixture]);

  // Load current pot when component mounts
  useEffect(() => {
    loadCurrentPot();
  }, []);

  const fetchGameweekData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching gameweek data...');
      
      // Get all gameweeks to determine current gameweek
      const allGameweeks = await fplApi.getGameweeks();
      console.log('All gameweeks loaded:', allGameweeks.length);
      
      // Try to get current gameweek first, fallback to gameweek 1
      let gameweek = allGameweeks.find(gw => gw.is_current);
      if (!gameweek) {
        console.log('No current gameweek found, using gameweek 1');
        gameweek = allGameweeks.find(gw => gw.id === 1);
      }
      
      console.log('Selected gameweek:', gameweek);
      setCurrentGameweek(gameweek || null);

      if (gameweek) {
        // Get fixtures from dedicated fixtures API and teams from bootstrap API
        const [allFixtures, teams] = await Promise.all([
          fplApi.getFixtures(),
          fplApi.getTeams()
        ]);
        
        console.log('All fixtures from fixtures API:', allFixtures.length);
        console.log('Teams loaded from bootstrap API:', teams.length);
        
        // Filter fixtures for the current gameweek (event)
        const eventFixtures = allFixtures.filter((fixture: FPLFixture) => fixture.event === gameweek.id);
        console.log(`Fixtures found for event ${gameweek.id}:`, eventFixtures.length);
        
        // Map fixtures with team names
        const mappedFixtures = eventFixtures.map((fixture: FPLFixture) => {
            const homeTeam = teams.find((team: any) => team.id === fixture.team_h);
            const awayTeam = teams.find((team: any) => team.id === fixture.team_a);
            
          console.log(`Mapping fixture ${fixture.id}:`, {
            homeTeamId: fixture.team_h,
            homeTeamName: homeTeam?.name || 'Unknown',
            homeTeamShort: homeTeam?.short_name || 'Unknown',
            awayTeamId: fixture.team_a,
            awayTeamName: awayTeam?.name || 'Unknown',
            awayTeamShort: awayTeam?.short_name || 'Unknown'
          });
            
            return {
              id: fixture.id,
              homeTeam: homeTeam?.name || 'Unknown',
              awayTeam: awayTeam?.name || 'Unknown',
            homeTeamId: fixture.team_h,
            awayTeamId: fixture.team_a,
              kickoffTime: new Date(fixture.kickoff_time),
              gameweek: fixture.event,
              isFinished: fixture.finished,
              homeScore: fixture.team_h_score,
              awayScore: fixture.team_a_score,
            };
          });

        console.log('Mapped fixtures for GW', gameweek.id, ':', mappedFixtures.length);
        console.log('Fixture details:', mappedFixtures.map(f => `${f.homeTeam} vs ${f.awayTeam}`));
        
        setFixtures(mappedFixtures);
        
      } else {
        console.error('No gameweek found');
        setError('Unable to load gameweek data');
      }
    } catch (err: any) {
      console.error('Error fetching gameweek data:', err);
      setError(err.message || 'Failed to load fixtures');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerData = async () => {
    try {
      console.log('🔍 Fetching player data...');
      
      // Get all bootstrap data at once (more efficient)
      const bootstrapData = await fplApi.getBootstrapData();
      
      console.log('Bootstrap data loaded:', {
        players: bootstrapData.elements?.length || 0,
        teams: bootstrapData.teams?.length || 0,
        elementTypes: bootstrapData.element_types?.length || 0,
        events: bootstrapData.events?.length || 0
      });
      
      setPlayers(bootstrapData.elements || []);
      setTeams(bootstrapData.teams || []);
      setElementTypes(bootstrapData.element_types || []);
      
      console.log('✅ Player data loaded and set successfully');
    } catch (error) {
      console.error('❌ Error fetching player data:', error);
    }
  };

  const updateAvailablePlayers = () => {
    console.log('🔄 updateAvailablePlayers called');
    console.log('Selected fixture:', selectedFixture);
    console.log('Players loaded:', players.length);
    console.log('Teams loaded:', teams.length);
    console.log('Element types loaded:', elementTypes.length);
    
    if (!selectedFixture?.homeTeamId || !selectedFixture?.awayTeamId) {
      console.log('❌ No homeTeamId or awayTeamId in selected fixture');
      return;
    }

    console.log('Updating available players for fixture:', selectedFixture.id);
    console.log('Home team ID:', selectedFixture.homeTeamId);
    console.log('Away team ID:', selectedFixture.awayTeamId);

    // Filter players for the selected fixture teams
    console.log('🔍 Checking team ID matching...');
    console.log('Available team IDs in players:', [...new Set(players.map(p => p.team))].sort((a, b) => a - b));
    
    const fixturePlayers = players.filter(player => 
      (player.team === selectedFixture.homeTeamId || player.team === selectedFixture.awayTeamId)
    );

    console.log('Filtered players for fixture teams:', fixturePlayers.length);
    
    // Debug: Show some sample players and their team IDs
    const samplePlayers = players.slice(0, 5);
    console.log('Sample players:', samplePlayers.map(p => ({
      name: p.web_name,
      team: p.team
    })));

    // Sort players by position (FWD, MID, DEF, GKP) alternating home/away teams
    const sortedPlayers = fixturePlayers.sort((a, b) => {
      // First sort by element_type (position): 4=FWD, 3=MID, 2=DEF, 1=GKP
      if (a.element_type !== b.element_type) {
        return b.element_type - a.element_type; // Higher element_type first (FWD=4, GKP=1)
      }
      // Then sort by team (home team first within each position)
      if (a.team !== b.team) {
        return a.team === selectedFixture.homeTeamId ? -1 : 1;
      }
      // Finally sort by player name
      return a.web_name.localeCompare(b.web_name);
    });

    console.log('✅ Available players for fixture:', sortedPlayers.length);
    console.log('Sample players:', sortedPlayers.slice(0, 3).map(p => `${p.web_name} (${p.team})`));
    setAvailablePlayers(sortedPlayers);
  };

  const fetchUserPredictions = async () => {
    if (!user) return;

    try {
      const predictions = await dbUtils.getPredictionsByUser(user.uid, currentGameweek?.id);
      setUserPredictions(predictions.map(p => ({
        id: p.id,
        fixtureId: p.id || 0,
        homeGoals: p.homeGoals,
        awayGoals: p.awayGoals,
        goalscorer: p.goalscorer,
        submittedAt: p.submittedAt,
        isCorrect: p.isCorrect,
        points: p.points,
      })));
    } catch (err) {
      console.error('Error fetching user predictions:', err);
    }
  };

  const handleFixtureSelect = (fixture: Fixture) => {
    setSelectedFixture(fixture);
    // Clear form fields when selecting a new fixture
    setHomeGoals('');
    setAwayGoals('');
    setGoalscorer('');
    setSubmittedEntry(null);
    setEntryError(null);
  };

  const hasUserPredicted = (fixtureId: number) => {
    return userPredictions.some(p => p.fixtureId === fixtureId);
  };

  const getUserPrediction = (fixtureId: number) => {
    return userPredictions.find(p => p.fixtureId === fixtureId);
  };

  const handleSubmitPrediction = async () => {
    if (!user || !selectedFixture) return;

    // Check if fixture is locked
    if (fixtureLocked) {
      setEntryError('Entries are locked. You cannot submit or edit after kickoff.');
      return;
    }

    const homeGoalsNum = parseInt(homeGoals);
    const awayGoalsNum = parseInt(awayGoals);

    if (isNaN(homeGoalsNum) || isNaN(awayGoalsNum)) {
      setEntryError('Please fill in score fields correctly');
      return;
    }

    if (homeGoalsNum < 0 || homeGoalsNum > 99 || awayGoalsNum < 0 || awayGoalsNum > 99) {
      setEntryError('Goals must be between 0 and 99');
      return;
    }

    // Check if goalscorer is required (unless predicting 0-0)
    if (homeGoalsNum > 0 || awayGoalsNum > 0) {
      if (!goalscorer.trim()) {
        setEntryError('Please select a goalscorer');
        return;
      }
    }

    setSubmitting(true);
    setEntryError(null);

    try {
      // Use user's display name for manager details
      const displayName = user.displayName || user.email?.split('@')[0] || 'Unknown';
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || 'Unknown';
      const screenName = displayName;

      // Create Score and Strike entry with fixture and gameweek info
      const scoreStrikeEntry: ScoreStrikeEntry = {
        fplleague_id: 607394, // Ordinary Gentlemen League ID
        manager_email: user.email || '',
        manager_fplid: managerFplId || 0,
        manager_f_name: firstName,
        manager_l_name: lastName,
        manager_scrname: screenName,
        fixture_id: selectedFixture.id,
        gameweek: selectedFixture.gameweek,
        home_goal: homeGoalsNum,
        away_goal: awayGoalsNum,
        player_name: goalscorer.trim(), // Empty string for 0-0 predictions
        submitted_timestamp: new Date()
      };

      // Save to Score and Strike table (this will update if entry already exists)
      await dbUtils.saveScoreStrikeEntry(scoreStrikeEntry);
      
      // Also save to legacy prediction table for backward compatibility
      const prediction: Prediction = {
        id: Date.now(),
        userId: user.uid,
        gameweek: currentGameweek?.id || 1,
        homeTeam: selectedFixture.homeTeam,
        awayTeam: selectedFixture.awayTeam,
        homeGoals: homeGoalsNum,
        awayGoals: awayGoalsNum,
        goalscorer: goalscorer.trim(),
        submittedAt: new Date(),
        isCorrect: false,
        points: 0
      };

      await dbUtils.savePrediction(prediction);
      
      // Refresh predictions
      await fetchUserPredictions();
      
      // Set submitted entry for display
      setSubmittedEntry({
        homeTeam: selectedFixture.homeTeam,
        awayTeam: selectedFixture.awayTeam,
        homeGoals: homeGoalsNum,
        awayGoals: awayGoalsNum,
        goalscorer: goalscorer.trim(),
        submittedAt: new Date()
      });

      // Clear form and any errors
      setHomeGoals('');
      setAwayGoals('');
      setGoalscorer('');
      setEntryError(null);
      
      console.log('Score and Strike entry submitted successfully');
    } catch (err: any) {
      console.error('Error submitting prediction:', err);
      setEntryError(err.message || 'Failed to submit prediction');
    } finally {
      setSubmitting(false);
    }
  };

  const formatKickoffTime = (date: Date) => {
    return date.toLocaleString('en-GB', {
      weekday: 'short', 
      day: 'numeric',
      month: 'short',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const getFixtureStatus = (fixture: Fixture) => {
    if (fixture.isFinished) return 'Finished';
    if (new Date() >= fixture.kickoffTime) return 'Live';
    return 'Upcoming';
  };

  const getPredictionResult = (prediction: UserPrediction, fixture: Fixture) => {
    if (!fixture.isFinished) return null;

    const scoreCorrect = prediction.homeGoals === fixture.homeScore && 
                        prediction.awayGoals === fixture.awayScore;
    const goalscorerCorrect = fixture.goalscorers?.includes(prediction.goalscorer);
    
    return {
      scoreCorrect,
      goalscorerCorrect,
      totalPoints: (scoreCorrect ? 3 : 0) + (goalscorerCorrect ? 2 : 0)
    };
  };

  const getPlayerDisplayName = (player: Player) => {
    const team = teams.find(t => t.id === player.team);
    const elementType = elementTypes.find(et => et.id === player.element_type);
    
    return `${player.first_name} ${player.web_name} - ${team?.short_name} ${elementType?.singular_name_short}`;
  };

  const getPlayerWebName = (playerDisplayName: string) => {
    // Extract just the web_name from the full display name
    const match = playerDisplayName.match(/^[A-Za-z]+ ([A-Za-z]+) -/);
    return match ? match[1] : playerDisplayName;
  };

  const getTeamBadge = (teamName: string) => {
    // Try exact match first
    let team = teams.find(t => t.name === teamName);
    
    // If not found, try case-insensitive match
    if (!team) {
      team = teams.find(t => t.name.toLowerCase() === teamName.toLowerCase());
    }
    
    // If still not found, try partial match
    if (!team) {
      team = teams.find(t => 
        t.name.toLowerCase().includes(teamName.toLowerCase()) || 
        teamName.toLowerCase().includes(t.name.toLowerCase())
      );
    }
    
    console.log('Getting badge for team:', teamName, 'Found team:', team);
    if (!team) {
      console.log('Team not found for:', teamName, 'Available teams:', teams.map(t => t.name));
      return '';
    }
    
    const badgeUrl = `https://resources.premierleague.com/premierleague/badges/t${team.id}.png`;
    console.log('Badge URL:', badgeUrl);
    return badgeUrl;
  };

  // Validation logic
  const isFormValid = () => {
    const homeGoalsNum = parseInt(homeGoals) || 0;
    const awayGoalsNum = parseInt(awayGoals) || 0;
    
    // If both scores are 0, goalscorer is not required
    if (homeGoalsNum === 0 && awayGoalsNum === 0) {
      return homeGoals !== '' && awayGoals !== '';
    }
    
    // Otherwise, all fields are required
    return homeGoals !== '' && awayGoals !== '' && goalscorer !== '';
  };

  const hasFormData = () => {
    return homeGoals !== '' || awayGoals !== '' || goalscorer !== '';
  };

  const isFixtureLocked = (fixture: Fixture) => {
    return fixture.isFinished || new Date() >= fixture.kickoffTime;
  };

  const getTeamShortName = (teamName: string) => {
    const team = teams.find(t => t.name === teamName);
    return team?.short_name || teamName;
  };

  const formatSubmissionTime = (date: Date) => {
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if fixture is locked (after kickoff)
  const checkFixtureLockStatus = () => {
    if (!selectedFixture) return;
    
    const now = new Date();
    const kickoffTime = new Date(selectedFixture.kickoffTime);
    const isLocked = now >= kickoffTime || selectedFixture.isFinished;
    
    setFixtureLocked(isLocked);
    console.log(`Fixture ${selectedFixture.id} lock status:`, isLocked);
  };

  // Load current pot amount
  const loadCurrentPot = async () => {
    try {
      setPotLoading(true);
      const pot = await dbUtils.getCurrentScoreStrikePot(607394); // Ordinary Gentlemen League ID
      if (pot) {
        setCurrentPot(pot.current_amount);
        console.log('Current pot loaded:', pot.current_amount);
      } else {
        // If no pot exists, check admin config for starting amount
        const adminConfig = await dbUtils.getLatestAdminConfig();
        if (adminConfig && adminConfig.payoutStructure.scoreNStrike > 0) {
          setCurrentPot(adminConfig.payoutStructure.scoreNStrike);
          console.log('Using admin config starting pot:', adminConfig.payoutStructure.scoreNStrike);
        } else {
          setCurrentPot(0);
          console.log('No pot configuration found');
        }
      }
    } catch (error) {
      console.error('Error loading current pot:', error);
      setCurrentPot(0);
    } finally {
      setPotLoading(false);
    }
  };

  // Check if user has already submitted an entry for this fixture
  const hasUserSubmittedEntry = async (fixtureId: number, gameweek: number) => {
    if (!user) return false;
    
    try {
      const entry = await dbUtils.getScoreStrikeEntryByManagerAndFixture(
        user.email || '',
        fixtureId,
        gameweek
      );
      return !!entry;
    } catch (error) {
      console.error('Error checking user entry:', error);
      return false;
    }
  };

  // Check if user has submitted an entry for the selected fixture (without loading into form)
  const checkForSubmittedEntry = async () => {
    if (!user || !selectedFixture) return;
    
    try {
      const entry = await dbUtils.getScoreStrikeEntryByManagerAndFixture(
        user.email || '',
        selectedFixture.id,
        selectedFixture.gameweek
      );
      
      if (entry) {
        // Only set the submitted entry display, don't populate form fields
        setSubmittedEntry({
          homeTeam: selectedFixture.homeTeam,
          awayTeam: selectedFixture.awayTeam,
          homeGoals: entry.home_goal,
          awayGoals: entry.away_goal,
          goalscorer: entry.player_name,
          submittedAt: entry.submitted_timestamp
        });
        console.log('Found existing submitted entry:', entry);
      } else {
        // Clear any existing submitted entry display
        setSubmittedEntry(null);
      }
    } catch (error) {
      console.error('Error checking for submitted entry:', error);
    }
  };

  // Load user's existing entry for the selected fixture (for admin/debug purposes)
  const loadUserEntry = async () => {
    if (!user || !selectedFixture) return;
    
    try {
      const entry = await dbUtils.getScoreStrikeEntryByManagerAndFixture(
        user.email || '',
        selectedFixture.id,
        selectedFixture.gameweek
      );
      
      if (entry) {
        setHomeGoals(entry.home_goal.toString());
        setAwayGoals(entry.away_goal.toString());
        setGoalscorer(entry.player_name);
        setSubmittedEntry({
          homeTeam: selectedFixture.homeTeam,
          awayTeam: selectedFixture.awayTeam,
          homeGoals: entry.home_goal,
          awayGoals: entry.away_goal,
          goalscorer: entry.player_name,
          submittedAt: entry.submitted_timestamp
        });
        console.log('Loaded existing entry into form:', entry);
      }
    } catch (error) {
      console.error('Error loading user entry:', error);
    }
  };

  // Determine winners for a fixture (admin function)
  const determineWinners = async (fixtureId: number, gameweek: number) => {
    try {
      console.log(`🔍 Determining winners for Fixture ${fixtureId}, Gameweek ${gameweek}`);
      
      const response = await fetch('/api/score-strike', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'determine_winners',
          gameweek,
          fixtureId
        }),
      });

      const result = await response.json();
      console.log('API Response:', result);
      
      if (response.ok) {
        console.log('✅ Winners determined:', result);
        return result;
      } else {
        console.error('❌ Error determining winners:', result);
        const errorMessage = result.error || 'Unknown error';
        const details = result.details || '';
        const availableFixtures = result.availableFixtures || [];
        
        let fullError = errorMessage;
        if (details) fullError += ` - ${details}`;
        if (availableFixtures.length > 0) {
          fullError += `\n\nAvailable fixtures: ${availableFixtures.map((f: any) => `ID ${f.id}`).join(', ')}`;
        }
        
        throw new Error(fullError);
      }
    } catch (error) {
      console.error('Error calling winner determination API:', error);
      throw error;
    }
  };

  // Update pot for a gameweek (admin function)
  const updatePot = async (gameweek: number) => {
    try {
      console.log(`💰 Updating pot for Gameweek ${gameweek}`);
      
      const response = await fetch('/api/score-strike', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_pot',
          gameweek
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Pot updated:', result);
        // Refresh current pot display
        await loadCurrentPot();
        return result;
      } else {
        console.error('❌ Error updating pot:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error calling pot update API:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-32 sm:min-h-48">
        <div className="text-center">
          <div className="animate-spin-slow w-8 h-8 sm:w-12 sm:h-12 border-3 sm:border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-3 sm:mb-4"></div>
          <div className="text-sm sm:text-base lg:text-lg text-gray-600 font-medium">Loading fixtures...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 sm:py-8 px-4">
        <div className="text-red-600 mb-3 sm:mb-4 text-sm sm:text-base font-medium">{error}</div>
        <button 
          onClick={fetchGameweekData}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base font-semibold touch-target"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 max-w-6xl mx-auto">
      {/* Compact Header with Current Pot - FPL-style sizing */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-extrabold mb-2 sm:mb-3 bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent drop-shadow-md">
            🎯 Score and Strike
          </h1>
          {currentGameweek && (
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 font-medium">
              Gameweek {currentGameweek.id}
            </p>
          )}
        </div>
        
        {/* Compact Pot Status - FPL-style sizing */}
        <div className="bg-gradient-to-r from-green-100 to-blue-100 border-2 border-green-300 rounded-lg p-3 sm:p-4 text-center shadow-lg w-full">
          <div className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">POT TO WIN</div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-800">
            ${currentPot.toLocaleString()}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
            {potLoading ? 'Loading...' : 'This Week'}
          </div>
        </div>
      </div>

      {/* Compact Contest Display - FPL-style sizing */}
      {selectedFixture ? (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-blue-200 shadow-xl">
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg">
            {/* Compact Teams and Score Inputs - FPL-style sizing */}
            <div className="flex flex-col gap-4 sm:gap-6 mb-4 sm:mb-6">
              {/* Home Team - Compact sizing */}
              <div className="flex flex-col items-center">
                <div className="text-sm sm:text-base font-medium text-blue-600 mb-1 sm:mb-2">Home Team</div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-2 sm:mb-3 text-center">
                  {selectedFixture.homeTeam}
                </div>
                <input
                  type="text"
                  value={homeGoals}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 99)) {
                      setHomeGoals(value);
                    }
                  }}
                  className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 px-2 sm:px-3 border-2 sm:border-3 border-gray-300 rounded-lg sm:rounded-xl text-center text-xl sm:text-2xl lg:text-3xl font-bold focus:ring-2 sm:focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition-all touch-target"
                  placeholder="0"
                  disabled={fixtureLocked}
                />
              </div>

              {/* VS - Compact sizing */}
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-400 text-center">VS</div>

              {/* Away Team - Compact sizing */}
              <div className="flex flex-col items-center">
                <div className="text-sm sm:text-base font-medium text-red-600 mb-1 sm:mb-2">Away Team</div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-2 sm:mb-3 text-center">
                  {selectedFixture.awayTeam}
                </div>
                <input
                  type="text"
                  value={awayGoals}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 99)) {
                      setAwayGoals(value);
                    }
                  }}
                  className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 px-2 sm:px-3 border-2 sm:border-3 border-gray-300 rounded-lg sm:rounded-xl text-center text-xl sm:text-2xl lg:text-3xl font-bold focus:ring-2 sm:focus:ring-4 focus:ring-red-500 focus:border-red-500 transition-all touch-target"
                  placeholder="0"
                  disabled={fixtureLocked}
                />
              </div>
            </div>
            
            {/* Compact Goalscorer Selection - FPL-style sizing */}
            <div className="flex flex-col gap-2 sm:gap-3 mb-4 sm:mb-6">
              <label className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 text-center sm:text-left">
                Goalscorer:
              </label>
              <div className="relative w-full">
                <select
                  value={goalscorer}
                  onChange={(e) => setGoalscorer(e.target.value)}
                  disabled={parseInt(homeGoals) === 0 && parseInt(awayGoals) === 0 || fixtureLocked}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 sm:border-3 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 sm:focus:ring-4 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500 transition-all touch-target"
                >
                  <option value="">
                    {parseInt(homeGoals) === 0 && parseInt(awayGoals) === 0 
                      ? "Goalscorer not required (0-0 score)" 
                      : "Select a player"}
                  </option>
                  {availablePlayers.map(player => (
                    <option key={player.id} value={getPlayerDisplayName(player)}>
                      {getPlayerDisplayName(player)}
                    </option>
                  ))}
                </select>
                {parseInt(homeGoals) === 0 && parseInt(awayGoals) === 0 && (
                  <div className="absolute inset-0 bg-gray-100 bg-opacity-50 rounded-lg sm:rounded-xl pointer-events-none flex items-center justify-center">
                    <span className="text-gray-500 text-xs sm:text-sm font-medium text-center px-2">Disabled - No goals predicted</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Compact Action Buttons - FPL-style sizing */}
            <div className="flex flex-col gap-3 sm:gap-4">
              <button
                onClick={(e) => { e.preventDefault(); handleSubmitPrediction(); }}
                disabled={submitting || fixtureLocked || !isFormValid()}
                className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg lg:text-xl shadow-lg transition-all transform hover:scale-105 touch-target ${
                  submitting || fixtureLocked || !isFormValid()
                    ? 'bg-gradient-to-r from-gray-400 to-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                {submitting ? '⏳ Submitting...' : fixtureLocked ? '🔒 Locked' : '🚀 Submit Prediction'}
              </button>
              <button
                onClick={() => {
                  setHomeGoals('');
                  setAwayGoals('');
                  setGoalscorer('');
                  setSubmittedEntry(null);
                }}
                disabled={!hasFormData()}
                className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg lg:text-xl shadow-lg transition-all transform hover:scale-105 touch-target ${
                  !hasFormData()
                    ? 'bg-gradient-to-r from-gray-300 to-gray-300 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700'
                }`}
              >
                🗑️ Clear Form
              </button>
            </div>
            
            {/* Compact Status Messages - FPL-style sizing */}
            {submittedEntry && (
              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-green-700 text-xs sm:text-sm font-medium text-center">
                  ✅ {submittedEntry.homeTeam} {submittedEntry.homeGoals} - {submittedEntry.awayGoals} {submittedEntry.awayTeam} {submittedEntry.goalscorer && `${getPlayerWebName(submittedEntry.goalscorer)}`} - {formatSubmissionTime(submittedEntry.submittedAt)}
                </div>
              </div>
            )}
            
            {entryError && (
              <div className="mt-3 sm:mt-4 bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3">
                <div className="text-red-800 font-semibold mb-2 text-sm sm:text-base">
                  ⚠️ Entry Error
                </div>
                <div className="text-red-700 text-xs sm:text-sm">
                  {entryError}
                </div>
              </div>
            )}
            
            {fixtureLocked && (
              <div className="mt-3 sm:mt-4 text-center p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800 font-semibold text-sm sm:text-base">🔒 Match Locked</div>
                <div className="text-red-600 text-xs sm:text-sm">Entries closed after kickoff</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border-2 border-gray-200 shadow-xl">
          <div className="text-center">
            <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">⚽</div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">Loading Contest...</h2>
            <p className="text-sm sm:text-base text-gray-600">Selecting the best fixture for this gameweek</p>
          </div>
        </div>
      )}

      {/* Compact Rules Section - FPL-style sizing */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-3 sm:p-4">
        <h4 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">How to Play</h4>
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm lg:text-base text-gray-700">
            <span className="text-lg sm:text-xl flex-shrink-0">🎯</span>
            <span>Predict the exact final score (Home Goals vs Away Goals)</span>
          </div>
          <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm lg:text-base text-gray-700">
            <span className="text-lg sm:text-xl flex-shrink-0">⚽</span>
            <span>Select an anytime goalscorer from either team (or leave blank for 0-0)</span>
          </div>
          <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm lg:text-base text-gray-700">
            <span className="text-lg sm:text-xl flex-shrink-0">🏆</span>
            <span>Win Score N Strike Pot For Correct Score Line and Goal Scorer</span>
          </div>
          <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm lg:text-base text-gray-700">
            <span className="text-lg sm:text-xl flex-shrink-0">📊</span>
            <span>If no winner the pot will Roll over to next week, else Pot Resets</span>
          </div>
          <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm lg:text-base text-gray-700">
            <span className="text-lg sm:text-xl flex-shrink-0">⏰</span>
            <span>Submit predictions before kick-off time only</span>
          </div>
          <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm lg:text-base text-gray-700">
            <span className="text-lg sm:text-xl flex-shrink-0">🔄</span>
            <span>Multiple entries allowed - only the most recent before kickoff is considered</span>
          </div>
          <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm lg:text-base text-gray-700">
            <span className="text-lg sm:text-xl flex-shrink-0">🔒</span>
            <span>Entries are locked after kickoff - no changes allowed</span>
          </div>
        </div>
      </div>
    </div>
  );
} 