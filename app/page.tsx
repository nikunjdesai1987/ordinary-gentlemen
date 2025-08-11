'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/components/LoginPage';
import Dashboard from '@/components/Dashboard';

function AppContent() {
  const { user, loading, isWhitelisted } = useAuth();
  const router = useRouter();

  // Debug logging
  useEffect(() => {
    console.log('AppContent Debug:', {
      user: user ? { uid: user.uid, email: user.email } : null,
      loading,
      isWhitelisted
    });
  }, [user, loading, isWhitelisted]);

  useEffect(() => {
    if (!loading && user && !isWhitelisted) {
      // User is signed in but not whitelisted - they'll be signed out by the auth context
      router.push('/');
    }
  }, [user, loading, isWhitelisted, router]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center max-w-sm w-full">
          <div className="animate-spin-slow w-10 h-10 sm:w-12 sm:h-12 border-3 sm:border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4 sm:mb-6"></div>
          <p className="text-base sm:text-lg font-semibold text-gray-700">Loading...</p>
          <p className="text-sm sm:text-base text-gray-500 mt-2">Preparing your dashboard</p>
        </div>
      </div>
    );
  }

  if (!user || !isWhitelisted) {
    return (
      <div className="w-full">
        <LoginPage />
      </div>
    );
  }

  return <Dashboard />;
}

export default function Home() {
  return <AppContent />;
} 