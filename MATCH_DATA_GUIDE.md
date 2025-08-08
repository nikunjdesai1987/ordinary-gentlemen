# Match Data Fetching and Storage Guide

## Overview

This guide explains how to fetch, process, and store match data from the Fantasy Premier League (FPL) API, including scores, goalscorers, and kickoff times for specific gameweeks.

## Features

- **Fetch Match Data**: Retrieve fixtures, scores, and goalscorers for any gameweek
- **Process Data**: Extract and map player IDs to names, team IDs to team names
- **Store Data**: Save match results and goalscorers to local database
- **Retrieve Data**: Get stored match data for analysis and display

## API Endpoints

### 1. Fetch Match Data (Process Only)
```
GET /api/fpl?action=fetchMatchData&gameweek={gameweek}
```

**Parameters:**
- `gameweek` (required): Gameweek number (1-38)

**Response:**
```json
{
  "success": true,
  "gameweek": 1,
  "matchCount": 10,
  "matchData": [
    {
      "matchResult": {
        "fixtureId": 1,
        "gameweek": 1,
        "homeTeamId": 3,
        "awayTeamId": 7,
        "homeTeamName": "Arsenal",
        "awayTeamName": "Aston Villa",
        "homeScore": 2,
        "awayScore": 1,
        "kickoffTime": "2024-08-17T14:00:00Z",
        "finished": true,
        "started": true,
        "lastUpdated": "2024-08-17T16:30:00Z"
      },
      "goalscorers": [
        {
          "playerId": 123,
          "playerName": "Saka",
          "teamId": 3,
          "teamName": "Arsenal",
          "goals": 1,
          "isHomeTeam": true
        }
      ]
    }
  ]
}
```

### 2. Complete Workflow (Fetch, Process & Store)
```
GET /api/fpl?action=fetchProcessAndStore&gameweek={gameweek}
```

**Parameters:**
- `gameweek` (required): Gameweek number (1-38)

**Response:**
```json
{
  "success": true,
  "gameweek": 1,
  "message": "Match data fetched, processed, and stored successfully"
}
```

### 3. Get Stored Match Data
```
GET /api/fpl?action=getMatchData&gameweek={gameweek}
```

**Parameters:**
- `gameweek` (required): Gameweek number (1-38)

**Response:**
```json
{
  "success": true,
  "gameweek": 1,
  "matchCount": 10,
  "matchData": [
    {
      "matchResult": {
        "id": 1,
        "fixtureId": 1,
        "gameweek": 1,
        "homeTeamId": 3,
        "awayTeamId": 7,
        "homeTeamName": "Arsenal",
        "awayTeamName": "Aston Villa",
        "homeScore": 2,
        "awayScore": 1,
        "kickoffTime": "2024-08-17T14:00:00Z",
        "finished": true,
        "started": true,
        "lastUpdated": "2024-08-17T16:30:00Z"
      },
      "goalscorers": [
        {
          "id": 1,
          "matchResultId": 1,
          "playerId": 123,
          "playerName": "Saka",
          "teamId": 3,
          "teamName": "Arsenal",
          "goals": 1,
          "isHomeTeam": true
        }
      ]
    }
  ]
}
```

## Database Schema

### MatchResult Table
```typescript
interface MatchResult {
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
```

### Goalscorer Table
```typescript
interface Goalscorer {
  id?: number;
  matchResultId: number;
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  goals: number;
  isHomeTeam: boolean;
}
```

## Usage Examples

### 1. Using the FPL API Service Directly

```typescript
import { fplApi } from '../lib/fpl-api';

// Fetch and process match data for gameweek 1
const matchData = await fplApi.fetchAndStoreMatchData(1);

// Store the data in database
await fplApi.storeMatchData(matchData);

// Complete workflow (fetch, process, and store)
await fplApi.fetchProcessAndStoreMatchData(1);

// Get stored match data
const storedData = await fplApi.getMatchDataForGameweek(1);
```

### 2. Using Database Utilities Directly

```typescript
import { dbUtils } from '../lib/database';

// Save individual match result
const matchResult: MatchResult = {
  fixtureId: 1,
  gameweek: 1,
  homeTeamId: 3,
  awayTeamId: 7,
  homeTeamName: "Arsenal",
  awayTeamName: "Aston Villa",
  homeScore: 2,
  awayScore: 1,
  kickoffTime: "2024-08-17T14:00:00Z",
  finished: true,
  started: true,
  lastUpdated: new Date()
};

const matchResultId = await dbUtils.saveMatchResult(matchResult);

// Save goalscorer
const goalscorer: Goalscorer = {
  matchResultId,
  playerId: 123,
  playerName: "Saka",
  teamId: 3,
  teamName: "Arsenal",
  goals: 1,
  isHomeTeam: true
};

await dbUtils.saveGoalscorer(goalscorer);

// Get match results by gameweek
const matchResults = await dbUtils.getMatchResultsByGameweek(1);

// Get goalscorers for a specific match
const goalscorers = await dbUtils.getGoalscorersByMatch(matchResultId);
```

### 3. Frontend Integration

```typescript
// Fetch match data for display
const fetchMatchData = async (gameweek: number) => {
  try {
    const response = await fetch(`/api/fpl?action=getMatchData&gameweek=${gameweek}`);
    const data = await response.json();
    
    if (data.success) {
      return data.matchData;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error fetching match data:', error);
    return [];
  }
};

// Store match data
const storeMatchData = async (gameweek: number) => {
  try {
    const response = await fetch(`/api/fpl?action=fetchProcessAndStore&gameweek=${gameweek}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('Match data stored successfully');
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error storing match data:', error);
  }
};
```

## Data Processing Details

### 1. Fixture Data Extraction
The system extracts the following information from FPL fixtures:
- **Scores**: `team_h_score` and `team_a_score`
- **Teams**: Maps team IDs to team names using bootstrap data
- **Kickoff Times**: `kickoff_time` field
- **Match Status**: `finished`, `started`, `provisional_start_time`

### 2. Goalscorer Data Extraction
Goalscorer information is extracted from the `stats` array:
- **Player IDs**: `element` field in goals_scored stats
- **Player Names**: Mapped from bootstrap data using player IDs
- **Goal Counts**: `value` field in goals_scored stats
- **Team Information**: Determined from fixture team data

### 3. Data Mapping
The system uses bootstrap data to map:
- **Team IDs → Team Names**: Using the teams array
- **Player IDs → Player Names**: Using the elements array
- **Position Information**: Available in element_types array

## Error Handling

The system includes comprehensive error handling:

1. **API Errors**: Network failures, rate limiting, invalid responses
2. **Data Processing Errors**: Missing or malformed fixture data
3. **Database Errors**: Storage failures, constraint violations
4. **Validation Errors**: Invalid gameweek numbers, missing required fields

## Performance Considerations

1. **Caching**: FPL API responses are cached for 5 minutes
2. **Batch Processing**: Multiple fixtures are processed in sequence
3. **Database Indexing**: Composite indexes on gameweek and fixtureId
4. **Error Recovery**: Failed operations are logged and can be retried

## Testing

Use the Test Environment component to test the functionality:

1. **Navigate to Test Environment**: Access the test interface
2. **Set Gameweek**: Choose the gameweek to test
3. **Run Tests**:
   - **Fetch Match Data**: Test data fetching and processing
   - **Complete Workflow**: Test the full fetch-process-store cycle
   - **Get Stored Data**: Test retrieving stored data

## Troubleshooting

### Common Issues

1. **No fixtures found**: Check if the gameweek is valid and has started
2. **Missing player names**: Ensure bootstrap data is up to date
3. **Database errors**: Check database version and schema
4. **API rate limiting**: Wait and retry the request

### Debug Information

Enable debug logging to see detailed information:
```typescript
// In browser console
localStorage.setItem('debug', 'fpl-api');
```

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live match updates
2. **Historical Data**: Bulk import of historical match data
3. **Advanced Statistics**: Additional match statistics and analytics
4. **Data Export**: Export match data in various formats
5. **Scheduled Updates**: Automated data fetching at regular intervals 