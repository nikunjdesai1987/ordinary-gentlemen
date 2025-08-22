import { db, dbUtils } from './database';

export interface WeeklyWinnerData {
  gameweek: number;
  name: string;
  managerName: string;
  managerFplId: number;
  managerScore: number;
}

export class WeeklyWinnerManager {
  /**
   * Update weekly winners for a new gameweek
   * This function should be called when a new gameweek becomes current
   */
  static async updateWeeklyWinnersForNewGameweek(
    newGameweek: number, 
    newGameweekName: string, 
    leagueStandings: any[]
  ): Promise<void> {
    try {
      console.log(`🔄 Updating weekly winners for Gameweek ${newGameweek}: ${newGameweekName}`);
      
      // First, mark all existing current weekly winners as not current
      const currentWinners = await db.weeklyWinners.filter(winner => winner.isCurrent).toArray();
      for (const winner of currentWinners) {
        await db.weeklyWinners.update(winner.id!, { 
          isCurrent: false, 
          updatedAt: new Date() 
        });
      }
      console.log(`✅ Marked ${currentWinners.length} existing winners as not current`);

      // Create new weekly winner entries for all managers in the new gameweek
      const weeklyWinnerEntries = leagueStandings.map(standing => ({
        gameweek: newGameweek,
        name: newGameweekName,
        managerName: standing.player_name,
        managerFplId: standing.entry,
        managerScore: standing.event_total,
        isCurrent: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Save all new entries
      for (const entry of weeklyWinnerEntries) {
        await dbUtils.saveWeeklyWinner(entry);
      }

      console.log(`✅ Created ${weeklyWinnerEntries.length} weekly winner entries for Gameweek ${newGameweek}`);
    } catch (error) {
      console.error('❌ Error updating weekly winners for new gameweek:', error);
      throw error;
    }
  }

  /**
   * Update a specific manager's score for the current gameweek
   */
  static async updateManagerScore(
    managerFplId: number, 
    gameweek: number, 
    newScore: number
  ): Promise<void> {
    try {
      const existing = await dbUtils.getWeeklyWinnerByManagerAndGameweek(managerFplId, gameweek);
      if (existing) {
        await db.weeklyWinners.update(existing.id!, {
          managerScore: newScore,
          updatedAt: new Date()
        });
        console.log(`✅ Updated score for manager ${managerFplId} in GW${gameweek} to ${newScore}`);
      } else {
        console.warn(`⚠️ No weekly winner entry found for manager ${managerFplId} in GW${gameweek}`);
      }
    } catch (error) {
      console.error('❌ Error updating manager score:', error);
      throw error;
    }
  }

  /**
   * Get the current gameweek winners
   */
  static async getCurrentGameweekWinners(): Promise<any[]> {
    try {
      const currentWinners = await dbUtils.getCurrentWeeklyWinners();
      // Sort by score (highest first)
      return currentWinners.sort((a, b) => b.managerScore - a.managerScore);
    } catch (error) {
      console.error('❌ Error getting current gameweek winners:', error);
      throw error;
    }
  }

  /**
   * Get weekly winners for a specific gameweek
   */
  static async getGameweekWinners(gameweek: number): Promise<any[]> {
    try {
      const winners = await dbUtils.getWeeklyWinnersByGameweek(gameweek);
      // Sort by score (highest first)
      return winners.sort((a, b) => b.managerScore - a.managerScore);
    } catch (error) {
      console.error('❌ Error getting gameweek winners:', error);
      throw error;
    }
  }

  /**
   * Get the winner of a specific gameweek (highest score)
   */
  static async getGameweekWinner(gameweek: number): Promise<any | null> {
    try {
      const winners = await this.getGameweekWinners(gameweek);
      return winners.length > 0 ? winners[0] : null;
    } catch (error) {
      console.error('❌ Error getting gameweek winner:', error);
      throw error;
    }
  }

  /**
   * Check if we need to update weekly winners (called periodically)
   * This function should be called to check if a new gameweek has started
   */
  static async checkAndUpdateWeeklyWinners(
    fplBootstrapData: any, 
    leagueStandings: any[]
  ): Promise<boolean> {
    try {
      // Find the current gameweek from FPL bootstrap data
      const currentGameweek = fplBootstrapData.events?.find((event: any) => event.is_current);
      
      if (!currentGameweek) {
        console.log('ℹ️ No current gameweek found in FPL data');
        return false;
      }

      // Check if we already have entries for this gameweek
      const existingEntries = await dbUtils.getWeeklyWinnersByGameweek(currentGameweek.id);
      
      if (existingEntries.length === 0) {
        console.log(`🆕 New gameweek detected: GW${currentGameweek.id} - ${currentGameweek.name}`);
        
        // Create new weekly winner entries
        await this.updateWeeklyWinnersForNewGameweek(
          currentGameweek.id,
          currentGameweek.name,
          leagueStandings
        );
        
        return true; // New gameweek was created
      } else {
        console.log(`ℹ️ Weekly winners already exist for GW${currentGameweek.id}`);
        return false; // No new gameweek
      }
    } catch (error) {
      console.error('❌ Error checking weekly winners:', error);
      throw error;
    }
  }

  /**
   * Update all manager scores for the current gameweek
   * This should be called when new league standings data is available
   */
  static async updateAllManagerScores(
    gameweek: number, 
    leagueStandings: any[]
  ): Promise<void> {
    try {
      console.log(`🔄 Updating scores for ${leagueStandings.length} managers in GW${gameweek}`);
      
      for (const standing of leagueStandings) {
        await this.updateManagerScore(
          standing.entry,
          gameweek,
          standing.event_total
        );
      }
      
      console.log(`✅ Updated scores for all managers in GW${gameweek}`);
    } catch (error) {
      console.error('❌ Error updating all manager scores:', error);
      throw error;
    }
  }
}
