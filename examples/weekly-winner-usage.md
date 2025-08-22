# Weekly Winner System Usage Examples

## Overview
The new `weekly_winner` table tracks all managers' scores for each gameweek and automatically updates when new gameweeks begin.

## Table Structure
```typescript
interface WeeklyWinner {
  id?: number;           // Auto-increment primary key
  gameweek: number;      // FPL gameweek number (1-38)
  name: string;          // Gameweek name from FPL API
  managerName: string;   // Manager's full name
  managerFplId: number;  // Manager's FPL ID
  managerScore: number;  // Manager's score for this gameweek
  isCurrent: boolean;    // Whether this is the current gameweek
  createdAt: Date;       // When the record was created
  updatedAt: Date;       // When the record was last updated
}
```

## Basic Usage

### 1. Initialize Weekly Winners for a New Gameweek
```typescript
import { WeeklyWinnerManager } from '../lib/weekly-winner-utils';

// When a new gameweek starts, call this function
async function handleNewGameweek() {
  try {
    // Get FPL bootstrap data to find current gameweek
    const fplBootstrapData = await fetchFPLBootstrapData();
    
    // Get current league standings
    const leagueStandings = await fetchLeagueStandings(607394);
    
    // Check and update weekly winners
    const wasUpdated = await WeeklyWinnerManager.checkAndUpdateWeeklyWinners(
      fplBootstrapData, 
      leagueStandings
    );
    
    if (wasUpdated) {
      console.log('New gameweek weekly winners created!');
    }
  } catch (error) {
    console.error('Error handling new gameweek:', error);
  }
}
```

### 2. Update Manager Scores
```typescript
// Update scores when new data is available
async function updateScores() {
  try {
    const currentGameweek = 5; // Get from FPL API
    const leagueStandings = await fetchLeagueStandings(607394);
    
    // Update all manager scores for the current gameweek
    await WeeklyWinnerManager.updateAllManagerScores(
      currentGameweek, 
      leagueStandings
    );
  } catch (error) {
    console.error('Error updating scores:', error);
  }
}
```

### 3. Get Current Gameweek Winners
```typescript
// Get all managers for the current gameweek, sorted by score
async function getCurrentWinners() {
  try {
    const currentWinners = await WeeklyWinnerManager.getCurrentGameweekWinners();
    
    // currentWinners is sorted by score (highest first)
    const topScorer = currentWinners[0];
    console.log(`Top scorer: ${topScorer.managerName} with ${topScorer.managerScore} points`);
    
    return currentWinners;
  } catch (error) {
    console.error('Error getting current winners:', error);
    return [];
  }
}
```

### 4. Get Historical Gameweek Data
```typescript
// Get winners for a specific gameweek
async function getGameweekWinners(gameweek: number) {
  try {
    const winners = await WeeklyWinnerManager.getGameweekWinners(gameweek);
    return winners;
  } catch (error) {
    console.error(`Error getting GW${gameweek} winners:`, error);
    return [];
  }
}

// Get the winner of a specific gameweek
async function getGameweekWinner(gameweek: number) {
  try {
    const winner = await WeeklyWinnerManager.getGameweekWinner(gameweek);
    if (winner) {
      console.log(`GW${gameweek} Winner: ${winner.managerName} (${winner.managerScore} pts)`);
    }
    return winner;
  } catch (error) {
    console.error(`Error getting GW${gameweek} winner:`, error);
    return null;
  }
}
```

## Integration with FPL API

### FPL Bootstrap Endpoint
```typescript
// Fetch current gameweek info
async function getCurrentGameweek() {
  const response = await fetch('/api/fpl?endpoint=/bootstrap-static/');
  const data = await response.json();
  
  // Find the current gameweek
  const currentGameweek = data.events.find((event: any) => event.is_current);
  
  return {
    id: currentGameweek.id,
    name: currentGameweek.name,
    isCurrent: currentGameweek.is_current
  };
}
```

### League Standings Endpoint
```typescript
// Fetch league standings for current gameweek
async function getLeagueStandings(leagueId: number, gameweek: number) {
  const response = await fetch(`/api/fpl?endpoint=/leagues-classic/${leagueId}/standings/`);
  const data = await response.json();
  
  // Filter for current gameweek data
  return data.standings.results.map((standing: any) => ({
    entry: standing.entry,
    player_name: standing.player_name,
    event_total: standing.event_total, // This is the manager's score
    total: standing.total
  }));
}
```

## Automatic Updates

### Periodic Check Function
```typescript
// Set up periodic checks for new gameweeks
function setupWeeklyWinnerChecks() {
  // Check every hour
  setInterval(async () => {
    try {
      const fplData = await getCurrentGameweek();
      const standings = await getLeagueStandings(607394, fplData.id);
      
      await WeeklyWinnerManager.checkAndUpdateWeeklyWinners(fplData, standings);
    } catch (error) {
      console.error('Periodic check failed:', error);
    }
  }, 60 * 60 * 1000); // 1 hour
}

// Start the periodic checks
setupWeeklyWinnerChecks();
```

### Manual Trigger
```typescript
// Manually trigger weekly winner updates (e.g., from admin panel)
async function manualUpdate() {
  try {
    const fplData = await getCurrentGameweek();
    const standings = await getLeagueStandings(607394, fplData.id);
    
    const wasUpdated = await WeeklyWinnerManager.checkAndUpdateWeeklyWinners(
      fplData, 
      standings
    );
    
    if (wasUpdated) {
      alert('Weekly winners updated successfully!');
    } else {
      alert('No updates needed at this time.');
    }
  } catch (error) {
    alert('Error updating weekly winners: ' + error.message);
  }
}
```

## Database Queries

### Get All Current Gameweek Entries
```typescript
import { db } from '../lib/database';

// Get all managers for the current gameweek
const currentEntries = await db.weeklyWinners
  .where('isCurrent')
  .equals(true)
  .toArray();

// Sort by score (highest first)
const sortedEntries = currentEntries.sort((a, b) => b.managerScore - a.managerScore);
```

### Get Manager History
```typescript
// Get a specific manager's performance across all gameweeks
const managerHistory = await db.weeklyWinners
  .where('managerFplId')
  .equals(managerFplId)
  .toArray();

// Sort by gameweek
const sortedHistory = managerHistory.sort((a, b) => a.gameweek - b.gameweek);
```

## Error Handling

### Graceful Degradation
```typescript
async function safeWeeklyWinnerUpdate() {
  try {
    // Attempt to update weekly winners
    await WeeklyWinnerManager.checkAndUpdateWeeklyWinners(fplData, standings);
  } catch (error) {
    console.error('Weekly winner update failed:', error);
    
    // Fallback: try to get existing data
    try {
      const existingWinners = await WeeklyWinnerManager.getCurrentGameweekWinners();
      if (existingWinners.length > 0) {
        console.log('Using existing weekly winner data');
        return existingWinners;
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }
    
    // Return empty array as last resort
    return [];
  }
}
```

This system automatically tracks all managers' scores for each gameweek and provides easy access to current and historical performance data.
