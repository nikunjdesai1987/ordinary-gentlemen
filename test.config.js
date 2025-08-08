// Test Configuration
const testConfig = {
  // Test environment settings
  environment: process.env.NODE_ENV || 'test',
  
  // Test database settings
  database: {
    name: process.env.NEXT_PUBLIC_TEST_DB_NAME || 'FPLTestDatabase',
    version: 1
  },
  
  // Test API settings
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    fplUrl: process.env.NEXT_PUBLIC_FPL_API_URL || 'https://fantasy.premierleague.com/api',
    timeout: 5000
  },
  
  // Test user credentials
  testUser: {
    email: process.env.NEXT_PUBLIC_TEST_USER_EMAIL || 'test@example.com',
    password: process.env.NEXT_PUBLIC_TEST_USER_PASSWORD || 'testpassword123',
    displayName: 'Test User',
    uid: 'test-user-123'
  },
  
  // Mock data settings
  mockData: {
    enabled: process.env.NEXT_PUBLIC_MOCK_API === 'true',
    gameweek: 1,
    teams: ['Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 'Manchester United'],
    players: ['Salah', 'Haaland', 'Kane', 'De Bruyne', 'Son']
  },
  
  // Test flags
  flags: {
    testMode: process.env.NEXT_PUBLIC_TEST_MODE === 'true',
    mockApi: process.env.NEXT_PUBLIC_MOCK_API === 'true',
    offlineMode: process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true'
  }
};

module.exports = testConfig; 