'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { fplApi } from '../../lib/fpl-api'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface Fixture {
  id: number
  homeTeam: string
  awayTeam: string
  homeTeamId?: number | null
  awayTeamId?: number | null
  kickoffTime: Date
  gameweek: number
  isFinished: boolean
  homeScore?: number
  awayScore?: number
  goalscorers?: string[]
}

interface UserPrediction {
  id?: number
  fixtureId: number
  homeGoals: number
  awayGoals: number
  goalscorer: string
  submittedAt: Date
  isCorrect?: boolean
  points?: number
}

interface Player {
  id: number
  first_name: string
  second_name: string
  web_name: string
  team: number
  element_type: number
  now_cost: number
  total_points: number
  form: string
  points_per_game: string
  selected_by_percent: string
}

interface Team {
  id: number
  name: string
  short_name: string
}

interface ElementType {
  id: number
  singular_name_short: string
}

type GameSelectionStrategy = 'first_available' | 'random' | 'highest_priority' | 'manual'

export default function ScoreStrikeTab() {
  const { user, managerFplId } = useAuth()
  const [currentGameweek, setCurrentGameweek] = useState<any>(null)
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null)
  const [userPredictions, setUserPredictions] = useState<UserPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [homeGoals, setHomeGoals] = useState('')
  const [awayGoals, setAwayGoals] = useState('')
  const [goalscorer, setGoalscorer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedEntry, setSubmittedEntry] = useState<any>(null)
  const [entryError, setEntryError] = useState<string | null>(null)
  const [fixtureLocked, setFixtureLocked] = useState(false)
  const [currentPot, setCurrentPot] = useState<number>(0)
  const [potLoading, setPotLoading] = useState(false)

  // Player data state
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [elementTypes, setElementTypes] = useState<ElementType[]>([])
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])

  // Game selection state
  const [selectionStrategy, setSelectionStrategy] = useState<GameSelectionStrategy>('highest_priority')

  // Priority teams for game selection
  const PRIORITY_TEAMS = [
    'Manchester City',
    'Liverpool',
    'Arsenal',
    'Manchester United',
    'Chelsea',
    'Tottenham Hotspur',
    'Newcastle United',
    'Aston Villa'
  ]

  // New game selection logic based on specific team ID requirements
  const selectGameByTeamPriority = async (fixtures: Fixture[]): Promise<Fixture | null> => {
    if (!fixtures || fixtures.length === 0) return null

    console.log('=== SELECTING GAME BY TEAM PRIORITY ===')
    console.log('Available fixtures:', fixtures.length)

    // Priority team IDs as specified
    const PRIORITY_TEAM_IDS = [1, 7, 12, 13, 14, 18]
    const SECONDARY_TEAM_IDS = [2, 15]
    
    // Priority order for team_h selection
    const TEAM_H_PRIORITY_ORDER = [13, 12, 1, 14, 7, 18]
    const TEAM_A_PRIORITY_ORDER = [15, 2]

    try {
      // Get teams data for ID mapping
      const teams = await fplApi.getTeams()
      
      // Convert fixtures to include team IDs
      const fixturesWithIds = fixtures.map(fixture => {
        const homeTeamId = teams.find(t => t.name === fixture.homeTeam)?.id || null
        const awayTeamId = teams.find(t => t.name === fixture.awayTeam)?.id || null
        return {
          ...fixture,
          homeTeamId,
          awayTeamId
        }
      })

      console.log('Fixtures with team IDs:', fixturesWithIds.map(f => ({
        id: f.id,
        homeTeam: f.homeTeam,
        homeTeamId: f.homeTeamId,
        awayTeam: f.awayTeam,
        awayTeamId: f.awayTeamId
      })))

      // Rule 1: Both team_h and team_a in PRIORITY_TEAM_IDS
      const bothPriority = fixturesWithIds.filter(f => 
        f.homeTeamId && f.awayTeamId &&
        PRIORITY_TEAM_IDS.includes(f.homeTeamId) && 
        PRIORITY_TEAM_IDS.includes(f.awayTeamId)
      )

      if (bothPriority.length > 0) {
        console.log('Rule 1: Found fixtures with both teams in priority list:', bothPriority.length)
        
        // Sort by team_h priority order
        bothPriority.sort((a, b) => {
          const aIndex = TEAM_H_PRIORITY_ORDER.indexOf(a.homeTeamId!)
          const bIndex = TEAM_H_PRIORITY_ORDER.indexOf(b.homeTeamId!)
          return aIndex - bIndex
        })

        const selected = bothPriority[0]
        console.log('Selected by Rule 1:', {
          fixtureId: selected.id,
          homeTeam: selected.homeTeam,
          homeTeamId: selected.homeTeamId,
          awayTeam: selected.awayTeam,
          awayTeamId: selected.awayTeamId
        })
        return selected
      }

      // Rule 2: team_h in PRIORITY_TEAM_IDS and team_a in SECONDARY_TEAM_IDS
      const homePriorityAwaySecondary = fixturesWithIds.filter(f => 
        f.homeTeamId && f.awayTeamId &&
        PRIORITY_TEAM_IDS.includes(f.homeTeamId) && 
        SECONDARY_TEAM_IDS.includes(f.awayTeamId)
      )

      if (homePriorityAwaySecondary.length > 0) {
        console.log('Rule 2: Found fixtures with priority home team and secondary away team:', homePriorityAwaySecondary.length)
        
        // Sort by team_h priority order
        homePriorityAwaySecondary.sort((a, b) => {
          const aIndex = TEAM_H_PRIORITY_ORDER.indexOf(a.homeTeamId!)
          const bIndex = TEAM_H_PRIORITY_ORDER.indexOf(b.homeTeamId!)
          return aIndex - bIndex
        })

        const selected = homePriorityAwaySecondary[0]
        console.log('Selected by Rule 2:', {
          fixtureId: selected.id,
          homeTeam: selected.homeTeam,
          homeTeamId: selected.homeTeamId,
          awayTeam: selected.awayTeam,
          awayTeamId: selected.awayTeamId
        })
        return selected
      }

      // Rule 3: team_a in PRIORITY_TEAM_IDS and team_h in SECONDARY_TEAM_IDS
      const awayPriorityHomeSecondary = fixturesWithIds.filter(f => 
        f.homeTeamId && f.awayTeamId &&
        SECONDARY_TEAM_IDS.includes(f.homeTeamId) && 
        PRIORITY_TEAM_IDS.includes(f.awayTeamId)
      )

      if (awayPriorityHomeSecondary.length > 0) {
        console.log('Rule 3: Found fixtures with secondary home team and priority away team:', awayPriorityHomeSecondary.length)
        
        // Sort by team_a priority order
        awayPriorityHomeSecondary.sort((a, b) => {
          const aIndex = TEAM_A_PRIORITY_ORDER.indexOf(a.awayTeamId!)
          const bIndex = TEAM_A_PRIORITY_ORDER.indexOf(b.awayTeamId!)
          return aIndex - bIndex
        })

        const selected = awayPriorityHomeSecondary[0]
        console.log('Selected by Rule 3:', {
          fixtureId: selected.id,
          homeTeam: selected.homeTeam,
          homeTeamId: selected.homeTeamId,
          awayTeam: selected.awayTeam,
          awayTeamId: selected.awayTeamId
        })
        return selected
      }

      // Rule 4: Fallback to first available fixture
      if (fixturesWithIds.length > 0) {
        const selected = fixturesWithIds[0]
        console.log('Rule 4: Fallback to first available fixture:', {
          fixtureId: selected.id,
          homeTeam: selected.homeTeam,
          awayTeam: selected.awayTeam
        })
        return selected
      }

      console.log('No fixtures available for selection')
      return null
    } catch (error) {
      console.error('Error in selectGameByTeamPriority:', error)
      // Fallback to first available fixture if there's an error
      if (fixtures.length > 0) {
        console.log('Fallback to first fixture due to error')
        return fixtures[0]
      }
      return null
    }
  }

  // Fetch current gameweek and fixtures
  useEffect(() => {
    fetchGameweekData()
  }, [])

  // Fetch user predictions when user or fixtures change
  useEffect(() => {
    if (user && fixtures.length > 0) {
      fetchUserPredictions()
    }
  }, [user, fixtures])

  // Auto-select game when fixtures or strategy changes
  useEffect(() => {
    if (fixtures.length > 0 && selectionStrategy !== 'manual') {
      const selectGame = async () => {
        try {
          console.log('🔄 Mobile Debug: Starting game selection...')
          const selected = await selectGameByTeamPriority(fixtures)
          console.log('✅ Mobile Debug: Game selected:', selected)
          setSelectedFixture(selected)
        } catch (error) {
          console.error('❌ Mobile Debug: Error selecting game:', error)
          // Fallback to first fixture if selection fails
          if (fixtures.length > 0) {
            console.log('🔄 Mobile Debug: Using fallback fixture:', fixtures[0])
            setSelectedFixture(fixtures[0])
          }
        }
      }
      selectGame()
    }
  }, [fixtures, selectionStrategy])

  // Real-time fixture lock status checking
  useEffect(() => {
    if (selectedFixture) {
      // Check immediately
      checkFixtureLockStatus()
      
      // Set up interval to check every minute for real-time updates
      const interval = setInterval(() => {
        checkFixtureLockStatus()
      }, 60000) // Check every minute
      
      return () => clearInterval(interval)
    }
  }, [selectedFixture])

  // Mobile fallback: If no fixture is selected after 2 seconds, use first available
  useEffect(() => {
    if (fixtures.length > 0 && !selectedFixture) {
      const fallbackTimer = setTimeout(() => {
        console.log('🔄 Mobile Debug: Fallback timer triggered, selecting first fixture')
        setSelectedFixture(fixtures[0])
      }, 2000)
      
      return () => clearTimeout(fallbackTimer)
    }
  }, [fixtures, selectedFixture])

  // Load player data when component mounts
  useEffect(() => {
    fetchPlayerData()
  }, [])

  // Update available players when fixture changes
  useEffect(() => {
    if (selectedFixture && players.length > 0 && teams.length > 0 && elementTypes.length > 0) {
      updateAvailablePlayers()
    }
  }, [selectedFixture, players, teams, elementTypes])

  // Check fixture lock status when selected fixture changes
  useEffect(() => {
    if (selectedFixture) {
      checkFixtureLockStatus()
      checkForSubmittedEntry()
    }
  }, [selectedFixture])

  // Load current pot when component mounts
  useEffect(() => {
    loadCurrentPot()
  }, [])

  const fetchGameweekData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Fetching gameweek data...')
      
      // Get all gameweeks to determine current gameweek
      const allGameweeks = await fplApi.getGameweeks()
      console.log('All gameweeks loaded:', allGameweeks.length)
      
      // Try to get current gameweek first, fallback to gameweek 1
      let gameweek = allGameweeks.find(gw => gw.is_current)
      if (!gameweek) {
        console.log('No current gameweek found, using gameweek 1')
        gameweek = allGameweeks.find(gw => gw.id === 1)
      }
      
      console.log('Selected gameweek:', gameweek)
      setCurrentGameweek(gameweek || null)

      if (gameweek) {
        // Get fixtures from dedicated fixtures API and teams from bootstrap API
        const [allFixtures, teams] = await Promise.all([
          fplApi.getFixtures(),
          fplApi.getTeams()
        ])
        
        console.log('All fixtures from fixtures API:', allFixtures.length)
        console.log('Teams loaded from bootstrap API:', teams.length)
        
        // Filter fixtures for the current gameweek (event)
        const eventFixtures = allFixtures.filter((fixture: any) => fixture.event === gameweek.id)
        console.log(`Fixtures found for event ${gameweek.id}:`, eventFixtures.length)
        
        // Map fixtures with team names
        const mappedFixtures = eventFixtures.map((fixture: any) => {
          const homeTeam = teams.find((team: any) => team.id === fixture.team_h)
          const awayTeam = teams.find((team: any) => team.id === fixture.team_a)
          
          console.log(`Mapping fixture ${fixture.id}:`, {
            homeTeamId: fixture.team_h,
            homeTeamName: homeTeam?.name || 'Unknown',
            homeTeamShort: homeTeam?.short_name || 'Unknown',
            awayTeamId: fixture.team_a,
            awayTeamName: awayTeam?.name || 'Unknown',
            awayTeamShort: awayTeam?.short_name || 'Unknown'
          })
          
          return {
            id: fixture.id,
            homeTeam: homeTeam?.name || 'Unknown',
            awayTeam: awayTeam?.name || 'Unknown',
            homeTeamId: fixture.team_h,
            awayTeamId: fixture.team_a,
            kickoffTime: new Date(fixture.kickoff_time),
            gameweek: fixture.event,
            isFinished: fixture.finished,
            homeScore: fixture.team_h_score,
            awayScore: fixture.team_a_score,
          }
        })

        console.log('Mapped fixtures for GW', gameweek.id, ':', mappedFixtures.length)
        console.log('Fixture details:', mappedFixtures.map(f => `${f.homeTeam} vs ${f.awayTeam}`))
        
        setFixtures(mappedFixtures)
        
      } else {
        console.error('No gameweek found')
        setError('Unable to load gameweek data')
      }
    } catch (err: any) {
      console.error('Error fetching gameweek data:', err)
      setError(err.message || 'Failed to load fixtures')
    } finally {
      setLoading(false)
    }
  }

  const fetchPlayerData = async () => {
    try {
      console.log('🔍 Fetching player data...')
      
      // Get all bootstrap data at once (more efficient)
      const bootstrapData = await fplApi.getBootstrapData()
      
      console.log('Bootstrap data loaded:', {
        players: bootstrapData.elements?.length || 0,
        teams: bootstrapData.teams?.length || 0,
        elementTypes: bootstrapData.element_types?.length || 0,
        events: bootstrapData.events?.length || 0
      })
      
      if (bootstrapData.elements && bootstrapData.teams && bootstrapData.element_types) {
        setPlayers(bootstrapData.elements)
        setTeams(bootstrapData.teams)
        setElementTypes(bootstrapData.element_types)
        console.log('✅ Player data loaded successfully')
      } else {
        console.error('❌ Missing required data from bootstrap')
      }
    } catch (error) {
      console.error('❌ Error fetching player data:', error)
    }
  }

  const updateAvailablePlayers = () => {
    if (!selectedFixture || !players.length || !teams.length || !elementTypes.length) return

    try {
      // Get team IDs for the selected fixture
      const homeTeam = teams.find(t => t.name === selectedFixture.homeTeam)
      const awayTeam = teams.find(t => t.name === selectedFixture.awayTeam)
      
      if (!homeTeam || !awayTeam) {
        console.error('Could not find team data for fixture')
        return
      }

      // Filter players from both teams
      const fixturePlayers = players.filter(player => 
        player.team === homeTeam.id || player.team === awayTeam.id
      )

      // Sort by form (descending) and then by total points (descending)
      const sortedPlayers = fixturePlayers.sort((a, b) => {
        const aForm = parseFloat(a.form) || 0
        const bForm = parseFloat(b.form) || 0
        
        if (aForm !== bForm) {
          return bForm - aForm
        }
        
        return b.total_points - a.total_points
      })

      // Take top 20 players
      const topPlayers = sortedPlayers.slice(0, 20)
      
      console.log('Available players for fixture:', topPlayers.length)
      setAvailablePlayers(topPlayers)
      
    } catch (error) {
      console.error('Error updating available players:', error)
    }
  }

  const fetchUserPredictions = async () => {
    try {
      console.log('🔍 Fetching user predictions...')
      // This would typically fetch from your database
      // For now, we'll use an empty array
      setUserPredictions([])
    } catch (error) {
      console.error('Error fetching user predictions:', error)
    }
  }

  const handleFixtureSelect = (fixture: Fixture) => {
    setSelectedFixture(fixture)
    setHomeGoals('')
    setAwayGoals('')
    setGoalscorer('')
    setSubmittedEntry(null)
    setEntryError(null)
  }

  const hasUserPredicted = (fixtureId: number) => {
    return userPredictions.some(p => p.fixtureId === fixtureId)
  }

  const getUserPrediction = (fixtureId: number) => {
    return userPredictions.find(p => p.fixtureId === fixtureId)
  }

  const handleSubmitPrediction = async () => {
    if (!selectedFixture || !user) return

    try {
      setSubmitting(true)
      setEntryError(null)

      // Validate form
      if (!homeGoals || !awayGoals || !goalscorer) {
        setEntryError('Please fill in all fields')
        return
      }

      const homeGoalsNum = parseInt(homeGoals)
      const awayGoalsNum = parseInt(awayGoals)

      if (isNaN(homeGoalsNum) || isNaN(awayGoalsNum)) {
        setEntryError('Please enter valid scores')
        return
      }

      if (homeGoalsNum < 0 || awayGoalsNum < 0) {
        setEntryError('Scores cannot be negative')
        return
      }

      // Create prediction object
      const prediction: UserPrediction = {
        fixtureId: selectedFixture.id,
        homeGoals: homeGoalsNum,
        awayGoals: awayGoalsNum,
        goalscorer,
        submittedAt: new Date()
      }

      console.log('Submitting prediction:', prediction)

      // Here you would typically save to your database
      // For now, we'll just add to local state
      setUserPredictions(prev => [...prev, prediction])
      setSubmittedEntry(prediction)

      // Clear form
      setHomeGoals('')
      setAwayGoals('')
      setGoalscorer('')

      console.log('✅ Prediction submitted successfully')

    } catch (error) {
      console.error('Error submitting prediction:', error)
      setEntryError('Failed to submit prediction. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatKickoffTime = (date: Date) => {
    return date.toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFixtureStatus = (fixture: Fixture) => {
    if (fixture.isFinished) return 'Finished'
    if (fixture.kickoffTime < new Date()) return 'Live'
    return 'Upcoming'
  }

  const getLockStatusMessage = (fixture: Fixture) => {
    if (fixture.isFinished) {
      return 'Match finished - predictions closed'
    }
    
    const now = new Date()
    const kickoffTime = new Date(fixture.kickoffTime)
    const timeUntilKickoff = kickoffTime.getTime() - now.getTime()
    
    if (timeUntilKickoff <= 0) {
      return 'Match started - predictions closed'
    }
    
    const hours = Math.floor(timeUntilKickoff / (1000 * 60 * 60))
    const minutes = Math.floor((timeUntilKickoff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `Predictions close in ${hours}h ${minutes}m`
    } else {
      return `Predictions close in ${minutes}m`
    }
  }

  const getPredictionResult = (prediction: UserPrediction, fixture: Fixture) => {
    if (!fixture.isFinished || !fixture.homeScore || !fixture.awayScore) return null

    const scoreCorrect = prediction.homeGoals === fixture.homeScore && prediction.awayGoals === fixture.awayScore
    const goalscorerCorrect = fixture.goalscorers?.includes(prediction.goalscorer) || false

    if (scoreCorrect && goalscorerCorrect) return 'Perfect!'
    if (scoreCorrect) return 'Score Correct'
    if (goalscorerCorrect) return 'Goalscorer Correct'
    return 'Incorrect'
  }

  const getPlayerDisplayName = (player: Player) => {
    return `${player.first_name} ${player.second_name}`
  }

  const getPlayerWebName = (playerDisplayName: string) => {
    return playerDisplayName
  }

  const getTeamBadge = (teamName: string) => {
    // This would typically return team badge images
    return teamName.charAt(0).toUpperCase()
  }

  const isFormValid = () => {
    return homeGoals && awayGoals && goalscorer && !submitting
  }

  const hasFormData = () => {
    return homeGoals || awayGoals || goalscorer
  }

  const isFixtureLocked = (fixture: Fixture) => {
    // Fixture is locked at kickoff time (when the match starts)
    // Users can make predictions up until the exact kickoff time from FPL API
    const now = new Date()
    const kickoffTime = new Date(fixture.kickoffTime)
    
    // Additional check: if fixture is already finished, it's definitely locked
    if (fixture.isFinished) {
      console.log(`Fixture ${fixture.id} is locked: Match finished`)
      return true
    }
    
    // Lock the fixture when current time reaches or passes kickoff time
    const isLocked = now >= kickoffTime
    
    if (isLocked) {
      console.log(`Fixture ${fixture.id} is locked: Current time (${now.toISOString()}) >= Kickoff time (${kickoffTime.toISOString()})`)
    } else {
      const timeUntilKickoff = kickoffTime.getTime() - now.getTime()
      const minutesUntilKickoff = Math.floor(timeUntilKickoff / (1000 * 60))
      console.log(`Fixture ${fixture.id} is unlocked: ${minutesUntilKickoff} minutes until kickoff`)
    }
    
    return isLocked
  }

  const getTeamShortName = (teamName: string) => {
    const team = teams.find(t => t.name === teamName)
    return team?.short_name || teamName
  }

  const formatSubmissionTime = (date: Date) => {
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const checkFixtureLockStatus = () => {
    if (selectedFixture) {
      const locked = isFixtureLocked(selectedFixture)
      setFixtureLocked(locked)
      
      // Log detailed lock status information
      const now = new Date()
      const kickoffTime = new Date(selectedFixture.kickoffTime)
      const timeUntilKickoff = kickoffTime.getTime() - now.getTime()
      const minutesUntilKickoff = Math.floor(timeUntilKickoff / (1000 * 60))
      
      console.log('Fixture lock status:', {
        locked,
        isFinished: selectedFixture.isFinished,
        kickoffTime: kickoffTime.toISOString(),
        currentTime: now.toISOString(),
        minutesUntilKickoff: locked ? 'LOCKED' : minutesUntilKickoff,
        status: locked ? 'LOCKED' : 'OPEN'
      })
    }
  }

  const loadCurrentPot = async () => {
    try {
      setPotLoading(true)
      // This would typically fetch from your database
      // For now, we'll use a mock value
      setCurrentPot(100)
    } catch (error) {
      console.error('Error loading current pot:', error)
    } finally {
      setPotLoading(false)
    }
  }

  const checkForSubmittedEntry = async () => {
    if (!selectedFixture || !user) return

    try {
      // This would typically check your database
      // For now, we'll use local state
      const existingPrediction = getUserPrediction(selectedFixture.id)
      if (existingPrediction) {
        setSubmittedEntry(existingPrediction)
        setHomeGoals(existingPrediction.homeGoals.toString())
        setAwayGoals(existingPrediction.awayGoals.toString())
        setGoalscorer(existingPrediction.goalscorer)
      }
    } catch (error) {
      console.error('Error checking for submitted entry:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-48 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="loading-spinner w-12 h-12 mx-auto"></div>
          <p className="text-[var(--color-text-secondary)]">Loading Score & Strike game...</p>
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
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Failed to Load Game</h3>
              <p className="text-[var(--color-text-secondary)] text-sm mb-4">{error}</p>
              <Button onClick={fetchGameweekData} variant="outline" size="sm">
                Try Again
              </Button>
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
          Score & Strike
        </h1>
        <p className="text-[var(--color-text-secondary)] text-lg">
          {currentGameweek ? `Gameweek ${currentGameweek.id}` : 'Loading gameweek...'}
        </p>
      </div>

      {/* Pot Status */}
      <Card className="bg-gradient-to-r from-[var(--pl-neon)] to-[var(--pl-cyan)]">
        <CardContent className="p-6 text-center">
          <h2 className="text-2xl font-bold text-[var(--color-primary-contrast)] mb-2">
            POT TO WIN ${currentPot} This Week
          </h2>
          <p className="text-[var(--color-primary-contrast)]/80">
            Predict the score and goalscorer to win!
          </p>
        </CardContent>
      </Card>

      {/* Contest Display */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4 text-center">
            This Week's Contest
          </h3>
          
          {selectedFixture ? (
            <div className="space-y-6">
              {/* Fixture Info */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-medium text-[var(--color-text-secondary)] mb-2">
                      Home Team
                    </div>
                    <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                      {selectedFixture.homeTeam}
                    </div>
                  </div>
                  
                  <div className="text-3xl font-bold text-[var(--pl-magenta)]">VS</div>
                  
                  <div className="text-center">
                    <div className="text-lg font-medium text-[var(--color-text-secondary)] mb-2">
                      Away Team
                    </div>
                    <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                      {selectedFixture.awayTeam}
                    </div>
                  </div>
                </div>
                
                <div className="text-[var(--color-text-secondary)] text-sm">
                  {formatKickoffTime(selectedFixture.kickoffTime)}
                </div>
                
                {/* Lock Status Message */}
                <div className={`mt-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  fixtureLocked 
                    ? 'bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20' 
                    : 'bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20'
                }`}>
                  {getLockStatusMessage(selectedFixture)}
                </div>
              </div>

              {/* Form Lock Warning */}
              {fixtureLocked && (
                <div className="bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-[var(--color-error)]">
                    <span className="text-lg">🔒</span>
                    <span className="font-medium">Predictions are now closed for this fixture</span>
                  </div>
                  <p className="text-[var(--color-error)]/80 text-sm mt-1">
                    The match has started or finished. You can no longer submit or modify predictions.
                  </p>
                </div>
              )}

              {/* Score Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="text-center">
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Home Goals
                  </label>
                  <Input
                    type="number"
                    value={homeGoals}
                    onChange={(e) => setHomeGoals(e.target.value)}
                    placeholder="0"
                    disabled={fixtureLocked}
                    className="text-center text-2xl font-bold"
                    min="0"
                    max="99"
                  />
                </div>
                
                <div className="text-center">
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Away Goals
                  </label>
                  <Input
                    type="number"
                    value={awayGoals}
                    onChange={(e) => setAwayGoals(e.target.value)}
                    placeholder="0"
                    disabled={fixtureLocked}
                    className="text-center text-2xl font-bold"
                    min="0"
                    max="99"
                  />
                </div>
              </div>

              {/* Goalscorer Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                  First Goalscorer
                </label>
                {availablePlayers.length > 0 ? (
                  <Select
                    value={goalscorer}
                    onChange={(e) => setGoalscorer(e.target.value)}
                    options={availablePlayers.map(player => ({
                      value: getPlayerDisplayName(player),
                      label: `${getPlayerDisplayName(player)} (${teams.find(t => t.id === player.team)?.short_name})`
                    }))}
                    placeholder="Select a player"
                    disabled={fixtureLocked}
                    fullWidth
                  />
                ) : (
                  <div className="text-[var(--color-text-secondary)] text-sm px-3 py-2">
                    Loading available players...
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSubmitPrediction}
                  disabled={!isFormValid() || fixtureLocked}
                  loading={submitting}
                  fullWidth
                  size="lg"
                  className="bg-gradient-to-r from-[var(--pl-neon)] to-[var(--pl-cyan)]"
                >
                  {submitting ? 'Submitting...' : 'Submit Prediction'}
                </Button>
                
                <Button
                  onClick={() => {
                    setHomeGoals('')
                    setAwayGoals('')
                    setGoalscorer('')
                  }}
                  variant="ghost"
                  disabled={!hasFormData()}
                  fullWidth
                  size="lg"
                >
                  Clear Form
                </Button>
              </div>

              {/* Status Messages */}
              {entryError && (
                <div className="bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 rounded-lg p-4">
                  <p className="text-[var(--color-error)] text-sm">{entryError}</p>
                </div>
              )}

              {submittedEntry && (
                <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 rounded-lg p-4">
                  <p className="text-[var(--color-success)] text-sm font-medium">
                    ✅ Prediction submitted successfully!
                  </p>
                  <p className="text-[var(--color-text-secondary)] text-sm mt-1">
                    Submitted at {formatSubmissionTime(submittedEntry.submittedAt)}
                  </p>
                </div>
              )}

              {fixtureLocked && (
                <div className="bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 rounded-lg p-4">
                  <p className="text-[var(--color-warning)] text-sm">
                    ⏰ This fixture is now locked. No more predictions can be submitted.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[var(--color-text-secondary)]">Select a fixture to start predicting</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rules */}
      <Card>
        <CardHeader>
          <CardTitle size="lg">How to Play</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[var(--pl-neon)] rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Predict the final score of the selected fixture
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[var(--pl-magenta)] rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Select the first goalscorer of the match
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[var(--pl-cyan)] rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Submit before the fixture deadline to enter
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 