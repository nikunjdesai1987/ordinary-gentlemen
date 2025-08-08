'use client';

import { useState, useEffect } from 'react';
import { fplApi, ChipUsage } from '@/lib/fpl-api';
import { dbUtils } from '@/lib/database';

export default function ChipsTab() {
  const [chipUsage, setChipUsage] = useState<ChipUsage[]>([]);
  const [chipWinners, setChipWinners] = useState<{ [key: string]: any[] }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configuredChips, setConfiguredChips] = useState<string[]>([]);
  const [chipAmounts, setChipAmounts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchChipUsage();
    fetchChipConfiguration();
    fetchChipWinners();
  }, []);

  const fetchChipConfiguration = async () => {
    try {
      console.log('Fetching chip configuration...');
      const adminConfig = await dbUtils.getLatestAdminConfig();
      if (adminConfig && adminConfig.payoutStructure && adminConfig.payoutStructure.chipUsage) {
        const chips = Object.keys(adminConfig.payoutStructure.chipUsage);
        setConfiguredChips(chips);
        setChipAmounts(adminConfig.payoutStructure.chipUsage);
        console.log('Configured chips:', chips);
        console.log('Chip amounts:', adminConfig.payoutStructure.chipUsage);
      }
    } catch (error) {
      console.error('Error fetching chip configuration:', error);
      // Use default chips if unable to fetch
      setConfiguredChips(['Triple Captain', 'Bench Boost', 'Free Hit']);
    }
  };

  const fetchChipUsage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching chip usage data...');
      const data = await fplApi.getChipUsage();
      console.log('Chip usage data:', data);
      
      setChipUsage(data);
    } catch (err: any) {
      console.error('Error fetching chip usage:', err);
      setError(err.message || 'Failed to load chip usage data');
    } finally {
      setLoading(false);
    }
  };

  const fetchChipWinners = async () => {
    try {
      const winners = await fplApi.getChipWinners();
      console.log('Chip winners:', winners);
      setChipWinners(winners);
    } catch (err: any) {
      console.error('Error fetching chip winners:', err);
      setChipWinners({});
    }
  };

  const getChipIcon = (chipType: string) => {
    switch (chipType) {
      case 'bboost':
      case 'benchboost': return '🔄';
      case 'freehit':
      case 'freehit': return '🎯';
      case 'wildcard': return '🃏';
      case '3xc':
      case 'triplecaptain': return '⚡';
      default: return '🎲';
    }
  };

  const getTopChipUsage = () => {
    // Group chip usage by chip type and get the best performance for each
    const chipGroups: { [key: string]: ChipUsage[] } = {};
    
    chipUsage.forEach(usage => {
      const key = `${usage.chipType}_${usage.gameweek <= 19 ? 'I' : 'II'}`;
      if (!chipGroups[key]) {
        chipGroups[key] = [];
      }
      chipGroups[key].push(usage);
    });

    // Get the best performance for each chip type
    const topChips: ChipUsage[] = [];
    Object.values(chipGroups).forEach(group => {
      const best = group.reduce((prev, current) => 
        current.points > prev.points ? current : prev
      );
      topChips.push(best);
    });

    return topChips.slice(0, 6); // Return top 6
  };

  return (
    <div className="max-w-6xl mx-auto">
      
      {/* Chip Statistics Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {loading ? (
          // Loading state for chip tiles
          Array.from({ length: 6 }).map((_, index) => (
            <div 
              key={index}
              className="flex flex-col items-center p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-primary-100 text-center"
            >
              <div className="animate-pulse">
                <div className="w-8 h-8 bg-gray-300 rounded mb-4"></div>
                <div className="w-24 h-4 bg-gray-300 rounded mb-2"></div>
                <div className="w-20 h-4 bg-gray-300 rounded mb-2"></div>
                <div className="w-16 h-4 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))
        ) : error ? (
          // Error state
          <div className="col-span-full text-center py-8">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-lg font-semibold text-red-600">{error}</p>
            <button 
              onClick={fetchChipUsage}
              className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : chipUsage.length === 0 ? (
          // No data state - Show configured chip tiles with fun messages
          configuredChips.map((chipName, index) => {
            const icon = getChipIcon(chipName.toLowerCase().replace(' ', ''));
            const amount = chipAmounts[chipName] || 0;
            
            // Find winners for this chip type
            const chipType = chipName.toLowerCase().replace(' ', '') as any;
            const winners = chipWinners[chipType] || [];
            
            return (
              <div 
                key={index}
                className="flex flex-col items-center p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-primary-100 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{icon}</span>
                  <span className="text-lg font-semibold text-gray-800">
                    {chipName}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {winners.length > 0 ? (
                    <>
                      <span className="text-sm text-green-600 font-semibold">
                        🏆 Winners Found!
                      </span>
                      <div className="text-xs text-gray-600 space-y-1">
                        {winners.slice(0, 3).map((winner: any, idx: number) => (
                          <div key={idx}>
                            {winner.managerName} (GW{winner.gameweek})
                          </div>
                        ))}
                        {winners.length > 3 && (
                          <div className="text-primary-500">
                            +{winners.length - 3} more
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-primary-500 font-semibold">
                        ${amount.toFixed(2)} per winner
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-gray-600 font-medium leading-relaxed">
                        Waiting for managers to use their {chipName.toLowerCase()}! 🎯
                      </span>
                      <span className="text-xs text-primary-500 font-semibold">
                        ${amount.toFixed(2)} prize pool
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          // Display chip usage data
          getTopChipUsage().map((chip, index) => (
            <div 
              key={`${chip.chipType}_${chip.gameweek}_${chip.managerId}`}
              className="flex flex-col items-center p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-primary-100 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{getChipIcon(chip.chipType)}</span>
                <span className="text-lg font-semibold text-gray-800">
                  {chip.chipName}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-lg font-bold text-gray-800">
                  {chip.managerName}
                </span>
                <span className="text-base text-primary-600 font-semibold">
                  +{chip.points} pts
                </span>
                <span className="text-sm text-gray-500">
                  GW {chip.gameweek}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 