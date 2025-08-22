'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dbUtils } from '@/lib/database';
import { fplApi } from '@/lib/fpl-api';
import { formatCurrencyWithCoin } from '@/lib/currency-utils';

interface HeadsUpResult {
  gameweek: number;
  managerScores: {
    [managerId: number]: {
      managerName: string;
      score: number;
    };
  };
  winner: {
    managerId: number;
    managerName: string;
    score: number;
  };
}

interface ManagerWinnings {
  managerId: number;
  managerName: string;
  cumulativeWinnings: number;
  weeklyResults: {
    gameweek: number;
    winnings: number;
    isWinner: boolean;
  }[];
}

export default function HeadsUpTab() {
  const { managerFplId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [headsUpConfig, setHeadsUpConfig] = useState<any>(null);
  const [weeklyWinners, setWeeklyWinners] = useState<any[]>([]);
  const [headsUpResults, setHeadsUpResults] = useState<HeadsUpResult[]>([]);
  const [managerWinnings, setManagerWinnings] = useState<ManagerWinnings[]>([]);

  useEffect(() => {
    if (managerFplId) {
      loadHeadsUpData();
    }
  }, [managerFplId]);

  const loadHeadsUpData = async () => {
    try {
      setLoading(true);
      
      // Load heads up configuration
      const config = await dbUtils.getHeadsUpConfig();
      if (!config) {
        setError('No heads up configuration found. Please contact an admin.');
        setLoading(false);
        return;
      }
      setHeadsUpConfig(config);

      // Load weekly winners data for all gameweeks
      const allWeeklyWinners = await dbUtils.getAllWeeklyWinners();
      setWeeklyWinners(allWeeklyWinners);

      // Process heads up results
      const results = processHeadsUpResults(config, allWeeklyWinners);
      setHeadsUpResults(results);

      // Calculate manager winnings
      const winnings = calculateManagerWinnings(config, results);
      setManagerWinnings(winnings);

    } catch (error) {
      console.error('Error loading heads up data:', error);
      setError('Failed to load heads up data');
    } finally {
      setLoading(false);
    }
  };

  const processHeadsUpResults = (config: any, weeklyWinners: any[]): HeadsUpResult[] => {
    const results: HeadsUpResult[] = [];
    
    // Group weekly winners by gameweek
    const gameweekGroups = weeklyWinners.reduce((groups, winner: any) => {
      if (!groups[winner.gameweek]) {
        groups[winner.gameweek] = [];
      }
      groups[winner.gameweek].push(winner);
      return groups;
    }, {} as { [gameweek: number]: any[] });

    // Process each gameweek
    Object.keys(gameweekGroups).forEach(gameweekStr => {
      const gameweek = parseInt(gameweekStr);
      const gameweekWinners = gameweekGroups[gameweek];
      
      // Filter only managers in heads up config
      const headsUpManagers = gameweekWinners.filter((winner: any) => 
        config.managers.includes(winner.managerFplId)
      );

      if (headsUpManagers.length > 0) {
        // Find winner (highest score)
        const winner = headsUpManagers.reduce((max: any, current: any) => 
          current.managerScore > max.managerScore ? current : max
        );

        // Create manager scores object
        const managerScores: { [managerId: number]: { managerName: string; score: number } } = {};
        headsUpManagers.forEach((manager: any) => {
          managerScores[manager.managerFplId] = {
            managerName: manager.managerName,
            score: manager.managerScore
          };
        });

        results.push({
          gameweek,
          managerScores,
          winner: {
            managerId: winner.managerFplId,
            managerName: winner.managerName,
            score: winner.managerScore
          }
        });
      }
    });

    return results.sort((a, b) => a.gameweek - b.gameweek);
  };

  const calculateManagerWinnings = (config: any, results: HeadsUpResult[]): ManagerWinnings[] => {
    const winningsMap = new Map<number, ManagerWinnings>();

    // Initialize all managers
    config.managers.forEach((managerId: number) => {
      winningsMap.set(managerId, {
        managerId,
        managerName: '', // Will be filled from results
        cumulativeWinnings: 0,
        weeklyResults: []
      });
    });

    // Process each gameweek result
    results.forEach(result => {
      const entryAmount = config.entryAmount;
      const participants = Object.keys(result.managerScores).length;
      const winnerWinnings = (participants - 1) * entryAmount; // Winner gets entry from all other participants
      const loserLoss = entryAmount; // Each loser loses their entry amount

      // Update winner
      const winner = winningsMap.get(result.winner.managerId);
      if (winner) {
        winner.managerName = result.winner.managerName;
        winner.cumulativeWinnings += winnerWinnings;
        winner.weeklyResults.push({
          gameweek: result.gameweek,
          winnings: winnerWinnings,
          isWinner: true
        });
      }

      // Update losers
      Object.keys(result.managerScores).forEach(managerIdStr => {
        const managerId = parseInt(managerIdStr);
        if (managerId !== result.winner.managerId) {
          const manager = winningsMap.get(managerId);
          if (manager) {
            manager.managerName = result.managerScores[managerId].managerName;
            manager.cumulativeWinnings -= loserLoss;
            manager.weeklyResults.push({
              gameweek: result.gameweek,
              winnings: -loserLoss,
              isWinner: false
            });
          }
        }
      });
    });

    return Array.from(winningsMap.values());
  };

  // Check if current user should see this tab
  if (!headsUpConfig || !headsUpConfig.managers.includes(managerFplId)) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-xl mb-4">🥊</div>
        <p className="text-lg font-semibold text-gray-600">Heads Up Games</p>
        <p className="text-sm text-gray-500 mt-2">You are not participating in heads up games</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading heads up data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-xl mb-4">⚠️</div>
        <p className="text-lg font-semibold text-red-600">Error</p>
        <p className="text-sm text-gray-500 mt-2">{error}</p>
        <button
          onClick={loadHeadsUpData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🥊 Heads Up Games</h1>
      </div>

      {/* Manager Winnings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {managerWinnings.map((manager) => (
          <div
            key={manager.managerId}
            className={`p-4 rounded-lg border-2 ${
              manager.cumulativeWinnings >= 0
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="text-center">
              <h3 className="font-semibold text-gray-800 mb-2">{manager.managerName}</h3>
              <div
                className={`text-2xl font-bold ${
                  manager.cumulativeWinnings >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {manager.cumulativeWinnings >= 0 ? '+' : ''}
                {formatCurrencyWithCoin(manager.cumulativeWinnings)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {manager.weeklyResults.filter(r => r.isWinner).length} win(s)
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Weekly Results</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GameWeek
                </th>
                {managerWinnings.map((manager) => (
                  <th key={manager.managerId} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {manager.managerName}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Winner
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {headsUpResults.map((result) => (
                <tr key={result.gameweek} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    GW {result.gameweek}
                  </td>
                  {managerWinnings.map((manager) => {
                    const score = result.managerScores[manager.managerId]?.score || 0;
                    const isWinner = result.winner.managerId === manager.managerId;
                    return (
                      <td key={manager.managerId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`font-medium ${isWinner ? 'text-green-600' : 'text-gray-700'}`}>
                          {score}
                        </span>
                        {isWinner && <span className="ml-2 text-green-500">👑</span>}
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-medium text-green-600">
                      {result.winner.managerName}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      ({result.winner.score} pts)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No Results State */}
      {headsUpResults.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 text-xl mb-4">📊</div>
          <p className="text-lg font-semibold text-gray-600">No Results Yet</p>
          <p className="text-sm text-gray-500 mt-2">Heads up results will appear here after the first gameweek</p>
        </div>
      )}


    </div>
  );
}
