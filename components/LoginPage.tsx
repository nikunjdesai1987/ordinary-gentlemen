'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'

export default function LoginPage() {
  const { signIn, loading, error } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleSignIn = async () => {
    setIsSigningIn(true)
    try {
      await signIn()
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center safe-area-inset">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-pattern opacity-20"></div>
      
      {/* Floating Shapes */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-[var(--pl-magenta)] to-[var(--pl-cyan)] rounded-full opacity-20 float"></div>
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-gradient-to-r from-[var(--pl-neon)] to-[var(--pl-cyan)] rounded-full opacity-20 float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-gradient-to-r from-[var(--pl-purple-700)] to-[var(--pl-magenta)] rounded-full opacity-30 float" style={{ animationDelay: '4s' }}></div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[var(--pl-magenta)] to-[var(--pl-cyan)] rounded-2xl mb-6">
            <span className="text-white text-3xl font-bold">OG</span>
          </div>
          
          <h1 className="text-gradient-hero text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
            Ordinary Gentlemen
          </h1>
          
          <p className="text-[var(--color-text-secondary)] text-lg sm:text-xl font-medium max-w-sm mx-auto">
            Where Football Knowledge Meets Fantasy Glory
          </p>
        </div>

        {/* Login Card */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle size="lg" className="text-center">
              Welcome to FPL League
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Feature List */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                <div className="w-2 h-2 bg-[var(--pl-neon)] rounded-full"></div>
                <span className="text-sm">Score & Strike predictions</span>
              </div>
              <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                <div className="w-2 h-2 bg-[var(--pl-magenta)] rounded-full"></div>
                <span className="text-sm">Live league standings</span>
              </div>
              <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                <div className="w-2 h-2 bg-[var(--pl-cyan)] rounded-full"></div>
                <span className="text-sm">Weekly winners & prizes</span>
              </div>
            </div>

            {/* Sign In Button */}
            <Button
              onClick={handleSignIn}
              disabled={loading || isSigningIn}
              loading={isSigningIn}
              fullWidth
              size="lg"
              className="bg-gradient-to-r from-[var(--pl-neon)] to-[var(--pl-cyan)] hover:from-[var(--pl-neon)] hover:to-[var(--pl-cyan)] hover:opacity-90"
            >
              {loading || isSigningIn ? (
                <>
                  <div className="loading-spinner w-5 h-5 mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </>
              )}
            </Button>

            {/* Error Display */}
            {error && (
              <div className="bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-[var(--color-error)] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[var(--color-error)] font-semibold text-sm mb-1">
                      Sign In Failed
                    </h3>
                    <p className="text-[var(--color-text-secondary)] text-sm">
                      {error.message || 'Unable to sign in. Please try again.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="text-center">
              <p className="text-[var(--color-text-secondary)] text-sm">
                By signing in, you agree to our terms and conditions
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-[var(--color-text-secondary)] text-sm">
            Powered by Fantasy Premier League
          </p>
        </div>
      </div>
    </div>
  )
} 