#!/bin/bash

# Plugin Vault Deployment Script
# This script helps deploy the WebDAV server to various platforms

set -e

echo "🚀 Plugin Vault Deployment Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to deploy to Railway
deploy_railway() {
    echo "🚂 Deploying to Railway..."
    
    if ! command_exists railway; then
        echo "📦 Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    echo "🔐 Logging into Railway..."
    railway login
    
    echo "🚀 Deploying..."
    railway up
    
    echo "✅ Railway deployment complete!"
}

# Function to deploy to Heroku
deploy_heroku() {
    echo "🦸 Deploying to Heroku..."
    
    if ! command_exists heroku; then
        echo "❌ Heroku CLI not found. Please install it first:"
        echo "   https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    echo "🔐 Logging into Heroku..."
    heroku login
    
    echo "🏗️ Creating Heroku app..."
    heroku create pluginvault-$(date +%s)
    
    echo "🚀 Deploying..."
    git push heroku main
    
    echo "✅ Heroku deployment complete!"
}

# Function to build Docker image
build_docker() {
    echo "🐳 Building Docker image..."
    
    if ! command_exists docker; then
        echo "❌ Docker not found. Please install Docker first."
        exit 1
    fi
    
    docker build -t pluginvault-backend .
    
    echo "✅ Docker image built successfully!"
    echo "📦 To run locally: docker run -p 3000:3000 pluginvault-backend"
}

# Function to run tests
run_tests() {
    echo "🧪 Running tests..."
    
    if ! command_exists node; then
        echo "❌ Node.js not found. Please install Node.js first."
        exit 1
    fi
    
    echo "📦 Installing dependencies..."
    npm install
    
    echo "🚀 Starting server..."
    node server.js &
    SERVER_PID=$!
    
    echo "⏳ Waiting for server to start..."
    sleep 5
    
    echo "🧪 Running test suite..."
    node test.js
    
    echo "🛑 Stopping server..."
    kill $SERVER_PID
    
    echo "✅ Tests completed!"
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  railway    Deploy to Railway"
    echo "  heroku     Deploy to Heroku"
    echo "  docker     Build Docker image"
    echo "  test       Run tests locally"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 railway    # Deploy to Railway"
    echo "  $0 test       # Run tests locally"
}

# Main script logic
case "${1:-help}" in
    railway)
        deploy_railway
        ;;
    heroku)
        deploy_heroku
        ;;
    docker)
        build_docker
        ;;
    test)
        run_tests
        ;;
    help|*)
        show_help
        ;;
esac 