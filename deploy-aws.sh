#!/bin/bash
# AWS Deployment Script
# Run this script on your AWS instance after cloning the repository

echo "🚀 Starting AWS Deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x if not installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Create logs directory
mkdir -p logs

# Create public directory if it doesn't exist
mkdir -p public

# Set proper permissions
chmod 755 public
chmod 644 public/*.xlsx 2>/dev/null || true

# Start/restart the application with PM2
echo "🔄 Starting application with PM2..."
pm2 delete stock-viewer-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Setup PM2 to start on boot
echo "⚙️ Setting up PM2 startup..."
pm2 startup

echo "✅ Deployment complete!"
echo ""
echo "📊 Check status: pm2 status"
echo "📝 View logs: pm2 logs stock-viewer-backend"
echo "🔄 Restart: pm2 restart stock-viewer-backend"
echo ""
echo "🌐 Your backend should be running on port 4000"

