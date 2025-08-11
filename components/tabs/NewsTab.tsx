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
      <div className="text-center py-4 sm:py-6">
        <div className="animate-spin-slow w-6 h-6 sm:w-8 sm:h-8 border-3 sm:border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-2 sm:mb-3"></div>
        <p className="text-xs sm:text-sm font-semibold text-gray-700">Loading FPL news...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 sm:py-8 px-4">
        <div className="text-red-500 text-lg sm:text-xl mb-3 sm:mb-4">⚠️</div>
        <p className="text-base sm:text-lg font-semibold text-red-600">{error}</p>
        <p className="text-xs sm:text-sm text-gray-600 mt-2">Please try refreshing the page</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm sm:text-base touch-target"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Section - Responsive */}
      <div className="text-center mb-6 sm:mb-8 lg:mb-9">
        <h2 className="page-header-gradient drop-shadow-md">
          📰 Latest News
        </h2>
        <div className="page-subheader">
          Stay updated with the latest FPL information
        </div>
      </div>
      
      {/* News Items Grid - Responsive */}
      <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5">
        {newsItems.map((item) => (
          <div 
            key={item.id}
            className="info-card flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-5 p-4 sm:p-5 lg:p-6 card-hover"
          >
            {/* Icon Section - Responsive */}
            <div className="text-2xl sm:text-3xl lg:text-4xl min-w-[40px] sm:min-w-[50px] text-center sm:text-left">
              {getIcon(item.type)}
            </div>
            
            {/* Content Section - Responsive */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-2 sm:mb-3 leading-tight">
                {item.title}
              </h3>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-2 sm:mb-3 leading-relaxed">
                {item.content}
              </p>
              <span className="text-xs sm:text-sm text-gray-500 font-medium flex items-center gap-1">
                🕐 {item.time}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Mobile-friendly empty state */}
      {newsItems.length === 0 && !loading && !error && (
        <div className="text-center py-8 sm:py-12">
          <div className="text-gray-400 text-4xl sm:text-6xl mb-4">📰</div>
          <p className="text-base sm:text-lg font-medium text-gray-600">No news available at the moment</p>
          <p className="text-sm sm:text-base text-gray-500 mt-2">Check back later for updates</p>
        </div>
      )}
    </div>
  );
} 