'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setMessage('');
      await signIn();
      
      setMessage('Welcome! Redirecting...');
    } catch (error) {
      console.error("Login error:", error);
      setMessage(error instanceof Error ? error.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden flex items-center justify-center font-sans">
      {/* Animated background elements */}
      <div className="absolute inset-0 gradient-bg"></div>
      <div className="absolute inset-0">
        <div className="absolute top-[10%] left-[8%] text-4xl opacity-15 floating-shape">⚽</div>
        <div className="absolute top-[20%] right-[12%] text-3xl opacity-12 floating-shape-reverse">🏆</div>
        <div className="absolute bottom-[30%] left-[15%] text-2xl opacity-10 floating-shape">⚽</div>
        <div className="absolute bottom-[20%] right-[8%] text-3xl opacity-13 floating-shape-reverse">🏆</div>
        <div className="absolute top-[60%] left-[5%] text-2xl opacity-8 floating-shape">🎯</div>
        <div className="absolute top-[40%] right-[5%] text-xl opacity-9 floating-shape-reverse">🔥</div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col items-center gap-10 max-w-lg w-[90%] z-10">
        <div className="text-center text-white mb-2">
          <h1 className="text-5xl font-extrabold mb-4 text-gradient drop-shadow-lg tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
            Ordinary Gentlemen
          </h1>
          <p className="text-2xl opacity-95 font-semibold drop-shadow-md">
            Where Football Knowledge Meets Fantasy Glory
          </p>
        </div>

        <div className="glass-card rounded-3xl p-12 w-full max-w-lg shadow-2xl relative overflow-hidden">
          <div className="text-center mb-9">
            <h2 className="text-4xl font-extrabold mb-3 text-gradient drop-shadow-md">
              🎯 Join the League!
            </h2>
            <p className="text-lg text-gray-600 font-medium">
              Test your football IQ against the best
            </p>
          </div>

          <div className="mb-9">
            <div className="flex items-center gap-4 mb-5 text-base text-gray-700 font-medium py-3">
              <span className="text-2xl">🎯</span>
              <span>Master tactical formations</span>
            </div>
            <div className="flex items-center gap-4 mb-5 text-base text-gray-700 font-medium py-3">
              <span className="text-2xl">📈</span>
              <span>Track player performance</span>
            </div>
            <div className="flex items-center gap-4 mb-5 text-base text-gray-700 font-medium py-3">
              <span className="text-2xl">🏆</span>
              <span>Compete for league supremacy</span>
            </div>
            <div className="flex items-center gap-4 mb-5 text-base text-gray-700 font-medium py-3">
              <span className="text-2xl">⚽</span>
              <span>Live matchday excitement</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin} 
            disabled={loading}
            className={`w-full py-4 rounded-2xl text-lg font-bold transition-all duration-300 shadow-lg relative overflow-hidden ${
              loading 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'btn-primary'
            }`}
          >
            <div className="flex items-center justify-center gap-4">
              {loading ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span className="text-lg font-bold">
                {loading ? 'Signing in...' : 'Continue with Google'}
              </span>
            </div>
          </button>

                  {/* Error/Success Message */}
        {message && (
          <div className={`mt-6 p-4 rounded-lg text-center ${
            message.includes('Welcome') || message.includes('successful')
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            <p className="font-medium">{message}</p>
          </div>
        )}

          
        </div>
      </div>
    </div>
  );
} 