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
