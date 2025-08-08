import axios from 'axios';

// League configuration
const LEAGUE_ID = 607394; // Ordinary Gentlemen League

export interface FPLTeam {
  id: number;
  name: string;
  short_name: string;
  strength: number;
  strength_overall_home: number;
  strength_overall_away: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
}

export interface FPLPlayer {
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

export interface FPLGameweek {
  id: number;
  name: string;
  deadline_time: string;
  average_entry_score: number;
  finished: boolean;
  data_checked: boolean;
  highest_scoring_entry: number;
  is_previous: boolean;
  is_current: boolean;
  is_next: boolean;
}

export interface FPLFixture {
  id: number;
  event: number;
  finished: boolean;
  finished_provisional: boolean;
  kickoff_time: string;
  minutes: number;
  provisional_start_time: boolean;
  started: boolean;
  team_a: number;
  team_a_score: number;
  team_h: number;
  team_h_score: number;
  stats: any[];
  team_h_difficulty: number;
  team_a_difficulty: number;
  pulse_id: number;
}

export interface ChipUsage {
  managerId: number;
  managerName: string;
  teamName: string;
  gameweek: number;
  chipType: 'bboost' | 'freehit' | 'wildcard' | '3xc';
  chipName: string;
  points: number;
  rank: number;
}

export interface MatchResult {
  fixtureId: number;
  gameweek: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  kickoffTime: string;
  finished: boolean;
  started: boolean;
  lastUpdated: Date;
}

export interface Goalscorer {
  matchResultId: number;
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  goals: number;
  isHomeTeam: boolean;
}

export interface MatchData {
  matchResult: MatchResult;
  goalscorers: Goalscorer[];
}

class FPLApiService {
  private static instance: FPLApiService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): FPLApiService {
    if (!FPLApiService.instance) {
      FPLApiService.instance = new FPLApiService();
    }
    return FPLApiService.instance;
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    // Check if we're in test mode with mock API enabled
    if (typeof window !== 'undefined') {
      const isTestMode = process.env.NODE_ENV === 'test' || process.env.NEXT_PUBLIC_TEST_MODE === 'true';
      const mockApiEnabled = process.env.NEXT_PUBLIC_MOCK_API === 'true';
      
      if (isTestMode && mockApiEnabled) {
        return this.getMockData<T>(endpoint);
      }
    }

    const cacheKey = endpoint;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Use Next.js API route to avoid CORS issues
      const response = await axios.get(`/api/fpl?endpoint=${encodeURIComponent(endpoint)}`);
      this.cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
      return response.data;
    } catch (error) {
      console.error(`FPL API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  private getMockData<T>(endpoint: string): Promise<T> {
    console.log(`🧪 Using mock data for endpoint: ${endpoint}`);
    
    // Return mock data based on endpoint
    if (endpoint.includes('/leagues-classic/') && endpoint.includes('/standings/')) {
      return Promise.resolve({
        league: {
          id: 607394,
          name: "League of Ordinary Gentlemen",
          admin_entry: 607394, // Mock admin entry
          short_name: "LOG",
          scoring: "c"
        },
        new_entries: {
          results: [
            {
              id: 1,
              entry: 607394,
              entry_name: "Test Admin Team",
              player_first_name: "Test",
              player_last_name: "Admin",
              rank: 1,
              total: 2000
            },
            {
              id: 2,
              entry: 3098228,
              entry_name: "Test User Team",
              player_first_name: "Test",
              player_last_name: "User",
              rank: 2,
              total: 1900
            }
          ]
        }
      } as T);
    }
    
    if (endpoint === '/bootstrap-static/') {
      return Promise.resolve({
        events: [
          {
            id: 1,
            name: "Gameweek 1",
            deadline_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            finished: false,
            is_current: true
          }
        ],
        teams: [
          { id: 1, name: "Arsenal", short_name: "ARS" },
          { id: 2, name: "Chelsea", short_name: "CHE" },
          { id: 3, name: "Liverpool", short_name: "LIV" }
        ],
        elements: [
          { id: 1, first_name: "Mo", second_name: "Salah", web_name: "Salah", team: 3 },
          { id: 2, first_name: "Erling", second_name: "Haaland", web_name: "Haaland", team: 1 }
        ],
        chips: [
          { name: "wildcard", start_event: 1, stop_event: 19 },
          { name: "bboost", start_event: 1, stop_event: 38 },
          { name: "3xc", start_event: 1, stop_event: 38 },
          { name: "freehit", start_event: 1, stop_event: 38 }
        ]
      } as T);
    }
    
    if (endpoint === '/fixtures/') {
      return Promise.resolve([
        {
          id: 1,
          code: 1234567,
          event: 1,
          finished: false,
          team_a: 1,
          team_h: 2,
          team_a_score: null,
          team_h_score: null
        }
      ] as T);
    }
    
    // Default empty response
    return Promise.resolve({} as T);
  }

  // Get all teams
  async getTeams(): Promise<FPLTeam[]> {
    const data = await this.makeRequest<any>('/bootstrap-static/');
    return data.teams;
  }

  // Get all players
  async getPlayers(): Promise<FPLPlayer[]> {
    const data = await this.makeRequest<any>('/bootstrap-static/');
    return data.elements;
  }

  // Get element types (positions)
  async getElementTypes(): Promise<any[]> {
    const data = await this.makeRequest<any>('/bootstrap-static/');
    return data.element_types;
  }

  // Get all bootstrap data at once (players, teams, element types)
  async getBootstrapData(): Promise<{
    elements: FPLPlayer[];
    teams: FPLTeam[];
    element_types: any[];
    events: FPLGameweek[];
    chips?: any[];
  }> {
    return await this.makeRequest<any>('/bootstrap-static/');
  }

  // Get current gameweek
  async getCurrentGameweek(): Promise<FPLGameweek | null> {
    const data = await this.makeRequest<any>('/bootstrap-static/');
    return data.events.find((event: FPLGameweek) => event.is_current) || null;
  }

  // Get all gameweeks
  async getGameweeks(): Promise<FPLGameweek[]> {
    const data = await this.makeRequest<any>('/bootstrap-static/');
    return data.events;
  }

  // Get fixtures for a specific gameweek
  async getFixtures(gameweek?: number): Promise<FPLFixture[]> {
    try {
      console.log('🔍 Fetching fixtures from FPL API...');
      const fixtures = await this.makeRequest<FPLFixture[]>('/fixtures/');
      console.log(`📊 Found ${fixtures.length} total fixtures`);
      
      if (gameweek) {
        const filteredFixtures = fixtures.filter((fixture: FPLFixture) => fixture.event === gameweek);
        console.log(`📊 Found ${filteredFixtures.length} fixtures for gameweek ${gameweek}`);
        return filteredFixtures;
      }
      
      return fixtures;
    } catch (error) {
      console.error('❌ Error fetching fixtures:', error);
      return [];
    }
  }

  // Get league standings for a specific league
  async getLeagueStandings(leagueId?: number): Promise<any> {
    const targetLeagueId = leagueId || LEAGUE_ID;
    return await this.makeRequest(`/leagues-classic/${targetLeagueId}/standings/`);
  }

  // Get manager FPL ID by email from league standings
  async getManagerFplIdByEmail(leagueId: number, email: string): Promise<number | null> {
    try {
      console.log(`🔍 Looking for manager with email: ${email} in league ${leagueId}`);
      
      // Get league standings
      const standings = await this.getLeagueStandings(leagueId);
      const managers = standings.standings?.results || [];
      
      // Look for manager with matching email
      // Note: FPL API doesn't expose emails directly, so we need to match by other criteria
      // For now, we'll use a simple approach - you may need to implement a more sophisticated matching
      
      // Try to find by common patterns or use a mapping approach
      // This is a placeholder implementation - you'll need to adjust based on your specific needs
      
      console.log(`📊 Found ${managers.length} managers in league`);
      
      // For now, return null - you'll need to implement the actual email matching logic
      // based on how you want to match emails to manager IDs
      return null;
    } catch (error) {
      console.error('Error getting manager FPL ID by email:', error);
      return null;
    }
  }

  // Get manager's team (requires manager ID)
  async getManagerTeam(managerId: number): Promise<any> {
    return await this.makeRequest(`/entry/${managerId}/`);
  }

  // Get manager's team for specific gameweek
  async getManagerTeamForGameweek(managerId: number, gameweek: number): Promise<any> {
    return await this.makeRequest(`/entry/${managerId}/event/${gameweek}/picks/`);
  }

  // Get chip usage for all managers in the league
  async getChipUsage(): Promise<ChipUsage[]> {
    try {
      // Get league standings to get all manager IDs
      const leagueData = await this.getLeagueStandings();
      const managers = leagueData.standings.results || [];
      
      const chipUsage: ChipUsage[] = [];
      const gameweeks = await this.getGameweeks();
      const finishedGameweeks = gameweeks.filter(gw => gw.finished).slice(-6); // Last 6 gameweeks
      
      // Process each manager
      for (const manager of managers.slice(0, 10)) { // Limit to top 10 managers for performance
        const managerId = manager.entry;
        const managerName = `${manager.player_first_name} ${manager.player_last_name}`;
        const teamName = manager.entry_name;
        
        // Check each finished gameweek for chip usage
        for (const gameweek of finishedGameweeks) {
          try {
            const teamData = await this.getManagerTeamForGameweek(managerId, gameweek.id);
            
            if (teamData && teamData.active_chip) {
              const chipType = teamData.active_chip;
              const chipName = this.getChipDisplayName(chipType, gameweek.id);
              
              chipUsage.push({
                managerId,
                managerName,
                teamName,
                gameweek: gameweek.id,
                chipType,
                chipName,
                points: teamData.entry_history?.points || 0,
                rank: manager.rank
              });
            }
          } catch (error) {
            console.warn(`Failed to get team data for manager ${managerId} in GW ${gameweek.id}:`, error);
          }
        }
      }
      
      return chipUsage;
    } catch (error) {
      console.error('Error fetching chip usage:', error);
      throw error;
    }
  }

  // Get chip winners for each chip type
  async getChipWinners(): Promise<{
    [chipType: string]: {
      gameweek: number;
      managerId: number;
      managerName: string;
      points: number;
      chipName: string;
    }[];
  }> {
    try {
      const chipUsage = await this.getChipUsage();
      const chipWinners: { [chipType: string]: any[] } = {};
      
      // Group chip usage by chip type
      const chipUsageByType: { [chipType: string]: ChipUsage[] } = {};
      chipUsage.forEach(usage => {
        if (!chipUsageByType[usage.chipType]) {
          chipUsageByType[usage.chipType] = [];
        }
        chipUsageByType[usage.chipType].push(usage);
      });
      
      // For each chip type, find the winner(s) with highest points
      for (const [chipType, usages] of Object.entries(chipUsageByType)) {
        if (!chipWinners[chipType]) {
          chipWinners[chipType] = [];
        }
        
        // Group by gameweek to handle multiple gameweeks
        const usageByGameweek: { [gameweek: number]: ChipUsage[] } = {};
        usages.forEach(usage => {
          if (!usageByGameweek[usage.gameweek]) {
            usageByGameweek[usage.gameweek] = [];
          }
          usageByGameweek[usage.gameweek].push(usage);
        });
        
        // Find winners for each gameweek
        for (const [gameweek, gameweekUsages] of Object.entries(usageByGameweek)) {
          const maxPoints = Math.max(...gameweekUsages.map(u => u.points));
          const winners = gameweekUsages.filter(u => u.points === maxPoints);
          
          winners.forEach(winner => {
            chipWinners[chipType].push({
              gameweek: winner.gameweek,
              managerId: winner.managerId,
              managerName: winner.managerName,
              points: winner.points,
              chipName: winner.chipName
            });
          });
        }
      }
      
      return chipWinners;
    } catch (error) {
      console.error('Error getting chip winners:', error);
      throw error;
    }
  }

  // Fetch and store match data for a specific gameweek
  async fetchAndStoreMatchData(gameweek: number): Promise<MatchData[]> {
    try {
      console.log(`🔍 Fetching match data for gameweek ${gameweek}...`);
      
      // Fetch fixtures for the gameweek
      const fixtures = await this.getFixtures(gameweek);
      if (fixtures.length === 0) {
        console.log(`⚠️ No fixtures found for gameweek ${gameweek}`);
        return [];
      }

      // Fetch bootstrap data for team and player mapping
      const bootstrapData = await this.getBootstrapData();
      const teamMap = new Map(bootstrapData.teams.map(team => [team.id, team.name]));
      const playerMap = new Map(bootstrapData.elements.map(player => [player.id, player.web_name]));

      const matchDataArray: MatchData[] = [];

      for (const fixture of fixtures) {
        const matchData = this.processFixtureData(fixture, teamMap, playerMap);
        if (matchData) {
          matchDataArray.push(matchData);
        }
      }

      console.log(`✅ Processed ${matchDataArray.length} matches for gameweek ${gameweek}`);
      return matchDataArray;
    } catch (error) {
      console.error(`❌ Error fetching match data for gameweek ${gameweek}:`, error);
      throw error;
    }
  }

  // Process individual fixture data
  private processFixtureData(
    fixture: FPLFixture, 
    teamMap: Map<number, string>, 
    playerMap: Map<number, string>
  ): MatchData | null {
    try {
      const homeTeamName = teamMap.get(fixture.team_h) || `Team ${fixture.team_h}`;
      const awayTeamName = teamMap.get(fixture.team_a) || `Team ${fixture.team_a}`;

      // Create match result
      const matchResult: MatchResult = {
        fixtureId: fixture.id,
        gameweek: fixture.event,
        homeTeamId: fixture.team_h,
        awayTeamId: fixture.team_a,
        homeTeamName,
        awayTeamName,
        homeScore: fixture.team_h_score || 0,
        awayScore: fixture.team_a_score || 0,
        kickoffTime: fixture.kickoff_time,
        finished: fixture.finished,
        started: fixture.started,
        lastUpdated: new Date()
      };

      // Extract goalscorers from stats
      const goalscorers: Goalscorer[] = [];
      const goalsScored = fixture.stats?.find(stat => stat.identifier === 'goals_scored');
      
      if (goalsScored) {
        // Process home team goalscorers
        if (goalsScored.h) {
          for (const playerStat of goalsScored.h) {
            const playerName = playerMap.get(playerStat.element) || `Player ${playerStat.element}`;
            goalscorers.push({
              matchResultId: 0, // Will be set when saving
              playerId: playerStat.element,
              playerName,
              teamId: fixture.team_h,
              teamName: homeTeamName,
              goals: playerStat.value,
              isHomeTeam: true
            });
          }
        }

        // Process away team goalscorers
        if (goalsScored.a) {
          for (const playerStat of goalsScored.a) {
            const playerName = playerMap.get(playerStat.element) || `Player ${playerStat.element}`;
            goalscorers.push({
              matchResultId: 0, // Will be set when saving
              playerId: playerStat.element,
              playerName,
              teamId: fixture.team_a,
              teamName: awayTeamName,
              goals: playerStat.value,
              isHomeTeam: false
            });
          }
        }
      }

      return {
        matchResult,
        goalscorers
      };
    } catch (error) {
      console.error(`❌ Error processing fixture ${fixture.id}:`, error);
      return null;
    }
  }

  // Get match data for a specific gameweek (from database)
  async getMatchDataForGameweek(gameweek: number): Promise<MatchData[]> {
    try {
      const { dbUtils } = await import('./database');
      const matchResults = await dbUtils.getMatchResultsByGameweek(gameweek);
      
      const matchDataArray: MatchData[] = [];
      
      for (const matchResult of matchResults) {
        const goalscorers = await dbUtils.getGoalscorersByMatch(matchResult.id!);
        matchDataArray.push({
          matchResult,
          goalscorers
        });
      }
      
      return matchDataArray;
    } catch (error) {
      console.error(`❌ Error getting match data for gameweek ${gameweek}:`, error);
      throw error;
    }
  }

  // Store match data in database
  async storeMatchData(matchDataArray: MatchData[]): Promise<void> {
    try {
      const { dbUtils } = await import('./database');
      
      for (const matchData of matchDataArray) {
        await dbUtils.saveMatchData(matchData);
      }
      
      console.log(`✅ Stored ${matchDataArray.length} match records in database`);
    } catch (error) {
      console.error('❌ Error storing match data:', error);
      throw error;
    }
  }

  // Complete workflow: fetch, process, and store match data
  async fetchProcessAndStoreMatchData(gameweek: number): Promise<void> {
    try {
      console.log(`🚀 Starting complete workflow for gameweek ${gameweek}...`);
      
      // Fetch and process match data
      const matchDataArray = await this.fetchAndStoreMatchData(gameweek);
      
      if (matchDataArray.length > 0) {
        // Store in database
        await this.storeMatchData(matchDataArray);
        console.log(`✅ Successfully processed and stored match data for gameweek ${gameweek}`);
      } else {
        console.log(`⚠️ No match data to store for gameweek ${gameweek}`);
      }
    } catch (error) {
      console.error(`❌ Error in complete workflow for gameweek ${gameweek}:`, error);
      throw error;
    }
  }

  // Helper method to get chip display name
  private getChipDisplayName(chipType: string, gameweek: number): string {
    const chipNames: { [key: string]: string } = {
      'bboost': 'Bench Boost',
      'freehit': 'Free Hit',
      'wildcard': 'Wildcard',
      '3xc': 'Triple Captain'
    };
    
    const baseName = chipNames[chipType] || chipType;
    return `${baseName} ${gameweek <= 19 ? 'I' : 'II'}`;
  }

  // Get league ID
  getLeagueId(): number {
    return LEAGUE_ID;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

export const fplApi = FPLApiService.getInstance(); 