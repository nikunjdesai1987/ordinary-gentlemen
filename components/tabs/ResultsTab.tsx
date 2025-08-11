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
    { name: 'League', icon: TrophyIcon, component: LeagueTab, phoneName: 'League' },
    { name: 'Score and Strike Results', icon: StarIcon, component: ScoreStrikeResultsTab, phoneName: 'Score' },
    { name: 'Weekly Winners', icon: ChartBarIcon, component: WeeklyWinnerTab, phoneName: 'Winners' },
    { name: 'Chips', icon: PuzzlePieceIcon, component: ChipsTab, phoneName: 'Chips' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
        {/* Mobile-First Tab List - Large touch targets, phone-optimized */}
        <Tab.List className="flex flex-col sm:flex-row gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 p-2 sm:p-3 mb-6 sm:mb-8 shadow-lg border border-gray-200">
          {subTabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                classNames(
                  'flex items-center justify-center gap-3 w-full sm:w-auto rounded-lg sm:rounded-xl py-4 sm:py-4 lg:py-5 px-4 sm:px-6 text-sm sm:text-base font-semibold leading-5 transition-all duration-300 flex-shrink-0 touch-target',
                  'ring-white ring-opacity-60 ring-offset-1 sm:ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-xl scale-105'
                    : 'text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-md hover:scale-102'
                )
              }
            >
              <tab.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden sm:inline">{tab.name}</span>
              <span className="sm:hidden">{tab.phoneName}</span>
            </Tab>
          ))}
        </Tab.List>
        
        {/* Mobile-First Tab Panels - Phone-optimized spacing */}
        <Tab.Panels>
          {subTabs.map((tab) => (
            <Tab.Panel
              key={tab.name}
              className={classNames(
                'rounded-xl sm:rounded-2xl bg-white shadow-xl border border-gray-100 p-4 sm:p-6',
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