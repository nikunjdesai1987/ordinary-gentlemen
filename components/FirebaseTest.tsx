'use client';

import { useState, useEffect } from 'react';
import { auth, provider } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

export default function FirebaseTest() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    // Get Firebase config
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };
    setConfig(firebaseConfig);

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const testSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Testing Firebase sign-in...');
      
      const result = await signInWithPopup(auth, provider);
      console.log('Sign-in successful:', result.user);
    } catch (error: any) {
      console.error('Sign-in error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const testSignOut = async () => {
    try {
      await signOut(auth);
      console.log('Sign-out successful');
    } catch (error: any) {
      console.error('Sign-out error:', error);
      setError(error.message);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Firebase Authentication Test</h2>
      
      {/* Configuration Display */}
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Configuration:</h3>
        <div className="text-xs space-y-1">
          <p><strong>Project ID:</strong> {config?.projectId || 'Not set'}</p>
          <p><strong>Auth Domain:</strong> {config?.authDomain || 'Not set'}</p>
          <p><strong>API Key:</strong> {config?.apiKey ? `${config.apiKey.substring(0, 10)}...` : 'Not set'}</p>
        </div>
      </div>

      {/* Current User */}
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Current User:</h3>
        {user ? (
          <div className="text-sm">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>UID:</strong> {user.uid}</p>
            <p><strong>Provider:</strong> {user.providerData[0]?.providerId}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-600">No user signed in</p>
        )}
      </div>

      {/* Test Buttons */}
      <div className="space-y-2">
        <button
          onClick={testSignIn}
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Signing in...' : 'Test Google Sign-In'}
        </button>
        
        {user && (
          <button
            onClick={testSignOut}
            className="w-full py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
          <h4 className="font-semibold">Error:</h4>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Troubleshooting Tips */}
      <div className="mt-4 p-3 bg-yellow-50 rounded">
        <h4 className="font-semibold text-yellow-800">Troubleshooting:</h4>
        <ul className="text-xs text-yellow-700 space-y-1 mt-2">
          <li>• Check Firebase Console &gt; Authentication &gt; Sign-in methods</li>
          <li>• Verify Google provider is enabled</li>
          <li>• Add domain to authorized domains</li>
          <li>• Check browser console for errors</li>
        </ul>
      </div>
    </div>
  );
}
