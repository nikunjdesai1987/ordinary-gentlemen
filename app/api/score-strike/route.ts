import { NextRequest, NextResponse } from 'next/server';
import { dbUtils, ScoreStrikeEntry, ScoreStrikePot, ScoreStrikeWinner } from '@/lib/database';
import { fplApi } from '@/lib/fpl-api';

export async function POST(request: NextRequest) {
  try {
    const { action, gameweek, fixtureId } = await request.json();
    
    console.log('Score Strike API called with:', { action, gameweek, fixtureId });

    switch (action) {
      case 'test':
        return NextResponse.json({ 
          message: 'API is working', 
          timestamp: new Date().toISOString(),
          dbUtils: !!dbUtils,
          fplApi: !!fplApi
        });
      case 'determine_winners':
        if (!gameweek || !fixtureId) {
          return NextResponse.json({ error: 'Missing gameweek or fixtureId' }, { status: 400 });
        }
        return await determineWinners(gameweek, fixtureId);
      case 'update_pot':
        if (!gameweek) {
          return NextResponse.json({ error: 'Missing gameweek' }, { status: 400 });
        }
        return await updatePot(gameweek);
      case 'get_current_pot':
        return await getCurrentPot();
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Score Strike API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function determineWinners(gameweek: number, fixtureId: number) {
  try {
    console.log(`🔍 Determining winners for Gameweek ${gameweek}, Fixture ${fixtureId}`);

    // Check if database utilities are available
    if (!dbUtils) {
      console.error('❌ Database utilities not available');
      throw new Error('Database utilities not available');
    }

    // Get all entries for this fixture
    console.log('Fetching entries from database...');
    let entries;
    try {
      entries = await dbUtils.getScoreStrikeEntriesByFixture(fixtureId, gameweek);
      console.log(`Found ${entries.length} entries for fixture ${fixtureId}`);
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`);
    }

    if (entries.length === 0) {
      console.log('No entries found, returning empty result');
      return NextResponse.json({ 
        winners: [], 
        message: 'No entries found for this fixture' 
      });
    }

    // Get fixture result from FPL API
    console.log('Fetching fixtures from FPL API...');
    if (!fplApi) {
      console.error('❌ FPL API not available');
      throw new Error('FPL API not available');
    }
    
    let fixtures;
    try {
      fixtures = await fplApi.getFixtures(gameweek);
      console.log(`Retrieved ${fixtures.length} fixtures for gameweek ${gameweek}`);
    } catch (apiError) {
      console.error('❌ FPL API error:', apiError);
      throw new Error(`FPL API error: ${apiError instanceof Error ? apiError.message : 'Unknown API error'}`);
    }
    
    const fixture = fixtures.find((f: any) => f.id === fixtureId);
    console.log('Looking for fixture:', fixtureId, 'Found:', fixture ? 'Yes' : 'No');
    
    if (!fixture) {
      console.log('Available fixture IDs:', fixtures.map((f: any) => f.id));
      return NextResponse.json({ 
        error: 'Fixture not found',
        availableFixtures: fixtures.map((f: any) => ({ id: f.id, home: f.team_h, away: f.team_a }))
      }, { status: 404 });
    }

    // Get actual result
    const actualHomeScore = fixture.team_h_score || 0;
    const actualAwayScore = fixture.team_a_score || 0;
    const actualGoalscorers = extractGoalscorers(fixture);

    console.log(`Actual result: ${actualHomeScore}-${actualAwayScore}`);
    console.log(`Actual goalscorers:`, actualGoalscorers);

    // Determine winners
    const winners: ScoreStrikeWinner[] = [];
    
    for (const entry of entries) {
      const isWinner = checkWinner(entry, actualHomeScore, actualAwayScore, actualGoalscorers);
      
      if (isWinner) {
        const winner: ScoreStrikeWinner = {
          fplleague_id: entry.fplleague_id,
          gameweek: entry.gameweek,
          fixture_id: entry.fixture_id,
          manager_email: entry.manager_email,
          manager_fplid: entry.manager_fplid,
          manager_scrname: entry.manager_scrname,
          home_goal: entry.home_goal,
          away_goal: entry.away_goal,
          player_name: entry.player_name,
          won_amount: 0, // Will be calculated based on pot and number of winners
          won_at: new Date()
        };
        
        winners.push(winner);
        console.log(`Winner found: ${entry.manager_scrname} - ${entry.home_goal}-${entry.away_goal}, ${entry.player_name}`);
      }
    }

    // Save winners to database
    for (const winner of winners) {
      await dbUtils.saveScoreStrikeWinner(winner);
    }

    console.log(`✅ ${winners.length} winners determined and saved`);

    return NextResponse.json({ 
      winners: winners.map(w => ({
        manager: w.manager_scrname,
        prediction: `${w.home_goal}-${w.away_goal}`,
        goalscorer: w.player_name || 'None (0-0)'
      })),
      actualResult: `${actualHomeScore}-${actualAwayScore}`,
      actualGoalscorers: actualGoalscorers.length > 0 ? actualGoalscorers : ['None (0-0)']
    });

  } catch (error) {
    console.error('Error determining winners:', error);
    return NextResponse.json({ error: 'Failed to determine winners' }, { status: 500 });
  }
}

async function updatePot(gameweek: number) {
  try {
    console.log(`💰 Updating pot for Gameweek ${gameweek}`);

    const leagueId = 607394; // Ordinary Gentlemen League ID
    
    // Get current pot
    const currentPot = await dbUtils.getCurrentScoreStrikePot(leagueId);
    
    // Get admin config for starting amount
    const adminConfig = await dbUtils.getLatestAdminConfig();
    const startingAmount = adminConfig?.payoutStructure.scoreNStrike || 0;

    if (!currentPot) {
      // Create initial pot
      const newPot: ScoreStrikePot = {
        fplleague_id: leagueId,
        gameweek: gameweek,
        current_amount: startingAmount,
        starting_amount: startingAmount,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await dbUtils.saveScoreStrikePot(newPot);
      console.log(`✅ Created initial pot: £${startingAmount}`);
      
      return NextResponse.json({ 
        currentAmount: startingAmount,
        message: 'Initial pot created'
      });
    }

    // Check if there were winners in the previous gameweek
    const previousGameweek = gameweek - 1;
    const winners = await dbUtils.getScoreStrikeWinnersByGameweek(leagueId, previousGameweek);
    
    let newAmount: number;
    
    if (winners.length > 0) {
      // Pot resets to starting amount if there were winners
      newAmount = startingAmount;
      console.log(`🏆 Winners found in GW${previousGameweek}, pot resets to £${startingAmount}`);
    } else {
      // Pot rolls over and increases by starting amount
      newAmount = currentPot.current_amount + startingAmount;
      console.log(`🔄 No winners in GW${previousGameweek}, pot rolls over to £${newAmount}`);
    }

    // Update pot
    const updatedPot: ScoreStrikePot = {
      ...currentPot,
      gameweek: gameweek,
      current_amount: newAmount,
      updated_at: new Date()
    };

    await dbUtils.saveScoreStrikePot(updatedPot);
    console.log(`✅ Pot updated to £${newAmount}`);

    return NextResponse.json({ 
      currentAmount: newAmount,
      previousAmount: currentPot.current_amount,
      winnersCount: winners.length,
      message: winners.length > 0 ? 'Pot reset due to winners' : 'Pot rolled over'
    });

  } catch (error) {
    console.error('Error updating pot:', error);
    return NextResponse.json({ error: 'Failed to update pot' }, { status: 500 });
  }
}

async function getCurrentPot() {
  try {
    const leagueId = 607394;
    const pot = await dbUtils.getCurrentScoreStrikePot(leagueId);
    
    if (!pot) {
      // Return starting amount from admin config
      const adminConfig = await dbUtils.getLatestAdminConfig();
      const startingAmount = adminConfig?.payoutStructure.scoreNStrike || 0;
      
      return NextResponse.json({ 
        currentAmount: startingAmount,
        message: 'Using starting amount from admin config'
      });
    }

    return NextResponse.json({ 
      currentAmount: pot.current_amount,
      gameweek: pot.gameweek
    });

  } catch (error) {
    console.error('Error getting current pot:', error);
    return NextResponse.json({ error: 'Failed to get current pot' }, { status: 500 });
  }
}

function checkWinner(
  entry: ScoreStrikeEntry, 
  actualHomeScore: number, 
  actualAwayScore: number, 
  actualGoalscorers: string[]
): boolean {
  // Check if score prediction is correct
  const scoreCorrect = entry.home_goal === actualHomeScore && entry.away_goal === actualAwayScore;
  
  if (!scoreCorrect) {
    return false;
  }

  // Check goalscorer prediction
  if (actualHomeScore === 0 && actualAwayScore === 0) {
    // 0-0 result: goalscorer should be empty
    return entry.player_name === '';
  } else {
    // Goals were scored: check if predicted goalscorer matches any actual goalscorer
    if (entry.player_name === '') {
      return false; // Predicted no goalscorer but goals were scored
    }
    
    // Extract just the player name from the full display name
    const predictedPlayerName = extractPlayerName(entry.player_name);
    return actualGoalscorers.some(goalscorer => 
      extractPlayerName(goalscorer) === predictedPlayerName
    );
  }
}

function extractGoalscorers(fixture: any): string[] {
  const goalscorers: string[] = [];
  
  // Extract goalscorers from fixture stats
  const goalsScored = fixture.stats?.find((stat: any) => stat.identifier === 'goals_scored');
  
  if (goalsScored) {
    // Process home team goalscorers
    if (goalsScored.h) {
      for (const playerStat of goalsScored.h) {
        goalscorers.push(`Player ${playerStat.element}`); // We'll need to map to actual names
      }
    }

    // Process away team goalscorers
    if (goalsScored.a) {
      for (const playerStat of goalsScored.a) {
        goalscorers.push(`Player ${playerStat.element}`); // We'll need to map to actual names
      }
    }
  }

  return goalscorers;
}

function extractPlayerName(fullDisplayName: string): string {
  // Extract just the web_name from the full display name
  // Format: "First Last - Team POS"
  const match = fullDisplayName.match(/^[A-Za-z]+ ([A-Za-z]+) -/);
  return match ? match[1] : fullDisplayName;
} 