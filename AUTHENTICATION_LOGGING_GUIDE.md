# Authentication Logging Guide

## Overview
The authentication system now includes comprehensive logging that tracks every step of the login process. This guide explains what to look for in the browser console to debug authentication issues.

## How to View Logs
1. **Open Browser Console**: Press `F12` or right-click → "Inspect" → "Console" tab
2. **Clear Console**: Click the 🚫 icon or press `Ctrl+L` (Cmd+L on Mac)
3. **Try to Login**: Attempt to sign in with Google
4. **Review Logs**: Look for the detailed step-by-step logs

## Login Process Flow & Logs

### 🔐 **STEP 0: Google Sign-In Popup**
```
🔐 ===== STARTING GOOGLE SIGN-IN PROCESS =====
🌐 Current domain: localhost
📱 User agent: [browser info]
🔑 Firebase config check: { apiKey: "✅ Set", authDomain: "✅ Set", projectId: "✅ Set" }
🚀 Step 0: Initiating Google Sign-In popup...
✅ Step 0: Google Sign-In popup successful
👤 User details from Google: { uid: "...", email: "...", displayName: "...", emailVerified: true }
```

**What to Check:**
- ✅ All Firebase config values should show "✅ Set"
- ✅ Google popup should complete successfully
- ✅ User details should be populated

**Common Issues:**
- ❌ Missing Firebase config values
- ❌ Google popup fails or is blocked
- ❌ No user details returned

### 📋 **STEP 1: Whitelist Verification**
```
📋 ===== STEP 1: WHITELIST VERIFICATION =====
🔍 Checking whitelist for email: user@example.com
🗄️ Firestore database reference: whitelist/user@example.com
📡 Making Firestore API call to: whitelist/user@example.com
⏱️ Firestore API call completed in: 150ms
📄 Document snapshot result: { exists: true, id: "user@example.com", metadata: {...} }
✅ Step 1: User found in whitelist: user@example.com
```

**What to Check:**
- ✅ Email should match exactly what's in Firestore
- ✅ Document should exist (`exists: true`)
- ✅ API call should complete successfully

**Common Issues:**
- ❌ User not found in whitelist (`exists: false`)
- ❌ Firestore API call fails
- ❌ Email case sensitivity issues

### 🔑 **STEP 2: Manager FPL ID Verification**
```
🔑 ===== STEP 2: MANAGER FPL ID VERIFICATION =====
📊 Complete whitelist document data: { manager_fplid: 1234567 }
🎯 Manager FPL ID from whitelist: 1234567
🔢 Data type check: { value: 1234567, type: "number", isNumber: true, isString: false }
✅ Step 2: Found manager_fplid in whitelist: 1234567
```

**What to Check:**
- ✅ `manager_fplid` field should exist
- ✅ Value should be a valid number
- ✅ No missing or null values

**Common Issues:**
- ❌ Missing `manager_fplid` field
- ❌ `manager_fplid` is null or undefined
- ❌ Wrong data type (string instead of number)

### 🌐 **STEP 3: FPL API Verification**
```
🌐 ===== STEP 3: FPL API VERIFICATION =====
📊 Step 3: Verifying user in FPL league...
🔗 FPL API endpoint: https://fantasy.premierleague.com/api/leagues-classic/607394/standings/
🎯 League ID being checked: 607394
👤 Manager FPL ID to verify: 1234567
📡 Making FPL API call to get league standings...
⏱️ FPL API call completed in: 800ms
📊 FPL API response structure: { hasLeague: true, hasStandings: true, hasResults: true, resultsCount: 25 }
👑 Admin entry from FPL API: 1234567
👤 Manager FPL ID from whitelist: 1234567
🔢 Converted values for comparison: { adminEntry: "1234567", adminEntryNum: 1234567, managerFplIdFromWhitelist: 1234567, managerFplIdNum: 1234567 }
👑 Admin check result: true
✅ Step 3: User is the league admin
```

**What to Check:**
- ✅ FPL API call should complete successfully
- ✅ Response should contain league data
- ✅ Admin check or member check should pass

**Common Issues:**
- ❌ FPL API call fails (network error, rate limiting)
- ❌ User not found in league standings
- ❌ Mismatch between whitelist FPL ID and actual FPL team

### ✅ **STEP 4: Final Authentication**
```
✅ ===== STEP 4: FINAL AUTHENTICATION =====
🎉 ===== LOGIN SUCCESSFUL =====
✅ User authenticated and verified in whitelist
👤 Final user state: { email: "user@example.com", managerFplId: 1234567, isWhitelisted: true }
```

**What to Check:**
- ✅ All steps should complete successfully
- ✅ User state should be properly set
- ✅ No errors in the process

## Error Logs & Troubleshooting

### Firebase Authentication Errors
```
❌ ===== SIGN IN ERROR =====
❌ Sign in error: FirebaseError: Firebase: Error (auth/admin-restricted-operation)
❌ Error details: { name: "FirebaseError", message: "...", code: "auth/admin-restricted-operation" }
🔍 Firebase error code: auth/admin-restricted-operation
🔒 Firebase Authentication is restricted. This usually means:
   1. Firebase Authentication is disabled in Firebase Console
   2. Google Sign-In provider is not enabled
   3. Domain restrictions are blocking localhost
   4. Firebase project has authentication restrictions
```

**Solution**: Follow the Firebase Configuration Fix guide

### Whitelist Errors
```
❌ Step 1: User not found in whitelist: user@example.com
🗑️ Signing out user due to whitelist failure
```

**Solution**: Add user email to Firestore whitelist collection

### FPL ID Errors
```
❌ Step 2: No manager_fplid found in whitelist for: user@example.com
📋 Available fields in whitelist: ["email", "other_field"]
```

**Solution**: Add `manager_fplid` field to whitelist document

### FPL API Errors
```
⚠️ FPL API verification failed, allowing access based on whitelist
❌ FPL API error details: { name: "Error", message: "Network Error" }
```

**Solution**: Check internet connection, FPL API status, or rate limiting

## Debugging Checklist

### Before Testing
- [ ] Firebase project is properly configured
- [ ] Google Sign-In is enabled
- [ ] localhost is in authorized domains
- [ ] User email is in whitelist collection
- [ ] Whitelist document has `manager_fplid` field

### During Testing
- [ ] Clear browser console
- [ ] Attempt login
- [ ] Check each step in the logs
- [ ] Look for ❌ error indicators
- [ ] Note response times and data structures

### Common Debugging Commands
```javascript
// Check Firebase config in console
console.log('Firebase config:', {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
});

// Check current user state
console.log('Current user:', auth.currentUser);

// Check whitelist status
console.log('Whitelist status:', isWhitelisted);
```

## Example Successful Login Log
```
🔐 ===== STARTING GOOGLE SIGN-IN PROCESS =====
🌐 Current domain: localhost
🔑 Firebase config check: { apiKey: "✅ Set", authDomain: "✅ Set", projectId: "✅ Set" }
🚀 Step 0: Initiating Google Sign-In popup...
✅ Step 0: Google Sign-In popup successful
👤 User details from Google: { uid: "abc123", email: "user@example.com", displayName: "User Name" }
📋 ===== STEP 1: WHITELIST VERIFICATION =====
🔍 Checking whitelist for email: user@example.com
✅ Step 1: User found in whitelist: user@example.com
🔑 ===== STEP 2: MANAGER FPL ID VERIFICATION =====
✅ Step 2: Found manager_fplid in whitelist: 1234567
🌐 ===== STEP 3: FPL API VERIFICATION =====
✅ Step 3: User is the league admin
✅ ===== STEP 4: FINAL AUTHENTICATION =====
🎉 ===== LOGIN SUCCESSFUL =====
✅ User authenticated and verified in whitelist
```

## Support
If you're still having issues after reviewing the logs:
1. **Copy the complete console output**
2. **Note which step is failing**
3. **Check the specific error messages**
4. **Verify Firebase and Firestore configuration**
5. **Ensure user is properly whitelisted**
