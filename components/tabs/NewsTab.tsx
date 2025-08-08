'use client';

import { useState, useEffect } from 'react';
import { fplApi, FPLGameweek } from '@/lib/fpl-api';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  time: string;
  type: 'gameweek' | 'deadline' | 'update';
}

export default function NewsTab() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching FPL news...');
        
        // Fetch current gameweek and upcoming deadlines
        const currentGameweek = await fplApi.getCurrentGameweek();
        const gameweeks = await fplApi.getGameweeks();
        
        console.log('Current gameweek:', currentGameweek);
        console.log('Gameweeks:', gameweeks);
        
        const news: NewsItem[] = [];
        
        if (currentGameweek) {
          news.push({
            id: 1,
            title: `Gameweek ${currentGameweek.id} is Live!`,
            content: `The current gameweek is active. Average score: ${currentGameweek.average_entry_score} points.`,
            time: 'Live',
            type: 'gameweek'
          });
        }
        
        // Add upcoming deadlines
        const upcomingGameweeks = gameweeks.filter(gw => !gw.finished && !gw.is_current).slice(0, 3);
        upcomingGameweeks.forEach((gw, index) => {
          const deadline = new Date(gw.deadline_time);
          const timeUntilDeadline = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          
          news.push({
            id: news.length + 1,
            title: `Gameweek ${gw.id} Deadline`,
            content: `Deadline: ${deadline.toLocaleDateString()} at ${deadline.toLocaleTimeString()}. ${timeUntilDeadline > 0 ? `${timeUntilDeadline} days remaining.` : 'Deadline passed.'}`,
            time: timeUntilDeadline > 0 ? `${timeUntilDeadline} days` : 'Passed',
            type: 'deadline'
          });
        });
        
        // Add FPL updates
        news.push({
          id: news.length + 1,
          title: 'FPL Season Updates',
          content: 'Stay tuned for the latest Fantasy Premier League updates, player news, and transfer information.',
          time: 'Updated',
          type: 'update'
        });
        
        setNewsItems(news);
      } catch (err: any) {
        console.error('Error fetching news:', err);
        setError(err.message || 'Failed to load FPL news');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'gameweek': return '⚽';
      case 'deadline': return '⏰';
      case 'update': return '📢';
      default: return '📰';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-6">
        <div className="animate-spin-slow w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-sm font-semibold text-gray-700">Loading FPL news...</p>
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-9">
        <h2 className="page-header-gradient drop-shadow-md">
          📰 Latest News
        </h2>
        <div className="page-subheader">
          Stay updated with the latest FPL information
        </div>
      </div>
      
      <div className="flex flex-col gap-5">
        {newsItems.map((item) => (
          <div 
            key={item.id}
            className="info-card flex gap-5 p-6 card-hover"
          >
            <div className="text-4xl min-w-[50px] text-center">
              {getIcon(item.type)}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800 mb-3 leading-tight">
                {item.title}
              </h3>
              <p className="text-base text-gray-600 mb-3 leading-relaxed">
                {item.content}
              </p>
              <span className="text-sm text-gray-500 font-medium">
                🕐 {item.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 