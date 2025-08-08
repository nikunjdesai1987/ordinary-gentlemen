# Vercel Deployment Guide

This guide walks you through setting up a complete deployment strategy for the Ordinary Gentlemen FPL webapp on Vercel with separate environments for production, staging, and development.

## 🎯 Deployment Strategy Overview

```
GitHub Repository
├── main branch → Production (ordinary-gentlemen.vercel.app)
├── staging branch → Staging (ordinary-gentlemen-staging.vercel.app)
└── development branch → Development (ordinary-gentlemen-dev.vercel.app)
```

## 🚀 Quick Setup

### 1. Run the Setup Script
```bash
# Make the script executable
chmod +x scripts/setup-vercel-deployment.sh

# Run the setup script
./scripts/setup-vercel-deployment.sh
```

This script will:
- Create staging and development branches
- Set up environment configuration files
- Update package.json with deployment scripts
- Create deployment automation scripts

### 2. Complete Vercel Setup
Follow the instructions provided by the setup script to:
- Create Vercel account
- Connect your GitHub repository
- Set up three separate Vercel projects
- Configure environment variables

## 📋 Detailed Setup Steps

### Step 1: Vercel Account & Repository Connection

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account
   - Authorize Vercel to access your repositories

2. **Import Repository**
   - Click "New Project" in Vercel dashboard
   - Select "Import Git Repository"
   - Choose your `ordinary-gentlemen` repository
   - Click "Import"

### Step 2: Production Project Setup

1. **Configure Production Project**
   ```
   Project Name: ordinary-gentlemen
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   Development Command: npm run dev
   ```

2. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.production.local`
   - Set environment to "Production" only
   - Variables to add:
     ```
     NODE_ENV=production
     NEXT_PUBLIC_TEST_MODE=false
     NEXT_PUBLIC_MOCK_API=false
     NEXT_PUBLIC_FIREBASE_API_KEY=your_production_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_production_auth_domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_production_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_production_storage_bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_production_messaging_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_production_app_id
     ```

3. **Configure Domain**
   - Go to Project Settings → Domains
   - Add your custom domain (e.g., `ordinary-gentlemen.com`)
   - Or use the default Vercel subdomain

### Step 3: Staging Project Setup

1. **Create Staging Project**
   - Click "New Project" again
   - Import the same repository
   - Name: `ordinary-gentlemen-staging`

2. **Configure Git Branch**
   - Go to Project Settings → Git
   - Set "Production Branch" to `staging`

3. **Set Environment Variables**
   - Add variables from `.env.staging.local`
   - Set environment to "Production" only
   - Variables to add:
     ```
     NODE_ENV=staging
     NEXT_PUBLIC_TEST_MODE=true
     NEXT_PUBLIC_MOCK_API=true
     NEXT_PUBLIC_TEST_DB_NAME=FPLTestDatabase-Staging
     [Your Firebase config variables]
     ```

4. **Configure Domain**
   - Add staging subdomain (e.g., `staging.ordinary-gentlemen.com`)

### Step 4: Development Project Setup (Optional)

1. **Create Development Project**
   - Name: `ordinary-gentlemen-dev`
   - Set "Production Branch" to `development`

2. **Set Environment Variables**
   - Add variables from `.env.development.local`
   - Set environment to "Production" only

3. **Configure Domain**
   - Add development subdomain (e.g., `dev.ordinary-gentlemen.com`)

## 🔄 Deployment Workflow

### Development Workflow
```bash
# Make changes on development branch
git checkout development
# ... make changes ...
git add .
git commit -m "New feature"
git push origin development
# → Auto-deploys to development environment
```

### Staging Workflow
```bash
# Deploy to staging for testing
npm run deploy:staging
# → Merges main into staging and deploys
```

### Production Workflow
```bash
# Deploy to production
npm run deploy:production
# → Deploys main branch to production
```

## 🌐 Environment URLs

After setup, you'll have:

- **Production**: `https://ordinary-gentlemen.vercel.app` (or your custom domain)
- **Staging**: `https://ordinary-gentlemen-staging.vercel.app`
- **Development**: `https://ordinary-gentlemen-dev.vercel.app`

## 🔧 Environment-Specific Features

### Production Environment
- Real Firebase project
- Live FPL API data
- Production database
- No test mode indicators
- Full feature set

### Staging Environment
- Test Firebase project (or same as production)
- Mock API data available
- Test database
- Test mode indicators visible
- Full feature set for testing

### Development Environment
- Test Firebase project
- Mock API data enabled
- Development database
- Test mode indicators visible
- Experimental features

## 🔐 Firebase Configuration

### 1. Add Domains to Firebase
- Go to Firebase Console → Authentication → Settings → Authorized Domains
- Add all your Vercel domains:
  ```
  ordinary-gentlemen.vercel.app
  ordinary-gentlemen-staging.vercel.app
  ordinary-gentlemen-dev.vercel.app
  your-custom-domain.com
  staging.your-custom-domain.com
  dev.your-custom-domain.com
  ```

### 2. Configure Firestore Security Rules
```javascript
// Example security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read league data
    match /leagues/{leagueId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/leagues/$(leagueId)).data.admin == request.auth.uid;
    }
  }
}
```

## 🧪 Testing Deployment

### 1. Test Staging Environment
```bash
# Deploy to staging
npm run deploy:staging

# Test the staging URL
# Look for "TEST MODE" indicator
# Use test user controls
```

### 2. Test Production Environment
```bash
# Deploy to production
npm run deploy:production

# Test the production URL
# Verify no test mode indicators
# Test with real user accounts
```

## 📊 Monitoring & Analytics

### Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor performance metrics
- Track user behavior

### Firebase Analytics
- Configure Firebase Analytics
- Track user engagement
- Monitor app performance

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables are set correctly
   - Verify Firebase configuration
   - Check build logs in Vercel dashboard

2. **Authentication Issues**
   - Verify domains are added to Firebase
   - Check Firebase configuration variables
   - Test with different browsers

3. **API Route Issues**
   - Check serverless function logs
   - Verify API route configuration
   - Test locally first

### Debug Commands
```bash
# Test build locally
npm run build:production

# Test staging build
npm run build:staging

# Run staging locally
npm run dev:staging

# Check environment variables
echo $NODE_ENV
```

## 📞 Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **Firebase Documentation**: [firebase.google.com/docs](https://firebase.google.com/docs)

## 🎉 Success Checklist

- [ ] All three environments deployed
- [ ] Custom domains configured
- [ ] Environment variables set
- [ ] Firebase domains added
- [ ] Authentication working
- [ ] API routes functional
- [ ] Test mode working in staging/dev
- [ ] Production mode working in production
- [ ] Deployment scripts working
- [ ] Monitoring configured

---

**Note**: This setup provides a robust deployment strategy with proper separation of concerns between environments. Each environment serves a specific purpose in your development workflow.
