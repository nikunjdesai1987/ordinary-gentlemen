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
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="glass-card rounded-3xl p-8 text-center">
          <div className="animate-spin-slow w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Loading...</p>

        </div>
      </div>
    );
  }

  if (!user || !isWhitelisted) {
    return (
      <div>
        <LoginPage />

      </div>
    );
  }

  return <Dashboard />;
}

export default function Home() {
  return <AppContent />;
} 