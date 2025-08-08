'use client';

import { useState, useEffect } from 'react';
import { fplApi } from '@/lib/fpl-api';

interface LeagueStanding {
  id: number;
  entry_name: string;
  player_first_name: string;
  player_last_name: string;
  total: number;
  event_total: number;
  rank: number;
  last_rank: number;
  rank_sort: number;
  overall_rank: number;
  bank: number;
  value: number;
  event_transfers: number;
  event_transfers_cost: number;
  points_on_bench: number;
}

export default function StandingsTab() {
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching league standings...');
        const data = await fplApi.getLeagueStandings();
        console.log('League data received:', data);
        
        if (data && data.standings && data.standings.results) {
          setStandings(data.standings.results);
        } else {
          console.error('Invalid data structure:', data);
          setError('Invalid data structure received from API');
        }
      } catch (err: any) {
        console.error('Error fetching standings:', err);
        setError(err.message || 'Failed to load league standings');
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin-slow w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-lg font-semibold text-gray-700">Loading league standings...</p>
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
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-xl mb-4">📊</div>
        <p className="text-lg font-semibold text-gray-600">League standings will populate after Game Week 1</p>
        <p className="text-sm text-gray-500 mt-2">Once the first gameweek is completed, you'll see the full league table here</p>
        <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200">
          <p className="text-sm text-primary-700 font-medium">
            🎯 The Ordinary Gentlemen League is ready to begin!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">
          🏆 League Standing
        </h2>
        <div className="text-lg text-gray-600 font-medium">
          Fantasy Premier League Table - Ordinary Gentlemen
        </div>
      </div>
      
      <div className="flex flex-col gap-0.5 max-h-[calc(100vh-300px)] overflow-y-auto border border-gray-200 rounded-xl">
        {/* Header */}
        <div className="grid grid-cols-[60px_1fr_150px_80px_80px_80px_80px_60px] gap-2 p-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-t-xl text-sm font-bold sticky top-0 z-10 shadow-lg">
          <span>Rank</span>
          <span>Manager Name</span>
          <span>Team Name</span>
          <span className="text-center">GW Pts</span>
          <span className="text-center">Total Pts</span>
          <span className="text-center">Transfers</span>
          <span className="text-center">Value</span>
          <span className="text-center">Bank</span>
        </div>
        
        {/* Rows */}
        {standings.map((standing, index) => (
          <div 
            key={standing.id}
            className={`grid grid-cols-[60px_1fr_150px_80px_80px_80px_80px_60px] gap-2 p-2.5 items-center border-b border-gray-200 transition-all duration-300 hover:bg-gray-50 ${
              index === standings.length - 1 ? 'rounded-b-xl' : ''
            }`}
          >
            <span className="font-bold text-primary-600 text-sm">
              {standing.rank}
            </span>
            <span className="font-semibold text-gray-800 text-sm">
              {`${standing.player_first_name} ${standing.player_last_name}`}
            </span>
            <span className="font-semibold text-gray-800 text-sm">
              {standing.entry_name}
            </span>
            <span className="font-bold text-primary-600 text-center text-sm">
              {standing.event_total}
            </span>
            <span className="font-bold text-primary-600 text-center text-sm">
              {standing.total.toLocaleString()}
            </span>
            <span className="font-semibold text-gray-600 text-center text-sm">
              {standing.event_transfers}
            </span>
            <span className="font-semibold text-gray-600 text-center text-sm">
              £{(standing.value / 10).toFixed(1)}M
            </span>
            <span className="font-semibold text-gray-600 text-center text-sm">
              £{(standing.bank / 10).toFixed(1)}M
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 