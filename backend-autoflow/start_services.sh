#!/bin/bash

# AutoFlow Services Startup Script for Kubernetes
echo "🚀 Starting AutoFlow Services..."

# Set environment variables
export NODE_ENV=production
export BACKUP_DIR=/app/backups
export PYTHONPATH=/app

# Create necessary directories
mkdir -p /app/backups /app/logs

# Start Python services in background
echo "🐍 Starting Python services..."

# Start Playbook API
echo "🔧 Starting playbook_api..."
python3 /app/playbook_api.py > /app/logs/playbook_api.log 2>&1 &
echo "✅ playbook_api started with PID $!"

# Start AI Agents API
echo "🔧 Starting ai_agents..."
python3 /app/ai_agents_api.py > /app/logs/ai_agents.log 2>&1 &
echo "✅ ai_agents started with PID $!"

# Give Python services a moment to start
echo "⏳ Waiting for Python services to initialize..."
sleep 5

# Start the main Node.js server
echo "🟢 Starting Node.js server..."
exec node server.js 