#!/bin/bash

# Deployment script for test environment
# Usage: ./scripts/deploy-test.sh [staging|production-test]

set -e

ENVIRONMENT=${1:-staging}

echo "🚀 Deploying test environment: $ENVIRONMENT"

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Create or switch to staging branch
if [ "$ENVIRONMENT" = "staging" ]; then
    echo "📦 Setting up staging branch..."
    
    # Check if staging branch exists
    if git rev-parse --verify staging >/dev/null 2>&1; then
        echo "📝 Switching to existing staging branch"
        git checkout staging
        git merge main
    else
        echo "🆕 Creating new staging branch"
        git checkout -b staging
    fi
    
    # Update package.json scripts for staging
    echo "⚙️ Configuring staging environment..."
    
    # Create test-specific environment variables that Next.js will auto-load when NODE_ENV=test
    # Next.js recognizes .env.test.local, so we use that instead of a custom .env.staging file
    cat > .env.test.local << EOF
NODE_ENV=test
NEXT_PUBLIC_TEST_MODE=true
NEXT_PUBLIC_MOCK_API=true
NEXT_PUBLIC_TEST_DB_NAME=FPLTestDatabase-Staging
EOF
    
    echo "📋 Test environment file created (.env.test.local)"
fi

# Build the application
echo "🔨 Building application for test environment..."
if [ "$ENVIRONMENT" = "staging" ]; then
    npm run build:test
else
    npm run build
fi

# Push to remote if staging
if [ "$ENVIRONMENT" = "staging" ]; then
    echo "📤 Pushing staging branch to remote..."
    git add .
    git commit -m "Deploy staging environment - $(date)" || true
    git push origin staging
    
    echo "✅ Staging branch pushed to remote"
    echo "🌐 If connected to Vercel, staging deployment will start automatically"
    echo "🔗 Configure your Vercel project to deploy from the 'staging' branch"
fi

echo ""
echo "🎉 Test environment deployment prepared!"
echo ""
echo "Next steps:"
if [ "$ENVIRONMENT" = "staging" ]; then
    echo "1. Connect your repository to Vercel (if not already connected)"
    echo "2. Create a new Vercel project for staging"
    echo "3. Set the deployment branch to 'staging'"
    echo "4. Add environment variables in Vercel dashboard:"
    echo "   - NODE_ENV=test"
    echo "   - NEXT_PUBLIC_TEST_MODE=true"
    echo "   - NEXT_PUBLIC_MOCK_API=true"
    echo "   - [Your Firebase config variables]"
else
    echo "1. Deploy to your preferred hosting platform"
    echo "2. Set up environment variables for test mode"
    echo "3. Configure test users in Firebase"
fi
echo ""
echo "📖 See DEPLOYMENT_TESTING_GUIDE.md for detailed instructions"