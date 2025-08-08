import Dexie, { Table } from 'dexie';

export interface User {
  id?: number;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prediction {
  id?: number;
  userId: string;
  gameweek: number;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  goalscorer: string;
  submittedAt: Date;
  isCorrect?: boolean;
  points?: number;
}

export interface GameweekSummary {
  id?: number;
  gameweek: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isCompleted: boolean;
  totalParticipants: number;
  averageScore: number;
  topScore: number;
  topScorer: string;
}

export interface LeagueStanding {
  id?: number;
  userId: string;
  gameweek: number;
  managerName: string;
  teamName: string;
  gameweekPoints: number;
  totalPoints: number;
  transfers: number;
  teamValue: number;
  chipUsed?: string;
  rank: number;
  lastUpdated: Date;
}

export interface ScoreStrikeEntry {
  id?: number;
  fplleague_id: number;
  manager_email: string;
  manager_fplid: number;
  manager_f_name: string;
  manager_l_name: string;
  manager_scrname: string;
  fixture_id: number; // Add fixture ID for specific fixture tracking
  gameweek: number; // Add gameweek for easier querying
  home_goal: number;
  away_goal: number;
  player_name: string; // Empty string for 0-0 predictions
  submitted_timestamp: Date;
}

export interface ScoreStrikePot {
  id?: number;
  fplleague_id: number;
  gameweek: number;
  current_amount: number;
  starting_amount: number; // Si from admin config
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ScoreStrikeWinner {
  id?: number;
  fplleague_id: number;
  gameweek: number;
  fixture_id: number;
  manager_email: string;
  manager_fplid: number;
  manager_scrname: string;
  home_goal: number;
  away_goal: number;
  player_name: string;
  won_amount: number;
  won_at: Date;
}

export interface AdminConfig {
  id?: number;
  managerEntryFee: number;
  totalManagers: number;
  payoutStructure: {
    top20Winners: number[];
    scoreNStrike: number;
    weeklyWinner: number;
    chipUsage: { [key: string]: number };
  };
  isConfirmed: boolean;
  timestamp: Date;
  adminId: number;
  leagueId: number;
  updatedAt?: Date;
}

export interface LeagueInfo {
  id?: number;
  leagueId: number;
  leagueName: string;
  leagueAdmin: string;
  adminId: number;
  isCreated: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface MatchResult {
  id?: number;
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
  id?: number;
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

class FPLDatabase extends Dexie {
  users!: Table<User>;
  predictions!: Table<Prediction>;
  gameweekSummaries!: Table<GameweekSummary>;
  leagueStandings!: Table<LeagueStanding>;
  scoreStrikeEntries!: Table<ScoreStrikeEntry>;
  scoreStrikePots!: Table<ScoreStrikePot>;
  scoreStrikeWinners!: Table<ScoreStrikeWinner>;
  adminConfigs!: Table<AdminConfig>;
  leagueInfos!: Table<LeagueInfo>;
  matchResults!: Table<MatchResult>;
  goalscorers!: Table<Goalscorer>;

  constructor() {
    super('FPLDatabase');
    this.version(10).stores({
      users: '++id, uid, email',
      predictions: '++id, userId, gameweek, [userId+gameweek], submittedAt',
      gameweekSummaries: '++id, gameweek, isActive',
      leagueStandings: '++id, userId, gameweek, [userId+gameweek], rank',
      scoreStrikeEntries: '++id, fplleague_id, manager_email, manager_fplid, manager_scrname, fixture_id, gameweek, [manager_email+fixture_id+gameweek], submitted_timestamp',
      scoreStrikePots: '++id, fplleague_id, gameweek, is_active, [fplleague_id+gameweek]',
      scoreStrikeWinners: '++id, fplleague_id, gameweek, fixture_id, manager_email, [fplleague_id+gameweek]',
      adminConfigs: '++id, adminId, timestamp, isConfirmed, leagueId, updatedAt',
      leagueInfos: '++id, leagueId, leagueName, leagueAdmin, adminId, isCreated, createdAt, updatedAt',
      matchResults: '++id, fixtureId, gameweek, homeTeamId, awayTeamId, [gameweek+fixtureId]',
      goalscorers: '++id, matchResultId, playerId, teamId'
    });
  }
}

export const db = new FPLDatabase();

// Database utility functions
export const dbUtils = {
  // User operations
  async saveUser(user: User): Promise<number> {
    const existingUser = await db.users.where('uid').equals(user.uid).first();
    if (existingUser) {
      return await db.users.update(existingUser.id!, { ...user, updatedAt: new Date() });
    }
    return await db.users.add(user) as number;
  },

  async getUser(uid: string): Promise<User | undefined> {
    return await db.users.where('uid').equals(uid).first();
  },

  // Prediction operations
  async savePrediction(prediction: Prediction): Promise<number> {
    return await db.predictions.add(prediction) as number;
  },

  async getPredictionsByUser(userId: string, gameweek?: number): Promise<Prediction[]> {
    if (gameweek) {
      return await db.predictions.where('[userId+gameweek]').equals([userId, gameweek]).toArray();
    }
    return await db.predictions.where('userId').equals(userId).toArray();
  },

  async getPredictionsByGameweek(gameweek: number): Promise<Prediction[]> {
    return await db.predictions.where('gameweek').equals(gameweek).toArray();
  },

  // Gameweek operations
  async saveGameweekSummary(summary: GameweekSummary): Promise<number> {
    const existing = await db.gameweekSummaries.where('gameweek').equals(summary.gameweek).first();
    if (existing) {
      return await db.gameweekSummaries.update(existing.id!, summary);
    }
    return await db.gameweekSummaries.add(summary) as number;
  },

  async getActiveGameweek(): Promise<GameweekSummary | undefined> {
    return await db.gameweekSummaries.filter(gameweek => gameweek.isActive).first();
  },

  // League standings operations
  async saveLeagueStanding(standing: LeagueStanding): Promise<number> {
    const existing = await db.leagueStandings
      .where('[userId+gameweek]')
      .equals([standing.userId, standing.gameweek])
      .first();
    
    if (existing) {
      return await db.leagueStandings.update(existing.id!, standing);
    }
    return await db.leagueStandings.add(standing) as number;
  },

  async getLeagueStandings(gameweek?: number): Promise<LeagueStanding[]> {
    if (gameweek) {
      return await db.leagueStandings.where('gameweek').equals(gameweek).toArray();
    }
    return await db.leagueStandings.toArray();
  },

  // Score and Strike Entries operations
  async saveScoreStrikeEntry(entry: ScoreStrikeEntry): Promise<number> {
    // Check if there's an existing entry for this manager, fixture, and gameweek
    const existingEntry = await db.scoreStrikeEntries
      .where(['manager_email', 'fixture_id', 'gameweek'])
      .equals([entry.manager_email, entry.fixture_id, entry.gameweek])
      .first();
    
    if (existingEntry) {
      // Update existing entry (only most recent entry is kept)
      return await db.scoreStrikeEntries.update(existingEntry.id!, {
        ...entry,
        submitted_timestamp: new Date()
      });
    }
    
    // Add new entry
    return await db.scoreStrikeEntries.add(entry) as number;
  },

  async getScoreStrikeEntriesByManager(manager_email: string): Promise<ScoreStrikeEntry[]> {
    return await db.scoreStrikeEntries.where('manager_email').equals(manager_email).toArray();
  },

  async getScoreStrikeEntriesByLeague(fplleague_id: number): Promise<ScoreStrikeEntry[]> {
    return await db.scoreStrikeEntries.where('fplleague_id').equals(fplleague_id).toArray();
  },

  async getScoreStrikeEntriesByManagerAndLeague(manager_email: string, fplleague_id: number): Promise<ScoreStrikeEntry[]> {
    return await db.scoreStrikeEntries
      .where(['manager_email', 'fplleague_id'])
      .equals([manager_email, fplleague_id])
      .toArray();
  },

  async getScoreStrikeEntriesByFixture(fixture_id: number, gameweek: number): Promise<ScoreStrikeEntry[]> {
    return await db.scoreStrikeEntries
      .where(['fixture_id', 'gameweek'])
      .equals([fixture_id, gameweek])
      .toArray();
  },

  async getScoreStrikeEntryByManagerAndFixture(manager_email: string, fixture_id: number, gameweek: number): Promise<ScoreStrikeEntry | undefined> {
    return await db.scoreStrikeEntries
      .where(['manager_email', 'fixture_id', 'gameweek'])
      .equals([manager_email, fixture_id, gameweek])
      .first();
  },

  async getAllScoreStrikeEntries(): Promise<ScoreStrikeEntry[]> {
    return await db.scoreStrikeEntries.toArray();
  },

  // Score and Strike Pot operations
  async saveScoreStrikePot(pot: ScoreStrikePot): Promise<number> {
    const existingPot = await db.scoreStrikePots
      .where(['fplleague_id', 'gameweek'])
      .equals([pot.fplleague_id, pot.gameweek])
      .first();
    
    if (existingPot) {
      return await db.scoreStrikePots.update(existingPot.id!, {
        ...pot,
        updated_at: new Date()
      });
    }
    
    return await db.scoreStrikePots.add(pot) as number;
  },

  async getScoreStrikePot(fplleague_id: number, gameweek: number): Promise<ScoreStrikePot | undefined> {
    return await db.scoreStrikePots
      .where(['fplleague_id', 'gameweek'])
      .equals([fplleague_id, gameweek])
      .first();
  },

  async getCurrentScoreStrikePot(fplleague_id: number): Promise<ScoreStrikePot | undefined> {
    return await db.scoreStrikePots
      .where('fplleague_id')
      .equals(fplleague_id)
      .filter(pot => pot.is_active)
      .first();
  },

  // Score and Strike Winner operations
  async saveScoreStrikeWinner(winner: ScoreStrikeWinner): Promise<number> {
    return await db.scoreStrikeWinners.add(winner) as number;
  },

  async getScoreStrikeWinnersByGameweek(fplleague_id: number, gameweek: number): Promise<ScoreStrikeWinner[]> {
    return await db.scoreStrikeWinners
      .where(['fplleague_id', 'gameweek'])
      .equals([fplleague_id, gameweek])
      .toArray();
  },

  async getScoreStrikeWinnersByFixture(fixture_id: number, gameweek: number): Promise<ScoreStrikeWinner[]> {
    return await db.scoreStrikeWinners
      .where(['fixture_id', 'gameweek'])
      .equals([fixture_id, gameweek])
      .toArray();
  },

  // Get all Score and Strike winners for a specific gameweek with pot distribution
  async getScoreStrikeWinnersByGameweekWithPotDistribution(fplleague_id: number, gameweek: number): Promise<{
    winners: ScoreStrikeWinner[];
    totalWinners: number;
    potAmount: number;
    amountPerWinner: number;
  }> {
    try {
      // Get all winners for this gameweek
      const winners = await this.getScoreStrikeWinnersByGameweek(fplleague_id, gameweek);
      
      if (winners.length === 0) {
        return {
          winners: [],
          totalWinners: 0,
          potAmount: 0,
          amountPerWinner: 0
        };
      }

      // Get the pot amount for this gameweek
      const pot = await this.getScoreStrikePot(fplleague_id, gameweek);
      const potAmount = pot?.current_amount || 0;

      // Calculate amount per winner (pot divided by number of winners)
      const totalWinners = winners.length;
      const amountPerWinner = totalWinners > 0 ? potAmount / totalWinners : 0;

      return {
        winners,
        totalWinners,
        potAmount,
        amountPerWinner
      };
    } catch (error) {
      console.error('Error getting Score and Strike winners with pot distribution:', error);
      return {
        winners: [],
        totalWinners: 0,
        potAmount: 0,
        amountPerWinner: 0
      };
    }
  },

  // Admin Configuration operations
  async saveAdminConfig(config: AdminConfig): Promise<number> {
    return await db.adminConfigs.add(config) as number;
  },

  async getLatestAdminConfig(): Promise<AdminConfig | undefined> {
    return await db.adminConfigs
      .orderBy('timestamp')
      .reverse()
      .first();
  },

  async getAdminConfigsByAdmin(adminId: number): Promise<AdminConfig[]> {
    const configs = await db.adminConfigs
      .where('adminId')
      .equals(adminId)
      .toArray();
    return configs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async getAllAdminConfigs(): Promise<AdminConfig[]> {
    const configs = await db.adminConfigs.toArray();
    return configs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  // League Info operations
  async saveLeagueInfo(leagueInfo: LeagueInfo): Promise<number> {
    const existingLeague = await db.leagueInfos.where('leagueId').equals(leagueInfo.leagueId).first();
    if (existingLeague) {
      return await db.leagueInfos.update(existingLeague.id!, { ...leagueInfo, updatedAt: new Date() });
    }
    return await db.leagueInfos.add(leagueInfo) as number;
  },

  async getLeagueInfo(leagueId: number): Promise<LeagueInfo | undefined> {
    return await db.leagueInfos.where('leagueId').equals(leagueId).first();
  },

  async getAllLeagueInfos(): Promise<LeagueInfo[]> {
    const leagues = await db.leagueInfos.toArray();
    return leagues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getCreatedLeagues(): Promise<LeagueInfo[]> {
    return await db.leagueInfos.filter(league => league.isCreated).toArray();
  },

  async updateLeagueCreatedStatus(leagueId: number, isCreated: boolean): Promise<void> {
    const league = await db.leagueInfos.where('leagueId').equals(leagueId).first();
    if (league) {
      await db.leagueInfos.update(league.id!, { isCreated, updatedAt: new Date() });
    }
  },

  // Match Result operations
  async saveMatchResult(matchResult: MatchResult): Promise<number> {
    const existing = await db.matchResults
      .where('[gameweek+fixtureId]')
      .equals([matchResult.gameweek, matchResult.fixtureId])
      .first();
    
    if (existing) {
      return await db.matchResults.update(existing.id!, { ...matchResult, lastUpdated: new Date() });
    }
    return await db.matchResults.add(matchResult) as number;
  },

  async getMatchResultsByGameweek(gameweek: number): Promise<MatchResult[]> {
    return await db.matchResults.where('gameweek').equals(gameweek).toArray();
  },

  async getMatchResultByFixture(fixtureId: number): Promise<MatchResult | undefined> {
    return await db.matchResults.where('fixtureId').equals(fixtureId).first();
  },

  async getAllMatchResults(): Promise<MatchResult[]> {
    return await db.matchResults.toArray();
  },

  // Goalscorer operations
  async saveGoalscorer(goalscorer: Goalscorer): Promise<number> {
    return await db.goalscorers.add(goalscorer) as number;
  },

  async getGoalscorersByMatch(matchResultId: number): Promise<Goalscorer[]> {
    return await db.goalscorers.where('matchResultId').equals(matchResultId).toArray();
  },

  async getGoalscorersByGameweek(gameweek: number): Promise<Goalscorer[]> {
    const matchResults = await this.getMatchResultsByGameweek(gameweek);
    const matchIds = matchResults.map(match => match.id!);
    return await db.goalscorers.where('matchResultId').anyOf(matchIds).toArray();
  },

  async saveMatchData(matchData: MatchData): Promise<{ matchResultId: number; goalscorerIds: number[] }> {
    // Save match result first
    const matchResultId = await this.saveMatchResult(matchData.matchResult);
    
    // Save goalscorers
    const goalscorerIds: number[] = [];
    for (const goalscorer of matchData.goalscorers) {
      goalscorer.matchResultId = matchResultId;
      const goalscorerId = await this.saveGoalscorer(goalscorer);
      goalscorerIds.push(goalscorerId);
    }
    
    return { matchResultId, goalscorerIds };
  },

  // Utility functions
  async clearOldData(olderThanDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    await db.predictions
      .where('submittedAt')
      .below(cutoffDate)
      .delete();
  },

  // Function to clear all database data (useful for version conflicts)
  async clearAllData(): Promise<void> {
    console.log('🗑️ Clearing all database data...');
    try {
      await db.transaction('rw', [
        db.users, 
        db.predictions, 
        db.gameweekSummaries, 
        db.leagueStandings, 
        db.scoreStrikeEntries, 
        db.scoreStrikePots,
        db.scoreStrikeWinners,
        db.adminConfigs,
        db.leagueInfos,
        db.matchResults,
        db.goalscorers
      ], async () => {
        await db.users.clear();
        await db.predictions.clear();
        await db.gameweekSummaries.clear();
        await db.leagueStandings.clear();
        await db.scoreStrikeEntries.clear();
        await db.scoreStrikePots.clear();
        await db.scoreStrikeWinners.clear();
        await db.adminConfigs.clear();
        await db.leagueInfos.clear();
        await db.matchResults.clear();
        await db.goalscorers.clear();
      });
      console.log('✅ Database data cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing database data:', error);
      throw error;
    }
  },

  // Function to delete the entire database (nuclear option for version conflicts)
  async deleteDatabase(): Promise<void> {
    console.log('💥 Deleting entire database...');
    try {
      await db.delete();
      console.log('✅ Database deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting database:', error);
      throw error;
    }
  }
}; 