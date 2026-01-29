#!/bin/bash

# Smart QC Tools - One-Click Deployment Script

echo "🚀 Starting deployment of Smart QC Tools..."

# 1. Pull latest changes (optional, uncomment if using git on server)
# echo "📥 Pulling latest code..."
# git pull origin main

# 2. Build and start containers
echo "🏗️ Building and starting containers..."
docker-compose up -d --build

# 3. Cleanup unused images
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deployment complete! Access the app at http://localhost:3000"
