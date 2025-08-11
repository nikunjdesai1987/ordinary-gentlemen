#!/bin/bash

# Vercel Deployment Setup Script
# This script sets up production and staging environments on Vercel

set -e

echo "🚀 Setting up Vercel deployment for Ordinary Gentlemen FPL App"
echo "================================================================"

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    # Try to install Vercel CLI, but don't fail if permission denied
    if npm install -g vercel 2>/dev/null; then
        echo "✅ Vercel CLI installed successfully"
    else
        echo "⚠️  Could not install Vercel CLI globally (permission issue)"
        echo "   You can install it manually with: sudo npm install -g vercel"
        echo "   Or use npx vercel instead (will be installed automatically)"
        echo "   Continuing with setup..."
    fi
fi

echo ""
echo "📋 Step 1: Setting up Git branches"
echo "-----------------------------------"

# Ensure we're on main branch
git checkout main

# Create staging branch if it doesn't exist
if ! git rev-parse --verify staging >/dev/null 2>&1; then
    echo "🆕 Creating staging branch..."
    git checkout -b staging
    # Only push if remote exists
    if git remote get-url origin >/dev/null 2>&1; then
        git push -u origin staging
    else
        echo "⚠️  No remote origin found. You'll need to push manually later."
    fi
    git checkout main
else
    echo "✅ Staging branch already exists"
fi

# Create development branch if it doesn't exist
if ! git rev-parse --verify development >/dev/null 2>&1; then
    echo "🆕 Creating development branch..."
    git checkout -b development
    # Only push if remote exists
    if git remote get-url origin >/dev/null 2>&1; then
        git push -u origin development
    else
        echo "⚠️  No remote origin found. You'll need to push manually later."
    fi
    git checkout main
else
    echo "✅ Development branch already exists"
fi

echo ""
echo "📋 Step 2: Creating environment configuration files"
echo "---------------------------------------------------"

# Create production environment file
cat > .env.production.local << EOF
# Production Environment Variables
NODE_ENV=production

NEXT_PUBLIC_MOCK_API=false

# Firebase Configuration (replace with your actual values)
NEXT_PUBLIC_FIREBASE_API_KEY=your_production_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_production_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_production_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_production_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_production_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_production_app_id
EOF

# Create staging environment file
cat > .env.staging.local << EOF
# Staging Environment Variables
NODE_ENV=staging
NEXT_PUBLIC_MOCK_API=true

# Firebase Configuration (use test project or same as production)
NEXT_PUBLIC_FIREBASE_API_KEY=your_staging_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_staging_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_staging_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_staging_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_staging_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_staging_app_id
EOF

# Create development environment file
cat > .env.development.local << EOF
# Development Environment Variables
NODE_ENV=development
NEXT_PUBLIC_MOCK_API=true

# Firebase Configuration (use test project)
NEXT_PUBLIC_FIREBASE_API_KEY=your_dev_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_dev_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_dev_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_dev_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_dev_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_dev_app_id
EOF

echo "✅ Environment files created:"
echo "   - .env.production.local (for main branch)"
echo "   - .env.staging.local (for staging branch)"
echo "   - .env.development.local (for development branch)"

echo ""
echo "📋 Step 3: Updating package.json scripts"
echo "----------------------------------------"

# Add environment-specific build scripts to package.json
echo "📝 Adding environment-specific build scripts..."

# Create a temporary package.json with updated scripts
cat > package.json.tmp << 'EOF'
{
  "name": "ordinary-gentlemen",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",

    "dev:staging": "NODE_ENV=staging next dev",
    "build": "next build",

    "build:staging": "NODE_ENV=staging next build",
    "build:production": "NODE_ENV=production next build",
    "start": "next start",

    "start:staging": "NODE_ENV=staging next start",
    "lint": "next lint",

    "deploy:staging": "./scripts/deploy-staging.sh",
    "deploy:production": "./scripts/deploy-production.sh"
  },
EOF

# Copy the rest of the original package.json
tail -n +15 package.json >> package.json.tmp
mv package.json.tmp package.json

echo "✅ Package.json updated with environment-specific scripts"

echo ""
echo "📋 Step 4: Creating deployment scripts"
echo "--------------------------------------"

# Create staging deployment script
cat > scripts/deploy-staging.sh << 'EOF'
#!/bin/bash

# Staging Deployment Script
set -e

echo "🚀 Deploying to staging environment..."

# Switch to staging branch
git checkout staging
git merge main

# Build for staging
npm run build:staging

# Commit and push
git add .
git commit -m "Deploy staging - $(date)" || true
git push origin staging

echo "✅ Staging deployment triggered!"
echo "🌐 Check your Vercel dashboard for staging deployment status"
EOF

# Create production deployment script
cat > scripts/deploy-production.sh << 'EOF'
#!/bin/bash

# Production Deployment Script
set -e

echo "🚀 Deploying to production environment..."

# Ensure we're on main branch
git checkout main

# Build for production
npm run build:production

# Commit and push
git add .
git commit -m "Deploy production - $(date)" || true
git push origin main

echo "✅ Production deployment triggered!"
echo "🌐 Check your Vercel dashboard for production deployment status"
EOF

# Make scripts executable
chmod +x scripts/deploy-staging.sh
chmod +x scripts/deploy-production.sh

echo "✅ Deployment scripts created:"
echo "   - scripts/deploy-staging.sh"
echo "   - scripts/deploy-production.sh"

echo ""
echo "📋 Step 5: Vercel Project Setup Instructions"
echo "--------------------------------------------"

echo "🌐 Next steps to complete Vercel setup:"
echo ""
echo "1. 📝 Create Vercel Account:"
echo "   - Go to https://vercel.com"
echo "   - Sign up with your GitHub account"
echo ""
echo "2. 🔗 Connect Repository:"
echo "   - Click 'New Project' in Vercel dashboard"
echo "   - Import your GitHub repository"
echo "   - Select the repository: ordinary-gentlemen"
echo ""
echo "3. ⚙️ Configure Production Project:"
echo "   - Project Name: ordinary-gentlemen"
echo "   - Framework Preset: Next.js"
echo "   - Root Directory: ./"
echo "   - Build Command: npm run build"
echo "   - Output Directory: .next"
echo "   - Install Command: npm install"
echo "   - Development Command: npm run dev"
echo ""
echo "4. 🔧 Set Environment Variables for Production:"
echo "   - Go to Project Settings > Environment Variables"
echo "   - Add all variables from .env.production.local"
echo "   - Set Production environment only"
echo ""
echo "5. 🌿 Create Staging Project:"
echo "   - Create a new project in Vercel"
echo "   - Name: ordinary-gentlemen-staging"
echo "   - Connect to the same repository"
echo "   - Set Git Branch to 'staging'"
echo "   - Add environment variables from .env.staging.local"
echo ""
echo "6. 🔄 Create Development Project (Optional):"
echo "   - Create another project: ordinary-gentlemen-dev"
echo "   - Set Git Branch to 'development'"
echo "   - Add environment variables from .env.development.local"
echo ""
echo "7. 🎯 Configure Custom Domains:"
echo "   - Production: your-domain.com"
echo "   - Staging: staging.your-domain.com"
echo "   - Development: dev.your-domain.com"
echo ""
echo "8. 🔐 Set up Firebase:"
echo "   - Add your domain(s) to Firebase authorized domains"
echo "   - Configure Firestore security rules"
echo "   - Set up authentication providers"
echo ""

echo "📖 For detailed instructions, see:"

echo "   - https://vercel.com/docs"
echo ""
echo "🎉 Setup complete! Your project is ready for Vercel deployment."
echo ""
echo "Quick commands:"
echo "  npm run deploy:staging    # Deploy to staging"
echo "  npm run deploy:production # Deploy to production"
echo "  npm run dev:staging       # Run staging locally"
