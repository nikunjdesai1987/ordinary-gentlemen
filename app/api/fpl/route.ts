import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  const gameweek = searchParams.get('gameweek');
  const action = searchParams.get('action');

  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint parameter is required' }, { status: 400 });
  }

  try {
    // Handle match data operations
    if (action === 'fetchMatchData' && gameweek) {
      const { fplApi } = await import('../../../lib/fpl-api');
      const gameweekNumber = parseInt(gameweek);
      
      if (isNaN(gameweekNumber)) {
        return NextResponse.json({ error: 'Invalid gameweek number' }, { status: 400 });
      }

      const matchData = await fplApi.fetchAndStoreMatchData(gameweekNumber);
      return NextResponse.json({ 
        success: true, 
        gameweek: gameweekNumber, 
        matchCount: matchData.length,
        matchData 
      });
    }

    // Handle complete workflow
    if (action === 'fetchProcessAndStore' && gameweek) {
      const { fplApi } = await import('../../../lib/fpl-api');
      const gameweekNumber = parseInt(gameweek);
      
      if (isNaN(gameweekNumber)) {
        return NextResponse.json({ error: 'Invalid gameweek number' }, { status: 400 });
      }

      await fplApi.fetchProcessAndStoreMatchData(gameweekNumber);
      return NextResponse.json({ 
        success: true, 
        gameweek: gameweekNumber,
        message: 'Match data fetched, processed, and stored successfully'
      });
    }

    // Handle getting stored match data
    if (action === 'getMatchData' && gameweek) {
      const { fplApi } = await import('../../../lib/fpl-api');
      const gameweekNumber = parseInt(gameweek);
      
      if (isNaN(gameweekNumber)) {
        return NextResponse.json({ error: 'Invalid gameweek number' }, { status: 400 });
      }

      const matchData = await fplApi.getMatchDataForGameweek(gameweekNumber);
      return NextResponse.json({ 
        success: true, 
        gameweek: gameweekNumber,
        matchCount: matchData.length,
        matchData 
      });
    }

    // Default FPL API proxy
    const fplApiUrl = `https://fantasy.premierleague.com/api${endpoint}`;
    console.log('FPL API URL:', fplApiUrl); // Debug logging
    const response = await axios.get(fplApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FPL-App/1.0)',
      },
      timeout: 10000
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('FPL API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from FPL API', details: error.message },
      { status: 500 }
    );
  }
} 