'use client';

import { useState, useEffect } from 'react';
import { dbUtils } from '@/lib/database';

interface WeeklyWinner {
  id?: number;
  gameweek: number;
  name: string;
  managerName: string;
  managerFplId: number;
  managerScore: number;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export default function WeeklyWinnerTab() {
  const [winners, setWinners] = useState<WeeklyWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeeklyWinners();
  }, []);

  const fetchWeeklyWinners = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching weekly winners from database...');
      
      // Get all weekly winners from the database
      const allWeeklyWinners = await dbUtils.getAllWeeklyWinners();
      
      if (allWeeklyWinners.length === 0) {
        console.log('No weekly winners found in database');
        setWinners([]);
        return;
      }

      console.log(`Found ${allWeeklyWinners.length} weekly winner entries in database`);
      
      // Group winners by gameweek and find the highest scorer for each
      const gameweekGroups = allWeeklyWinners.reduce((groups, winner) => {
        if (!groups[winner.gameweek]) {
          groups[winner.gameweek] = [];
        }
        groups[winner.gameweek].push(winner);
        return groups;
      }, {} as { [gameweek: number]: WeeklyWinner[] });

      // Process each gameweek to find the winner(s)
      const processedWinners: WeeklyWinner[] = [];
      
      Object.keys(gameweekGroups).forEach(gameweekStr => {
        const gameweek = parseInt(gameweekStr);
        const gameweekWinners = gameweekGroups[gameweek];
        
        if (gameweekWinners.length > 0) {
          // Find the highest scorer(s) for this gameweek
          const maxScore = Math.max(...gameweekWinners.map(w => w.managerScore));
          const topScorers = gameweekWinners.filter(w => w.managerScore === maxScore);
          
          // Create a combined entry for this gameweek
          const winnerNames = topScorers.map(w => w.managerName).join(', ');
          
          processedWinners.push({
            gameweek,
            name: gameweekWinners[0].name, // Use the first entry's name
            managerName: winnerNames,
            managerFplId: topScorers[0].managerFplId, // Use first winner's ID
            managerScore: maxScore,
            isCurrent: topScorers.some(w => w.isCurrent),
            createdAt: gameweekWinners[0].createdAt,
            updatedAt: gameweekWinners[0].updatedAt
          });
        }
      });
      
              // Sort by gameweek (ascending - 1, 2, 3... 38)
        processedWinners.sort((a, b) => a.gameweek - b.gameweek);
      setWinners(processedWinners);
      
      console.log(`Processed ${processedWinners.length} gameweek winners`);
      
    } catch (err: any) {
      console.error('Error fetching weekly winners from database:', err);
      setError(err.message || 'Failed to load weekly winners from database');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin-slow w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-lg font-semibold text-gray-700">Loading weekly winners...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-xl mb-4">⚠️</div>
        <p className="text-lg font-semibold text-red-600">{error}</p>
        <p className="text-sm text-gray-600 mt-2">Please try refreshing the page</p>
        <button 
          onClick={fetchWeeklyWinners}
          className="mt-4 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-contrast)] rounded-lg hover:opacity-80 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col gap-0.5 max-h-[calc(100vh-300px)] overflow-y-auto border border-gray-200 rounded-xl">
        {/* Header */}
        <div className="grid grid-cols-[100px_1fr_120px] gap-4 p-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-info)] text-[var(--color-primary-contrast)] rounded-t-xl text-sm font-bold sticky top-0 z-10 shadow-lg">
          <span>GameWeek</span>
          <span>Winner(s)</span>
          <span>Points</span>
        </div>
        
        {/* Empty state or results */}
        {winners.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500 text-xl mb-4">🏆</div>
            <p className="text-lg font-semibold text-gray-600">No weekly winners found</p>
            <p className="text-sm text-gray-500 mt-2">
              {error ? 'Error loading data from database' : 'Weekly winners data has not been imported yet'}
            </p>
            <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200">
              <p className="text-sm text-primary-700 font-medium">
                💡 Use the Weekly Utility tab in Admin to import weekly winners data from FPL API
              </p>
            </div>
            <button 
              onClick={fetchWeeklyWinners}
              className="mt-4 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-contrast)] rounded-lg hover:opacity-80 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        ) : (
          /* Winners rows */
          winners.map((winner, index) => (
            <div 
              key={winner.gameweek}
              className={`grid grid-cols-[100px_1fr_120px] gap-4 p-3 items-center border-b border-gray-200 transition-all duration-300 hover:bg-gray-50 ${
                index === winners.length - 1 ? 'rounded-b-xl' : ''
              }`}
            >
              <span className="font-bold text-primary-600 text-sm">
                GW {winner.gameweek}
              </span>
              <span className="font-semibold text-gray-800 text-sm">
                {winner.managerName}
              </span>
              <span className="font-bold text-gray-800 text-sm">
                {winner.managerScore}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 