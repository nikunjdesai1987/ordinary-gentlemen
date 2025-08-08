# Testing Deployment Guide

This guide explains how to set up test environments for the Ordinary Gentlemen FPL webapp to test different user roles and workflows.

## 🚀 Quick Start - Local Testing

### 1. Start Test Environment
```bash
# Start in test mode with mock data
npm run dev:test
```

### 2. Access Test Controls
- Look for the **yellow "TEST MODE"** indicator in the top-left
- Click the **blue "Show Test Controls"** button in the top-right
- Use the **Test User Management** section to switch between users

### 3. Available Test Users

| User Type | Email | Role | FPL ID | Access Level |
|-----------|-------|------|--------|--------------|
| Admin | admin@test.com | League Admin | 607394* | Full admin access |
| Regular User | user@test.com | Standard User | 3098228 | Basic features |
| Premium User | premium@test.com | Premium User | 3098229 | Extended features |

*Admin FPL ID should match your league's admin_entry for admin features to work

## 🏗️ Setting Up Staging Environment

### Option 1: Vercel Deployment (Recommended)

1. **Create a staging branch:**
   ```bash
   git checkout -b staging
   git push origin staging
   ```

2. **Deploy to Vercel:**
   - Connect your GitHub repository to Vercel
   - Create a new project for staging
   - Set the branch to `staging`

3. **Configure environment variables in Vercel:**
   ```
   NODE_ENV=test
   NEXT_PUBLIC_TEST_MODE=true
   NEXT_PUBLIC_MOCK_API=true
   ```

   Plus your Firebase configuration variables.

4. **Deploy:**
   - Vercel will auto-deploy when you push to staging branch

### Option 2: Manual Environment Setup

1. **Create test environment file:**
   ```bash
   cp .env.local .env.test.local
   ```

2. **Add test mode variables to .env.test.local:**
   ```
   NODE_ENV=test
   NEXT_PUBLIC_TEST_MODE=true
   NEXT_PUBLIC_MOCK_API=true
   ```

3. **Build and start:**
   ```bash
   npm run build:test
   npm run start:test
   ```

## 🧪 Testing Workflows

### Admin User Testing
1. Switch to Admin user in test controls
2. Verify Admin tab appears in navigation
3. Test admin features:
   - League configuration
   - Payout structure management
   - User management
   - Admin-only statistics

### Regular User Testing
1. Switch to Regular user
2. Verify limited access:
   - No Admin tab
   - Standard dashboard features
   - Basic predictions and standings

### Cross-User Testing
1. Switch between users to test:
   - Different permission levels
   - Data isolation
   - User-specific features

## 🌐 External Testing Setup

### Sharing Test Environment

1. **Deploy to a public URL:**
   - Use Vercel, Netlify, or similar
   - Set environment to test mode
   - Share the URL with testers

2. **Test user instructions for external testers:**
   ```
   1. Visit the test URL
   2. Look for "TEST MODE" indicator
   3. Click "Show Test Controls" button
   4. Use "Test User Management" to switch between user types
   5. Test different workflows as different users
   ```

### Production-Like Testing

1. **Use real Firebase project:**
   - Set up test users in Firestore whitelist
   - Use real authentication but test data

2. **Configure test users in Firestore:**
   ```
   Collection: whitelist
   Documents:
   - admin@test.com (with manager_fplid: your_admin_fpl_id)
   - user@test.com (with manager_fplid: test_user_fpl_id)
   ```

## 🔧 Test Scenarios

### Basic Functionality Test
- [ ] User authentication
- [ ] Dashboard loading
- [ ] Navigation between tabs
- [ ] Data persistence

### Admin Functionality Test
- [ ] Admin access verification
- [ ] League configuration
- [ ] Payout structure creation
- [ ] Admin panel features

### User Role Testing
- [ ] Admin vs regular user access
- [ ] Permission boundaries
- [ ] Feature availability by role

### Data Flow Testing
- [ ] Predictions submission
- [ ] League standings updates
- [ ] Score Strike functionality
- [ ] Statistics calculation

## 🐛 Troubleshooting

### Test Mode Not Working
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_TEST_MODE=true`
3. Clear browser storage and reload

### User Switching Issues
1. Hard refresh after switching (Ctrl+F5)
2. Check localStorage for currentTestUser
3. Verify test data initialization

### Admin Access Issues
1. Verify admin user FPL ID matches league admin
2. Check Firebase whitelist configuration
3. Review browser network tab for API calls

## 📋 Testing Checklist

### Pre-Deployment
- [ ] All test users configured
- [ ] Environment variables set
- [ ] Test data initialized
- [ ] Mock APIs responding

### User Testing
- [ ] Admin user can access admin features
- [ ] Regular users have restricted access
- [ ] User switching works correctly
- [ ] Data isolation maintained

### Feature Testing
- [ ] All tabs load correctly
- [ ] Predictions can be submitted
- [ ] League data displays
- [ ] Statistics calculate properly

### Cross-Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify environment configuration
3. Test with different user roles
4. Review this guide for troubleshooting steps

---

**Note:** This test environment uses mock data and simulated user scenarios. For production testing, ensure real user data and Firebase configuration are properly set up.