'use client';

/**
 * Authentication Context for the Sports Fanatics application
 * 
 * Authentication Flow:
 * 1. User signs in with Google OAuth
 * 2. Check if user email exists in Firestore whitelist collection
 * 3. Verify manager_fplid exists in whitelist document
 * 4. (Optional) Verify user is in FPL league standings (for admin detection)
 * 5. Grant access if whitelisted
 * 
 * Note: FPL league membership verification is optional and won't block
 * whitelisted users from logging in. This allows flexibility for users
 * who may have been removed from the league or haven't joined yet.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, provider, db } from '@/lib/firebase';
import { dbUtils } from '@/lib/database';
import { fplApi } from '@/lib/fpl-api';


interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  isWhitelisted: boolean;
  managerFplId: number | null;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, loading, error] = useAuthState(auth);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [managerFplId, setManagerFplId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const skipWhitelist = process.env.NEXT_PUBLIC_SKIP_WHITELIST === 'true';

  useEffect(() => {
    console.log('🔄 AuthContext useEffect triggered:', { user: user?.email });
    
    if (user) {
      // Normal authentication flow - user is already authenticated and verified
      console.log('👤 Real user detected, user already authenticated and verified');
      console.log('🔍 User details:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      });
      
      try {
        console.log('📋 Checking whitelist status for authenticated user...');
        checkWhitelistStatus(user.email!);
        console.log('💾 Saving user to local database...');
        saveUserToLocalDB(user);
        // Note: managerFplId is already set during login process
        console.log('✅ User processing completed');
      } catch (error) {
        console.error('❌ Error in authentication flow:', error);
      }
    } else {
      console.log('🚪 No user, clearing state');
      setIsWhitelisted(false);
      setManagerFplId(null);
      setIsAdmin(false);
    }
  }, [user]);



  const checkWhitelistStatus = async (email: string) => {
    try {
      if (skipWhitelist) {
        console.warn('⚠️ Skipping whitelist status check for development');
        setIsWhitelisted(true);
        return;
      }
      console.log('🔍 Checking whitelist status for email:', email);
      const whitelistRef = doc(db, 'whitelist', email);
      const docSnap = await getDoc(whitelistRef);
      const exists = docSnap.exists();
      console.log('📋 Whitelist check result:', { email, exists });
      
      if (exists) {
        const data = docSnap.data();
        console.log('📊 Whitelist data:', data);
      }
      
      setIsWhitelisted(exists);
    } catch (error) {
      console.error('❌ Error checking whitelist status:', error);
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

  // Note: fetchManagerFplId is no longer needed as we handle FPL ID verification during login

  const signIn = async () => {

    try {
      console.log('🔐 ===== STARTING GOOGLE SIGN-IN PROCESS =====');
      console.log('🌐 Current domain:', typeof window !== 'undefined' ? window.location.hostname : 'server-side');
      console.log('📱 User agent:', typeof window !== 'undefined' ? window.navigator.userAgent : 'server-side');
      console.log('🔑 Firebase config check:', {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'
      });
      
      console.log('🚀 Step 0: Initiating Google Sign-In popup...');
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Step 0: Google Sign-In popup successful');
      console.log('👤 User details from Google:', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        emailVerified: result.user.emailVerified,
        providerId: result.user.providerId
      });
      
      const email = result.user.email;
      
      if (!email) {
        console.error('❌ Step 0: No email provided by Google');
        throw new Error('No email provided by Google');
      }

      console.log('📋 ===== STEP 1: WHITELIST VERIFICATION =====');
      console.log('🔍 Checking whitelist for email:', email);
      console.log('🗄️ Firestore database reference:', `whitelist/${email}`);
      
      // Step 1: Check Firestore whitelist
      const whitelistRef = doc(db, 'whitelist', email);
      console.log('📡 Making Firestore API call to:', `whitelist/${email}`);
      
      const startTime = Date.now();
      const docSnap = await getDoc(whitelistRef);
      const endTime = Date.now();
      
      console.log('⏱️ Firestore API call completed in:', endTime - startTime, 'ms');
      console.log('📄 Document snapshot result:', {
        exists: docSnap.exists(),
        id: docSnap.id,
        metadata: docSnap.metadata
      });

      if (!docSnap.exists()) {
        if (skipWhitelist) {
          console.warn('⚠️ Step 1: User not found in whitelist; skipping enforcement for development');
        } else {
          console.error('❌ Step 1: User not found in whitelist:', email);
          console.log('🗑️ Signing out user due to whitelist failure');
          await signOut(auth);
          throw new Error('Access Denied: You are not part of the league.');
        }
      } else {
        console.log('✅ Step 1: User found in whitelist:', email);
      }
      
      console.log('🔑 ===== STEP 2: MANAGER FPL ID =====');
      // Step 2: Get manager_fplid from whitelist
      const whitelistData = docSnap.data() || {};
      console.log('📊 Complete whitelist document data:', whitelistData);

      const managerFplIdFromWhitelist = whitelistData.manager_fplid;
      console.log('🎯 Manager FPL ID from whitelist:', managerFplIdFromWhitelist);
      console.log('🔢 Data type check:', {
        value: managerFplIdFromWhitelist,
        type: typeof managerFplIdFromWhitelist,
        isNumber: typeof managerFplIdFromWhitelist === 'number',
        isString: typeof managerFplIdFromWhitelist === 'string'
      });

      if (!managerFplIdFromWhitelist) {
        console.warn('⚠️ Step 2: No manager_fplid found in whitelist; proceeding without it');
      } else {
        console.log('✅ Step 2: Found manager_fplid in whitelist:', managerFplIdFromWhitelist);
      }
      
      if (managerFplIdFromWhitelist) {
        console.log('🌐 ===== STEP 3: FPL API VERIFICATION =====');
        // Step 3: Verify user is in league by checking FPL API (only if manager_fplid available)
        console.log('📊 Step 3: Verifying user in FPL league...');
        console.log('🔗 FPL API endpoint:', `https://fantasy.premierleague.com/api/leagues-classic/607394/standings/`);
        console.log('🎯 League ID being checked:', 607394);
        console.log('👤 Manager FPL ID to verify:', managerFplIdFromWhitelist);

        try {
          console.log('📡 Making FPL API call to get league standings...');
          const fplStartTime = Date.now();
          const standings = await fplApi.getLeagueStandings(607394);
          const fplEndTime = Date.now();

          console.log('⏱️ FPL API call completed in:', fplEndTime - fplStartTime, 'ms');
          console.log('📊 FPL API response structure:', {
            hasLeague: !!standings.league,
            hasStandings: !!standings.standings,
            hasResults: !!standings.standings?.results,
            resultsCount: standings.standings?.results?.length || 0
          });

          const adminEntry = standings.league?.admin_entry;
          console.log('👑 Admin entry from FPL API:', adminEntry);
          console.log('👤 Manager FPL ID from whitelist:', managerFplIdFromWhitelist);

          // Check if user is either the admin or a member of the league
          const adminEntryNum = Number(adminEntry);
          const managerFplIdNum = Number(managerFplIdFromWhitelist);

          console.log('🔢 Converted values for comparison:', {
            adminEntry: adminEntry,
            adminEntryNum: adminEntryNum,
            managerFplIdFromWhitelist: managerFplIdFromWhitelist,
            managerFplIdNum: managerFplIdNum
          });

          // First, check if user is the admin
          const isAdminUser = adminEntryNum === managerFplIdNum;
          console.log('👑 Admin check result:', isAdminUser);
          
          // Set admin status in context state
          setIsAdmin(isAdminUser);

          if (isAdminUser) {
            console.log('✅ Step 3: User is the league admin');
          } else {
            // If not admin, check if user is a member of the league
            const leagueMembers = standings.standings?.results || [];
            console.log('👥 Total league members found:', leagueMembers.length);
            console.log('🔍 Searching for manager FPL ID:', managerFplIdNum);

            // Log first few members for debugging
            if (leagueMembers.length > 0) {
              console.log('📋 Sample league members (first 5):', leagueMembers.slice(0, 5).map((m: any) => ({
                entry: m.entry,
                player_name: `${m.player_first_name} ${m.player_last_name}`,
                entry_name: m.entry_name
              })));
            }

            const isMember = leagueMembers.some((member: any) => {
              const memberEntry = Number(member.entry);
              const matches = memberEntry === managerFplIdNum;
              if (matches) {
                console.log('🎯 Found matching member:', {
                  entry: member.entry,
                  player_name: `${member.player_first_name} ${member.player_last_name}`,
                  entry_name: member.entry_name
                });
              }
              return matches;
            });

            if (isMember) {
              console.log('✅ Step 3: User is a league member');
            } else {
              // User is not currently in league standings, but they are whitelisted
              // This could happen if they were removed from league or haven't joined yet
              console.log('⚠️ Step 3: User not currently in FPL league standings, but whitelisted');
              console.log('📝 Allowing access based on whitelist status');
              console.log('💡 This could happen if:');
              console.log('   - User was removed from the league');
              console.log('   - User hasn\'t joined the league yet');
              console.log('   - There\'s a mismatch between whitelist FPL ID and actual FPL team');
            }
          }
        } catch (fplApiError: any) {
          // If FPL API fails, still allow access based on whitelist
          console.warn('⚠️ FPL API verification failed, allowing access based on whitelist');
          console.error('❌ FPL API error details:', {
            name: fplApiError.name,
            message: fplApiError.message,
            stack: fplApiError.stack
          });
          console.log('📝 User is whitelisted, allowing access despite FPL API failure');
        }
      } else {
        console.log('⏭️ Skipping STEP 3 (FPL API verification) because manager_fplid is not provided');
        // Set admin status to false when no manager_fplid is available
        setIsAdmin(false);
      }
      
      console.log('✅ ===== STEP 4: FINAL AUTHENTICATION =====');
      // Step 4: Set whitelist status; set manager FPL ID only if available
      if (managerFplIdFromWhitelist) {
        setManagerFplId(Number(managerFplIdFromWhitelist));
      }
      setIsWhitelisted(true);

      console.log('🎉 ===== LOGIN SUCCESSFUL =====');
      console.log('✅ User authenticated and verified in whitelist');
      console.log('👤 Final user state:', {
        email: email,
        managerFplId: managerFplIdFromWhitelist ?? null,
        isWhitelisted: true
      });
      
    } catch (error: any) {
      console.error('❌ ===== SIGN IN ERROR =====');
      console.error('❌ Sign in error:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Log additional Firebase-specific error information
      if (error.code) {
        console.error('🔍 Firebase error code:', error.code);
      }
      if (error.customData) {
        console.error('🔍 Firebase custom data:', error.customData);
      }
      if (error.credential) {
        console.error('🔍 Firebase credential:', error.credential);
      }
      
      // Provide more specific error messages based on the error type
      if (error.code === 'auth/admin-restricted-operation') {
        console.error('🔒 Firebase Authentication is restricted. This usually means:');
        console.error('   1. Firebase Authentication is disabled in Firebase Console');
        console.error('   2. Google Sign-In provider is not enabled');
        console.error('   3. Domain restrictions are blocking localhost');
        console.error('   4. Firebase project has authentication restrictions');
        throw new Error('Firebase Authentication is restricted. Please check Firebase Console settings: Enable Authentication > Sign-in method > Google.');
      } else if (error.message && error.message.includes('ADMIN_ONLY_OPERATION')) {
        throw new Error('Authentication operation requires admin privileges. Please check Firebase project settings.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for Firebase Authentication. Please add localhost to authorized domains in Firebase Console.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Google Sign-In is not enabled. Please enable it in Firebase Console: Authentication > Sign-in method > Google.');
      }
      
      throw error;
    }
  };

  const logout = async () => {

    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user: user || null,
    loading: loading,
    error: error as Error | null,
    signIn,
    logout,
    isWhitelisted,
    managerFplId,
    isAdmin,
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