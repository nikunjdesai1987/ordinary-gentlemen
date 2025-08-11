# 🔥 Firebase Setup Checklist

## ✅ **Project Creation**
- [ ] Create new Firebase project
- [ ] Name: `ordinary-gentlemen-v2` (or your preferred name)
- [ ] Disable Google Analytics (optional)

## ✅ **Web App Setup**
- [ ] Add web app to project
- [ ] App nickname: `ordinary-gentlemen-web`
- [ ] Enable Firebase Hosting: ❌ (NOT needed - you use Vercel)
- [ ] Copy Firebase config object

## ✅ **Authentication Setup**
- [ ] Enable Authentication service
- [ ] Enable Google sign-in provider
- [ ] Set project support email
- [ ] Save authentication settings

## ✅ **Database Setup**
- [ ] Create Firestore Database
- [ ] Start in test mode
- [ ] Choose appropriate location
- [ ] Wait for database creation

## ✅ **Whitelist Collection**
- [ ] Create `whitelist` collection
- [ ] Add document: `nik.desai87@gmail.com`
  - [ ] `manager_fplid`: [your actual FPL ID]
  - [ ] `isAdmin`: `true`
- [ ] Add document: `desainikunj234@gmail.com`
  - [ ] `manager_fplid`: [test FPL ID]
  - [ ] `isAdmin`: `false`

## ✅ **Environment Configuration**
- [ ] Copy `firebase-config-template.txt` to `.env.local`
- [ ] Fill in new Firebase config values
- [ ] Restart development server

## ✅ **Testing**
- [ ] Test login with `nik.desai87@gmail.com`
- [ ] Test login with `desainikunj234@gmail.com`
- [ ] Both should work if properly configured

## 🔧 **Troubleshooting**
- [ ] Check browser console for errors
- [ ] Verify Google sign-in is enabled
- [ ] Ensure domain restrictions allow localhost
- [ ] Check Firestore rules allow read access

## 📝 **Notes**
- Keep your old Firebase project for reference
- New project will have fresh authentication state
- All users will need to sign in again
- Whitelist controls access, not Firebase Auth Users tab
