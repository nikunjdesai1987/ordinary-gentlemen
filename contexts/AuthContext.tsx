'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, provider, db } from '@/lib/firebase';
import { dbUtils } from '@/lib/database';
import { fplApi } from '@/lib/fpl-api';
import TestUtils from '@/lib/test-utils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  isWhitelisted: boolean;
  managerFplId: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, loading, error] = useAuthState(auth);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [testUser, setTestUser] = useState<User | null>(null);
  const [managerFplId, setManagerFplId] = useState<number | null>(null);

  // Check if we're in test mode
  const isTestMode = TestUtils.isTestMode();

  useEffect(() => {
    if (isTestMode) {
      // In test mode, automatically create a test user
      initializeTestUser();
    } else if (user) {
      // Normal authentication flow
      checkWhitelistStatus(user.email!);
      saveUserToLocalDB(user);
      fetchManagerFplId(user.email!);
    } else {
      setIsWhitelisted(false);
      setManagerFplId(null);
    }
  }, [user, isTestMode]);

  const initializeTestUser = async () => {
    try {
      console.log('🔄 Initializing test user...');
      // Get current test user from TestUtils
      const currentTestUser = TestUtils.getCurrentTestUser();
      
      // Create a mock test user
      const mockUser: User = {
        uid: currentTestUser.uid,
        email: currentTestUser.email,
        displayName: currentTestUser.displayName,
        photoURL: currentTestUser.photoURL,
        phoneNumber: null,
        providerId: 'google.com',
        emailVerified: true,
        isAnonymous: false,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
        providerData: [],
        refreshToken: 'test-refresh-token',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => 'test-id-token',
        getIdTokenResult: async () => ({
          authTime: new Date().toISOString(),
          expirationTime: new Date(Date.now() + 3600000).toISOString(),
          issuedAtTime: new Date().toISOString(),
          signInProvider: 'google.com',
          signInSecondFactor: null,
          token: 'test-token',
          claims: {},
        }),
        reload: async () => {},
        toJSON: () => ({}),
      };

      setTestUser(mockUser);
      setIsWhitelisted(true);
      setManagerFplId(currentTestUser.managerFplId); // Use dynamic manager FPL ID
      
      // Save test user to local database (with error handling)
      try {
        await dbUtils.saveUser({
          uid: mockUser.uid,
          email: mockUser.email!,
          displayName: mockUser.displayName!,
          photoURL: mockUser.photoURL!,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log('Test user saved to local database successfully');
      } catch (dbError) {
        console.warn('Could not save test user to local database (this is normal in some environments):', dbError);
        // Continue anyway - the user is still authenticated
      }

      console.log('✅ Test user initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing test user:', error);
      // Set a fallback test user even if initialization fails
      const fallbackUser: User = {
        uid: 'test-fallback-123',
        email: 'fallback@test.com',
        displayName: 'Test User',
        photoURL: 'https://lh3.googleusercontent.com/a/test-fallback',
        phoneNumber: null,
        providerId: 'google.com',
        emailVerified: true,
        isAnonymous: false,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
        providerData: [],
        refreshToken: 'test-refresh-token',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => 'test-id-token',
        getIdTokenResult: async () => ({
          authTime: new Date().toISOString(),
          expirationTime: new Date(Date.now() + 3600000).toISOString(),
          issuedAtTime: new Date().toISOString(),
          signInProvider: 'google.com',
          signInSecondFactor: null,
          token: 'test-token',
          claims: {},
        }),
        reload: async () => {},
        toJSON: () => ({}),
      };
      setTestUser(fallbackUser);
      setIsWhitelisted(true);
      setManagerFplId(123456); // Default test user FPL ID
    }
  };

  const checkWhitelistStatus = async (email: string) => {
    try {
      const whitelistRef = doc(db, 'whitelist', email);
      const docSnap = await getDoc(whitelistRef);
      setIsWhitelisted(docSnap.exists());
    } catch (error) {
      console.error('Error checking whitelist status:', error);
      setIsWhitelisted(false);
    }
  };

  const saveUserToLocalDB = async (user: User) => {
    try {
      await dbUtils.saveUser({
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || 'Unknown User',
        photoURL: user.photoURL || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error saving user to local DB:', error);
    }
  };

  const fetchManagerFplId = async (email: string) => {
    try {
      console.log('Fetching manager FPL ID from Firebase for email:', email);
      
      // First, try to get manager_fplid from Firebase whitelist
      const whitelistRef = doc(db, 'whitelist', email);
      const whitelistDoc = await getDoc(whitelistRef);
      
      if (whitelistDoc.exists()) {
        const whitelistData = whitelistDoc.data();
        console.log('Whitelist data:', whitelistData);
        
        if (whitelistData.manager_fplid) {
          const fplId = whitelistData.manager_fplid;
          console.log('Found manager FPL ID in Firebase whitelist:', fplId, 'Type:', typeof fplId);
          setManagerFplId(fplId);
          
          // Also store in users collection for consistency
          const userRef = doc(db, 'users', email);
          await setDoc(userRef, { manager_fplid: fplId }, { merge: true });
          return;
        } else {
          console.log('No manager_fplid found in whitelist data');
        }
      } else {
        console.log('User not found in whitelist');
      }
      
      // Fallback: Try to match by email (for backward compatibility)
      console.log('No manager_fplid in Firebase whitelist, trying email matching...');
      const fplId = await fplApi.getManagerFplIdByEmail(607394, email);
      
      if (fplId) {
        console.log('Found manager FPL ID via email matching:', fplId, 'Type:', typeof fplId);
        setManagerFplId(fplId);
        
        // Store the manager_fplid in Firestore for future reference
        const userRef = doc(db, 'users', email);
        await setDoc(userRef, { manager_fplid: fplId }, { merge: true });
      } else {
        console.log('No manager FPL ID found for email:', email);
        setManagerFplId(null);
      }
    } catch (error) {
      console.error('Error fetching manager FPL ID:', error);
      setManagerFplId(null);
    }
  };

  const signIn = async () => {
    if (isTestMode) {
      // In test mode, just initialize the test user
      await initializeTestUser();
      return;
    }

    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;
      
      if (!email) {
        throw new Error('No email provided by Google');
      }

      // Check Firestore whitelist
      const whitelistRef = doc(db, 'whitelist', email);
      const docSnap = await getDoc(whitelistRef);

      if (!docSnap.exists()) {
        await signOut(auth);
        throw new Error('Access Denied: You are not part of the league.');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (isTestMode) {
      // In test mode, just clear the test user
      setTestUser(null);
      setIsWhitelisted(false);
      return;
    }

    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Use test user if in test mode, otherwise use real user
  const currentUser = isTestMode ? testUser : user;
  const currentLoading = isTestMode ? false : loading;

  const value = {
    user: currentUser || null,
    loading: currentLoading,
    error: error as Error | null,
    signIn,
    logout,
    isWhitelisted,
    managerFplId,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 