import { db, dbUtils, User, Prediction, GameweekSummary, LeagueStanding } from './database';
import testConfig from '../test.config.js';

// Test utilities for managing test data and environment

export class TestUtils {
  // Test user configurations for different scenarios
  static getTestUsers() {
    return {
      defaultUser: {
        uid: 'test-default-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://lh3.googleusercontent.com/a/test-default',
        managerFplId: 123456 // Default test user FPL ID
      }
    };
  }

  // Initialize test database with mock data
  static async initializeTestDatabase(): Promise<void> {
    try {
      // Clear existing data
      await this.clearTestData();
      
      // Add all test users
      const testUsers = this.getTestUsers();
      for (const [role, userData] of Object.entries(testUsers)) {
        const testUser: User = {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await dbUtils.saveUser(testUser);
        console.log(`✅ Added ${role} test user: ${userData.email}`);
      }
      
      // Use the default user for test data
      const defaultUser = testUsers.defaultUser;
      
      // Add test gameweek summary
      const gameweekSummary: GameweekSummary = {
        gameweek: testConfig.mockData.gameweek,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        isActive: true,
        isCompleted: false,
        totalParticipants: Object.keys(testUsers).length,
        averageScore: 5.5,
        topScore: 10,
        topScorer: defaultUser.displayName
      };
      await dbUtils.saveGameweekSummary(gameweekSummary);
      
      // Add test predictions for all users
      const predictions: Prediction[] = [];
      Object.values(testUsers).forEach((user, index) => {
        predictions.push(
          {
            userId: user.uid,
            gameweek: testConfig.mockData.gameweek,
            homeTeam: 'Arsenal',
            awayTeam: 'Chelsea',
            homeGoals: 2 + index,
            awayGoals: 1,
            goalscorer: index === 0 ? 'Saka' : 'Havertz',
            submittedAt: new Date()
          },
          {
            userId: user.uid,
            gameweek: testConfig.mockData.gameweek,
            homeTeam: 'Liverpool',
            awayTeam: 'Manchester City',
            homeGoals: 1,
            awayGoals: 2 + index,
            goalscorer: index === 0 ? 'Haaland' : 'Salah',
            submittedAt: new Date()
          }
        );
      });
      
      for (const prediction of predictions) {
        await dbUtils.savePrediction(prediction);
      }
      
      // Add test league standings for all users
      Object.values(testUsers).forEach(async (user, index) => {
        const leagueStanding: LeagueStanding = {
          userId: user.uid,
          managerName: user.displayName,
          teamName: `${user.displayName}'s Team`,
          gameweek: testConfig.mockData.gameweek,
          gameweekPoints: 8 + index * 2,
          totalPoints: 45 + index * 10,
          transfers: 2,
          teamValue: 100.5 + index,
          rank: index + 1,
          lastUpdated: new Date()
        };
        await dbUtils.saveLeagueStanding(leagueStanding);
      });
      
      console.log('Test database initialized successfully');
    } catch (error) {
      console.error('Error initializing test database:', error);
      throw error;
    }
  }
  
  // Clear all test data
  static async clearTestData(): Promise<void> {
    try {
      await db.users.clear();
      await db.predictions.clear();
      await db.gameweekSummaries.clear();
      await db.leagueStandings.clear();
      console.log('Test data cleared successfully');
    } catch (error) {
      console.error('Error clearing test data:', error);
      throw error;
    }
  }
  
  // Generate mock FPL API response
  static generateMockFPLData() {
    return {
      events: [
        {
          id: testConfig.mockData.gameweek,
          name: `Gameweek ${testConfig.mockData.gameweek}`,
          deadline_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          average_entry_score: 45,
          finished: false,
          data_checked: false,
          highest_scoring_entry: 123456,
          is_previous: false,
          is_current: true,
          is_next: false
        }
      ],
      teams: testConfig.mockData.teams.map((team, index) => ({
        id: index + 1,
        name: team,
        short_name: team.substring(0, 3).toUpperCase(),
        strength: Math.floor(Math.random() * 5) + 1
      })),
      elements: testConfig.mockData.players.map((player, index) => ({
        id: index + 1,
        first_name: player,
        second_name: 'Test',
        web_name: player,
        team: Math.floor(Math.random() * 5) + 1,
        element_type: Math.floor(Math.random() * 4) + 1,
        total_points: Math.floor(Math.random() * 200) + 50
      }))
    };
  }
  
  // Mock API response for testing
  static async mockApiResponse(endpoint: string, method: string = 'GET'): Promise<any> {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Simulate API delay
    await delay(100);
    
    switch (endpoint) {
      case '/api/fpl':
        return this.generateMockFPLData();
      case '/api/standings':
        return await dbUtils.getLeagueStandings();
      case '/api/predictions':
        return await dbUtils.getPredictionsByGameweek(testConfig.mockData.gameweek);
      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }
  }
  
  // Check if we're in test mode
  static isTestMode(): boolean {
    return testConfig.flags.testMode || process.env.NODE_ENV === 'test';
  }
  
  // Switch between test users
  static switchTestUser(userType: 'defaultUser'): void {
    const testUsers = this.getTestUsers();
    const selectedUser = testUsers[userType];
    
    // Store current test user in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentTestUser', JSON.stringify(selectedUser));
      console.log(`🔄 Switched to ${userType}:`, selectedUser.email);
    }
  }

  // Get current test user (with fallback to default user)
  static getCurrentTestUser() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('currentTestUser');
      if (stored) {
        return JSON.parse(stored);
      }
    }
    return this.getTestUsers().defaultUser;
  }

  // Get test user data (backward compatibility)
  static getTestUser(): User {
    const currentUser = this.getCurrentTestUser();
    return {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

export default TestUtils; 