'use client';

import { useState } from 'react';
import { Tab } from '@headlessui/react';
import { 
  TrophyIcon, 
  StarIcon, 
  ChartBarIcon, 
  PuzzlePieceIcon 
} from '@heroicons/react/24/outline';
import LeagueTab from './LeagueTab';
import ScoreStrikeResultsTab from './ScoreStrikeResultsTab';
import WeeklyWinnerTab from './WeeklyWinnerTab';
import ChipsTab from './ChipsTab';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ResultsTab() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const subTabs = [
    { name: 'League', icon: TrophyIcon, component: LeagueTab, shortName: 'League' },
    { name: 'Score and Strike Results', icon: StarIcon, component: ScoreStrikeResultsTab, shortName: 'Score' },
    { name: 'Weekly Winners', icon: ChartBarIcon, component: WeeklyWinnerTab, shortName: 'Winners' },
    { name: 'Chips', icon: PuzzlePieceIcon, component: ChipsTab, shortName: 'Chips' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
        {/* Mobile-Responsive Tab List */}
        <Tab.List className="flex space-x-1 sm:space-x-2 rounded-lg sm:rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 p-1 sm:p-2 mb-4 sm:mb-6 lg:mb-8 shadow-lg border border-gray-200 overflow-x-auto scrollbar-hide">
          {subTabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                classNames(
                  'flex items-center gap-2 sm:gap-3 w-full rounded-lg sm:rounded-xl py-2 sm:py-3 lg:py-4 px-3 sm:px-4 lg:px-6 text-xs sm:text-sm font-semibold leading-5 transition-all duration-300 transform flex-shrink-0 min-w-[80px] sm:min-w-[100px]',
                  'ring-white ring-opacity-60 ring-offset-1 sm:ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-xl scale-105'
                    : 'text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-md hover:scale-102'
                )
              }
            >
              <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{tab.name}</span>
              <span className="sm:hidden">{tab.shortName}</span>
            </Tab>
          ))}
        </Tab.List>
        
        {/* Mobile-Responsive Tab Panels */}
        <Tab.Panels>
          {subTabs.map((tab) => (
            <Tab.Panel
              key={tab.name}
              className={classNames(
                'rounded-lg sm:rounded-xl lg:rounded-2xl bg-white shadow-xl border border-gray-100 p-3 sm:p-4 lg:p-6',
                'ring-white ring-opacity-60 ring-offset-1 sm:ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
              )}
            >
              <tab.component />
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
} 