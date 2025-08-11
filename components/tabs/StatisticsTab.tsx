'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fplApi } from '@/lib/fpl-api';
import { dbUtils, db } from '@/lib/database';

export default function StatisticsTab() {
  const { managerFplId } = useAuth();
  const leagueId = fplApi.getLeagueId();

  // State for each tile
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rank, setRank] = useState<string | null>(null);
  const [weeklyTotal, setWeeklyTotal] = useState<number>(0);
  const [chipTotal, setChipTotal] = useState<number>(0);
  const [scoreStrikeTotal, setScoreStrikeTotal] = useState<number>(0);

  useEffect(() => {
    if (!managerFplId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchLeagueStanding(),
      fetchWeeklyWinnings(),
      fetchChipWinnings(),
      fetchScoreStrikeWinnings(),
    ])
      .catch((err) => setError(err.message || 'Failed to load performance data'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [managerFplId]);

  // 1. League Standing
  async function fetchLeagueStanding() {
    try {
      const standings = await fplApi.getLeagueStandings(leagueId);
      const user = standings.standings?.results?.find(
        (m: any) => Number(m.entry) === Number(managerFplId)
      );
      setRank(user ? `#${user.rank}` : 'N/A');
    } catch (err: any) {
      setRank('N/A');
    }
  }

  // 2. Weekly (Cumulative Winnings)
  async function fetchWeeklyWinnings() {
    try {
      // Get all ScoreStrikeWinners for the user
      const allWinners = await db.scoreStrikeWinners.toArray();
      const userWinnings = allWinners.filter((w: any) => Number(w.manager_fplid) === Number(managerFplId));
      
      // Calculate total winnings (already accounts for splits since won_amount is the actual amount won)
      const total = userWinnings.reduce((sum: number, w: any) => sum + (w.won_amount || 0), 0);
      setWeeklyTotal(total);
    } catch (err: any) {
      setWeeklyTotal(0);
    }
  }

  // 3. Chips (Chip Winnings)
  async function fetchChipWinnings() {
    try {
      // Get admin config for chip payout amounts
      const adminConfig = await dbUtils.getLatestAdminConfig();
      const chipPayouts = adminConfig?.payoutStructure?.chipUsage || {};
      
      // Get chip winners from FPL API
      const chipWinners = await fplApi.getChipWinners();
      
      let totalWinnings = 0;
      
      // Calculate winnings for the logged-in user
      for (const [chipType, winners] of Object.entries(chipWinners)) {
        const chipPayout = chipPayouts[chipType] || 0;
        
        // Find wins by this user for this chip type
        const userWins = winners.filter((winner: any) => 
          Number(winner.managerId) === Number(managerFplId)
        );
        
        // Calculate winnings for this chip type
        if (userWins.length > 0) {
          // For each gameweek where user won this chip, they get the full payout
          // (ties are handled by giving each winner the full amount)
          totalWinnings += userWins.length * chipPayout;
        }
      }
      
      setChipTotal(totalWinnings);
    } catch (err: any) {
      console.error('Error fetching chip winnings:', err);
      setChipTotal(0);
    }
  }

  // 4. Score and Strike
  async function fetchScoreStrikeWinnings() {
    try {
      // Get all ScoreStrikeWinners for this user
      const allWinners = await db.scoreStrikeWinners.toArray();
      const userWinnings = allWinners.filter((w: any) => Number(w.manager_fplid) === Number(managerFplId));
      
      // Calculate total winnings (already accounts for splits since won_amount is the actual amount won)
      const total = userWinnings.reduce((sum: number, w: any) => sum + (w.won_amount || 0), 0);
      setScoreStrikeTotal(total);
    } catch (err: any) {
      setScoreStrikeTotal(0);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Section - Mobile Responsive */}
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-extrabold mb-2 sm:mb-3 bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent drop-shadow-md">
          🏅 My Performance
        </h2>
        <div className="text-sm sm:text-base lg:text-lg text-gray-600 font-medium">
          🕒 Last refresh: {new Date().toLocaleString()}
        </div>
      </div>
      
      {/* Error Display - Mobile Responsive */}
      {error && (
        <div className="text-center text-red-600 font-semibold mb-4 sm:mb-6 text-sm sm:text-base px-4">
          {error}
        </div>
      )}
      
      {/* Stats Grid - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {/* League Standing Card */}
        <div className="stat-card flex flex-col items-center p-4 sm:p-6 lg:p-8 text-center">
          <div className="text-3xl sm:text-4xl lg:text-5xl mb-3 sm:mb-4 lg:mb-5">🏆</div>
          <div className="flex flex-col gap-1 sm:gap-2">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gradient">{loading ? '...' : rank}</span>
            <span className="text-xs sm:text-sm lg:text-base text-gray-600 font-semibold">League Standing</span>
          </div>
        </div>
        
        {/* Weekly Winnings Card */}
        <div className="stat-card flex flex-col items-center p-4 sm:p-6 lg:p-8 text-center">
          <div className="text-3xl sm:text-4xl lg:text-5xl mb-3 sm:mb-4 lg:mb-5">💰</div>
          <div className="flex flex-col gap-1 sm:gap-2">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gradient">{loading ? '...' : `$${weeklyTotal}`}</span>
            <span className="text-xs sm:text-sm lg:text-base text-gray-600 font-semibold">Weekly</span>
          </div>
        </div>
        
        {/* Chip Winnings Card */}
        <div className="stat-card flex flex-col items-center p-4 sm:p-6 lg:p-8 text-center">
          <div className="text-3xl sm:text-4xl lg:text-5xl mb-3 sm:mb-4 lg:mb-5">🎯</div>
          <div className="flex flex-col gap-1 sm:gap-2">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gradient">{loading ? '...' : `$${chipTotal}`}</span>
            <span className="text-xs sm:text-sm lg:text-base text-gray-600 font-semibold">Chips</span>
          </div>
        </div>
        
        {/* Score and Strike Card */}
        <div className="stat-card flex flex-col items-center p-4 sm:p-6 lg:p-8 text-center">
          <div className="text-3xl sm:text-4xl lg:text-5xl mb-3 sm:mb-4 lg:mb-5">⚽</div>
          <div className="flex flex-col gap-1 sm:gap-2">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gradient">{loading ? '...' : `$${scoreStrikeTotal}`}</span>
            <span className="text-xs sm:text-sm lg:text-base text-gray-600 font-semibold">Score and Strike</span>
          </div>
        </div>
      </div>
    </div>
  );
} 