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
    { name: 'League', icon: TrophyIcon, component: LeagueTab },
    { name: 'Score and Strike Results', icon: StarIcon, component: ScoreStrikeResultsTab },
    { name: 'Weekly Winners', icon: ChartBarIcon, component: WeeklyWinnerTab },
    { name: 'Chips', icon: PuzzlePieceIcon, component: ChipsTab },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
        <Tab.List className="flex space-x-2 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 p-2 mb-8 shadow-lg border border-gray-200">
          {subTabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                classNames(
                  'flex items-center gap-3 w-full rounded-xl py-4 px-6 text-sm font-semibold leading-5 transition-all duration-300 transform',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-xl scale-105'
                    : 'text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-md hover:scale-102'
                )
              }
            >
              <tab.icon className="w-5 h-5" />
              <span className="hidden sm:inline">{tab.name}</span>
              <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels>
          {subTabs.map((tab) => (
            <Tab.Panel
              key={tab.name}
              className={classNames(
                'rounded-2xl bg-white shadow-xl border border-gray-100 p-6',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
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