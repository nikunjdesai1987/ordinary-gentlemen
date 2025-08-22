import React, { useState, useEffect } from 'react';

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

interface MatchData {
  matchResult: MatchResult;
  goalscorers: Goalscorer[];
}

interface MatchDataDisplayProps {
  gameweek: number;
}

export default function MatchDataDisplay({ gameweek }: MatchDataDisplayProps) {
  const [matchData, setMatchData] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMatchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/fpl?action=getMatchData&gameweek=${gameweek}`);
      const data = await response.json();
      
      if (data.success) {
        setMatchData(data.matchData);
        setLastUpdated(new Date());
      } else {
        setError(data.error || 'Failed to fetch match data');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching match data');
    } finally {
      setLoading(false);
    }
  };

  const storeMatchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/fpl?action=fetchProcessAndStore&gameweek=${gameweek}`);
      const data = await response.json();
      
      if (data.success) {
        // Refresh the data after storing
        await fetchMatchData();
      } else {
        setError(data.error || 'Failed to store match data');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while storing match data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchData();
  }, [gameweek]);

  const formatKickoffTime = (kickoffTime: string) => {
    return new Date(kickoffTime).toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMatchStatus = (match: MatchResult) => {
    if (match.finished) return 'FT';
    if (match.started) return 'LIVE';
    return 'SCHEDULED';
  };

  const getStatusColor = (match: MatchResult) => {
    if (match.finished) return 'bg-gray-500';
    if (match.started) return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gameweek {gameweek} Match Data</h2>
        <div className="space-x-2">
          <button
            onClick={fetchMatchData}
            disabled={loading}
            className="px-4 py-2 bg-[var(--color-info)] text-[var(--color-primary-contrast)] rounded hover:opacity-80 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={storeMatchData}
            disabled={loading}
            className="px-4 py-2 bg-[var(--color-success)] text-[var(--color-primary-contrast)] rounded hover:opacity-80 disabled:opacity-50"
          >
            {loading ? 'Storing...' : 'Fetch & Store'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {lastUpdated && (
        <div className="text-sm text-gray-600">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}

      {matchData.length === 0 && !loading && !error && (
        <div className="text-center py-8 text-gray-500">
          No match data available for Gameweek {gameweek}
        </div>
      )}

      <div className="space-y-4">
        {matchData.map((match) => (
          <div key={match.matchResult.fixtureId} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 text-xs text-[var(--color-primary-contrast)] rounded ${getStatusColor(match.matchResult)}`}>
                  {getMatchStatus(match.matchResult)}
                </span>
                <span className="text-sm text-gray-600">
                  {formatKickoffTime(match.matchResult.kickoffTime)}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Fixture #{match.matchResult.fixtureId}
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4 mb-4">
              <div className="text-right">
                <div className="font-semibold text-lg">{match.matchResult.homeTeamName}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {match.matchResult.homeScore} - {match.matchResult.awayScore}
                </div>
              </div>
              <div className="text-left">
                <div className="font-semibold text-lg">{match.matchResult.awayTeamName}</div>
              </div>
            </div>

            {match.goalscorers.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Goalscorers:</h4>
                <div className="space-y-1">
                  {match.goalscorers.map((goalscorer, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{goalscorer.playerName}</span>
                        <span className="text-gray-500">({goalscorer.teamName})</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-600">{goalscorer.goals}</span>
                        <span className="text-xs text-gray-400">
                          {goalscorer.goals === 1 ? 'goal' : 'goals'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {match.goalscorers.length === 0 && match.matchResult.finished && (
              <div className="border-t pt-4">
                <div className="text-sm text-gray-500 text-center">
                  No goalscorer data available
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <div className="mt-2 text-gray-600">Loading match data...</div>
        </div>
      )}
    </div>
  );
} 