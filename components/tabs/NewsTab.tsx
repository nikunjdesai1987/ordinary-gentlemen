'use client'

import { useState, useEffect } from 'react'
import { fplApi } from '../../lib/fpl-api'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

interface NewsItem {
  id: number
  title: string
  content: string
  published_at: string
  type: string
}

export default function NewsTab() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Mock news data since FPL API doesn't have news endpoint
      const mockNews: NewsItem[] = [
        {
          id: 1,
          title: "Gameweek 1 Deadline Approaching",
          content: "Make sure to submit your team selections before the deadline. Don't forget to check for any last-minute injuries or suspensions.",
          published_at: new Date().toISOString(),
          type: "Deadline"
        },
        {
          id: 2,
          title: "New Season Kicks Off",
          content: "Welcome to the new Fantasy Premier League season! Time to test your football knowledge and compete with fellow managers.",
          published_at: new Date(Date.now() - 86400000).toISOString(),
          type: "Season"
        },
        {
          id: 3,
          title: "Score & Strike Game Active",
          content: "The Score & Strike prediction game is now live. Submit your predictions for this week's featured fixture and compete for prizes.",
          published_at: new Date(Date.now() - 172800000).toISOString(),
          type: "Game"
        }
      ]
      
      setNews(mockNews)
    } catch (err: any) {
      console.error('Error fetching news:', err)
      setError(err.message || 'Failed to load news')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-48 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="loading-spinner w-12 h-12 mx-auto"></div>
          <p className="text-[var(--color-text-secondary)]">Loading latest FPL news...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-48 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center space-y-4 p-6">
            <div className="w-16 h-16 bg-[var(--color-error)]/20 rounded-full flex items-center justify-center mx-auto">
              <span className="text-[var(--color-error)] text-2xl">!</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Failed to Load News</h3>
              <p className="text-[var(--color-text-secondary)] text-sm mb-4">{error}</p>
              <Button onClick={fetchNews} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!news || news.length === 0) {
    return (
      <div className="min-h-48 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center space-y-4 p-6">
            <div className="w-16 h-16 bg-[var(--color-info)]/20 rounded-full flex items-center justify-center mx-auto">
              <span className="text-[var(--color-info)] text-2xl">📰</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No News Available</h3>
              <p className="text-[var(--color-text-secondary)] text-sm">
                Check back later for the latest FPL updates and announcements.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-gradient-hero text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">
          Latest FPL News
        </h1>
        <p className="text-[var(--color-text-secondary)] text-lg">
          Stay updated with the latest Fantasy Premier League news and announcements
        </p>
      </div>

      {/* News Grid */}
      <div className="grid gap-6">
        {news.map((item) => (
          <Card key={item.id} className="card-hover">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle size="lg" className="text-[var(--color-text-primary)] mb-2">
                    {item.title}
                  </CardTitle>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="px-3 py-1 bg-[var(--pl-magenta)]/20 text-[var(--pl-magenta)] rounded-full font-medium">
                      {item.type}
                    </span>
                    <span className="text-[var(--color-text-secondary)]">
                      {formatDate(item.published_at)}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                {item.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="text-center pt-6">
        <Button
          onClick={fetchNews}
          variant="outline"
          size="lg"
          className="bg-gradient-to-r from-[var(--pl-neon)] to-[var(--pl-cyan)] text-[var(--color-primary-contrast)] border-0 hover:opacity-90"
        >
          Refresh News
        </Button>
      </div>
    </div>
  )
} 