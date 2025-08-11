# Firebase Configuration Fix for "admin-restricted-operation" Error

## Problem
You're getting the error: `Firebase: Error (auth/admin-restricted-operation)` when trying to sign in with Google.

## Root Cause
This error occurs when Firebase Authentication is restricted or not properly configured in your Firebase project.

## Step-by-Step Fix

### 1. Enable Firebase Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your "Sports Fanatics" project
3. In the left sidebar, click **"Authentication"**
4. Click **"Get started"** if you haven't set up Authentication yet
5. Make sure Authentication is **enabled**

### 2. Enable Google Sign-In Provider
1. In the Authentication section, click **"Sign-in method"** tab
2. Find **"Google"** in the list of providers
3. Click on **"Google"**
4. Toggle the **"Enable"** switch to **ON**
5. Add your **Project support email** (your email)
6. Click **"Save"**

### 3. Add Authorized Domains
1. In the Authentication section, click **"Settings"** tab
2. Scroll down to **"Authorized domains"**
3. Click **"Add domain"**
4. Add these domains:
   - `localhost` (for development)
   - `127.0.0.1` (for development)
   - Your production domain (if you have one)
5. Click **"Add"**

### 4. Check Project Settings
1. In the left sidebar, click the **gear icon** (⚙️) next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Make sure your web app is listed and properly configured
5. If not, click **"Add app"** and select **"Web"**

### 5. Verify Environment Variables
Make sure your `.env.local` file has the correct Firebase configuration:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sports-fanatics.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sports-fanatics
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sports-fanatics.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=395597688864
NEXT_PUBLIC_FIREBASE_APP_ID=1:395597688864:web:18fede5640a84ff271cc45
```

### 6. Test the Fix
1. Restart your development server: `npm run dev`
2. Try signing in with Google again
3. Check the browser console for any remaining errors

## Common Issues and Solutions

### Issue: "Authentication is not enabled"
**Solution**: Follow Step 1 above to enable Firebase Authentication.

### Issue: "Google provider not enabled"
**Solution**: Follow Step 2 above to enable Google Sign-In.

### Issue: "Domain not authorized"
**Solution**: Follow Step 3 above to add localhost to authorized domains.

### Issue: "Invalid API key"
**Solution**: Check your environment variables and make sure they match your Firebase project settings.

## Verification Steps

After making the changes, you should see:

1. ✅ **Firebase Authentication** shows as enabled
2. ✅ **Google** appears as an enabled sign-in method
3. ✅ **localhost** appears in authorized domains
4. ✅ **No more "admin-restricted-operation" errors**

## Still Having Issues?

If you're still getting errors after following these steps:

1. **Clear browser cache** and try again
2. **Check Firebase Console** for any error messages
3. **Verify your Firebase project ID** matches your configuration
4. **Check if your Firebase project is on the correct plan** (Spark plan should work for basic authentication)

## Support

If none of these steps resolve the issue, check:
- Firebase Console error logs
- Browser console for additional error details
- Firebase project billing status
- Firebase project region settings
