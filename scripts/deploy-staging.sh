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
