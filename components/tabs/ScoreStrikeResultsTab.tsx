'use client';

import { useState, useEffect } from 'react';
import { dbUtils } from '@/lib/database';
import { fplApi } from '@/lib/fpl-api';

interface ScoreStrikeResult {
  gameweek: number;
  fixture: string;
  finalScore: string;
  scorers: string;
  winners: string;
  submittedScore: string;
  submittedScorer: string;
  winningsPot: string;
}

export default function ScoreStrikeResultsTab() {
  const [results, setResults] = useState<ScoreStrikeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScoreStrikeResults();
  }, []);

  const fetchScoreStrikeResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching Score and Strike results...');
      
      // Get all gameweeks to check which ones are finished
      const gameweeks = await fplApi.getGameweeks();
      const finishedGameweeks = gameweeks.filter(gw => gw.finished && gw.data_checked);
      
      console.log('Finished gameweeks:', finishedGameweeks.map(gw => gw.id));
      
      const resultsData: ScoreStrikeResult[] = [];
      const leagueId = fplApi.getLeagueId();
      
      // For each finished gameweek, get the Score and Strike results
      for (const gameweek of finishedGameweeks) {
        try {
          // Get Score and Strike winners for this gameweek with pot distribution
          const potDistribution = await dbUtils.getScoreStrikeWinnersByGameweekWithPotDistribution(leagueId, gameweek.id);
          
          if (potDistribution.winners.length > 0) {
            // Group winners by fixture
            const winnersByFixture = potDistribution.winners.reduce((acc: any, winner: any) => {
              if (!acc[winner.fixture_id]) {
                acc[winner.fixture_id] = [];
              }
              acc[winner.fixture_id].push(winner);
              return acc;
            }, {});
            
            // Create result entries for each fixture
            for (const [fixtureId, winners] of Object.entries(winnersByFixture)) {
              const fixtureWinners = winners as any[];
              const winnerNames = fixtureWinners.map((w: any) => w.manager_scrname).join(', ');
              
              // Calculate winnings display
              let winningsDisplay: string;
              if (fixtureWinners.length > 1) {
                // Multiple winners - show split amount
                const splitAmount = potDistribution.amountPerWinner;
                              winningsDisplay = `$${splitAmount.toFixed(2)} each (${fixtureWinners.length} winners)`;
            } else {
              // Single winner - show full pot amount
              winningsDisplay = `$${potDistribution.potAmount.toFixed(2)}`;
              }
              
              // Get fixture details (you may need to implement this based on your data structure)
              const fixtureDetails = await fplApi.getFixtures(gameweek.id);
              const fixture = fixtureDetails.find((f: any) => f.id === Number(fixtureId));
              
              resultsData.push({
                gameweek: gameweek.id,
                fixture: fixture ? `${fixture.team_h} vs ${fixture.team_a}` : `Fixture ${fixtureId}`,
                finalScore: fixture ? `${fixture.team_h_score} - ${fixture.team_a_score}` : 'N/A',
                scorers: 'N/A', // This would need to be populated from match data
                winners: winnerNames,
                submittedScore: fixtureWinners[0] ? `${fixtureWinners[0].home_goal} - ${fixtureWinners[0].away_goal}` : 'N/A',
                submittedScorer: fixtureWinners[0]?.player_name || 'N/A',
                winningsPot: winningsDisplay
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to get Score and Strike data for GW ${gameweek.id}:`, error);
        }
      }
      
      // Sort by gameweek
      resultsData.sort((a, b) => a.gameweek - b.gameweek);
      setResults(resultsData);
      
    } catch (err: any) {
      console.error('Error fetching Score and Strike results:', err);
      setError(err.message || 'Failed to load Score and Strike results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin-slow w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-lg font-semibold text-gray-700">Loading Score and Strike results...</p>
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
          onClick={fetchScoreStrikeResults}
          className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      
      <div className="flex flex-col gap-0.5 max-h-[calc(100vh-300px)] overflow-y-auto border border-gray-200 rounded-xl">
        {/* Header */}
        <div className="grid grid-cols-[80px_1fr_120px_1fr_1fr_1fr_1fr_120px] gap-3 p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-t-xl text-sm font-bold sticky top-0 z-10 shadow-lg">
          <span>GW</span>
          <span>Fixture</span>
          <span>Final Score</span>
          <span>Scorer</span>
          <span>Winner(s)</span>
          <span>Submitted Score</span>
          <span>Submitted Scorer</span>
          <span>Winnings/Pot</span>
        </div>
        
        {/* Empty state or results */}
        {results.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500 text-xl mb-4">📊</div>
            <p className="text-lg font-semibold text-gray-600">Score and Strike results will appear here</p>
            <p className="text-sm text-gray-500 mt-2">Results will be populated at the end of each gameweek</p>
            <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200">
              <p className="text-sm text-primary-700 font-medium">
                🎯 Contest results will be updated after each gameweek completion
              </p>
            </div>
          </div>
        ) : (
          /* Results rows */
          results.map((result, index) => (
            <div 
              key={index}
              className={`grid grid-cols-[80px_1fr_120px_1fr_1fr_1fr_1fr_120px] gap-3 p-3 items-center border-b border-gray-200 transition-all duration-300 hover:bg-gray-50 ${
                index === results.length - 1 ? 'rounded-b-xl' : ''
              }`}
            >
              <span className="font-bold text-primary-600 text-sm">
                GW {result.gameweek}
              </span>
              <span className="font-semibold text-gray-800 text-sm">
                {result.fixture}
              </span>
              <span className="font-bold text-gray-800 text-sm text-center">
                {result.finalScore}
              </span>
              <span className="font-semibold text-gray-800 text-sm">
                {result.scorers}
              </span>
              <span className="font-semibold text-gray-800 text-sm">
                {result.winners}
              </span>
              <span className="font-semibold text-gray-800 text-sm">
                {result.submittedScore}
              </span>
              <span className="font-semibold text-gray-800 text-sm">
                {result.submittedScorer}
              </span>
              <span className="font-bold text-green-600 text-sm text-center">
                {result.winningsPot}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 