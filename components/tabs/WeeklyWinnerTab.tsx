'use client';

import { useState, useEffect } from 'react';
import { fplApi } from '@/lib/fpl-api';
import { dbUtils } from '@/lib/database';

interface WeeklyWinner {
  gameweek: number;
  points: number;
  winners: string;
  winnings: string;
}

export default function WeeklyWinnerTab() {
  const [winners, setWinners] = useState<WeeklyWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weeklyWinnerAmount, setWeeklyWinnerAmount] = useState<number>(0);

  useEffect(() => {
    fetchWeeklyWinners();
    fetchPayoutStructure();
  }, []);

  const fetchPayoutStructure = async () => {
    try {
      console.log('Fetching payout structure...');
      const adminConfig = await dbUtils.getLatestAdminConfig();
      if (adminConfig && adminConfig.payoutStructure) {
        setWeeklyWinnerAmount(adminConfig.payoutStructure.weeklyWinner);
        console.log('Weekly winner amount:', adminConfig.payoutStructure.weeklyWinner);
      }
    } catch (error) {
      console.error('Error fetching payout structure:', error);
      // Use default amount if unable to fetch
      setWeeklyWinnerAmount(50);
    }
  };

  const fetchWeeklyWinners = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching weekly winners...');
      
      // Get all gameweeks to check which ones are finished
      const gameweeks = await fplApi.getGameweeks();
      const finishedGameweeks = gameweeks.filter(gw => gw.finished && gw.data_checked);
      
      console.log('Finished gameweeks:', finishedGameweeks.map(gw => gw.id));
      
      const weeklyWinnersData: WeeklyWinner[] = [];
      
      // For each finished gameweek, get the highest scoring manager
      for (const gameweek of finishedGameweeks) {
        try {
          // Get league standings for this gameweek
          const leagueData = await fplApi.getLeagueStandings();
          const managers = leagueData.standings.results || [];
          
          if (managers.length > 0) {
            // Find the manager(s) with the highest event_total (gameweek score)
            const maxPoints = Math.max(...managers.map((m: any) => m.event_total));
            const topManagers = managers.filter((m: any) => m.event_total === maxPoints);
            
            const winnerNames = topManagers.map((m: any) => 
              `${m.player_first_name} ${m.player_last_name}`
            ).join(', ');
            
            // Calculate winnings based on payout structure
            let winnings: string;
            if (topManagers.length > 1) {
              // Split the pot if multiple winners
              const splitAmount = weeklyWinnerAmount / topManagers.length;
                            winnings = `$${splitAmount.toFixed(2)} each`;
            } else {
              winnings = `$${weeklyWinnerAmount.toFixed(2)}`;
            }
            
            weeklyWinnersData.push({
              gameweek: gameweek.id,
              points: maxPoints,
              winners: winnerNames,
              winnings: winnings
            });
          }
        } catch (error) {
          console.warn(`Failed to get data for GW ${gameweek.id}:`, error);
        }
      }
      
      // Sort by gameweek
      weeklyWinnersData.sort((a, b) => a.gameweek - b.gameweek);
      setWinners(weeklyWinnersData);
      
    } catch (err: any) {
      console.error('Error fetching weekly winners:', err);
      setError(err.message || 'Failed to load weekly winners');
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
          className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
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
        <div className="grid grid-cols-[80px_120px_1fr_120px] gap-4 p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-t-xl text-sm font-bold sticky top-0 z-10 shadow-lg">
          <span>GW</span>
          <span>Points</span>
          <span>Winner(s)</span>
          <span>Winnings</span>
        </div>
        
        {/* Empty state or results */}
        {winners.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500 text-xl mb-4">🏆</div>
            <p className="text-lg font-semibold text-gray-600">Weekly winners will appear here</p>
            <p className="text-sm text-gray-500 mt-2">Winners will be determined after each gameweek completion</p>
            <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200">
              <p className="text-sm text-primary-700 font-medium">
                🎯 Weekly winners will be updated after each gameweek completion
              </p>
            </div>
          </div>
        ) : (
          /* Winners rows */
          winners.map((winner, index) => (
            <div 
              key={winner.gameweek}
              className={`grid grid-cols-[80px_120px_1fr_120px] gap-4 p-3 items-center border-b border-gray-200 transition-all duration-300 hover:bg-gray-50 ${
                index === winners.length - 1 ? 'rounded-b-xl' : ''
              }`}
            >
              <span className="font-bold text-primary-600 text-sm">
                GW {winner.gameweek}
              </span>
              <span className="font-bold text-gray-800 text-sm text-center">
                {winner.points}
              </span>
              <span className="font-semibold text-gray-800 text-sm">
                {winner.winners}
              </span>
              <span className="font-bold text-green-600 text-sm text-center">
                {winner.winnings}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 