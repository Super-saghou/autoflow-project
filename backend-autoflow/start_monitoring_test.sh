#!/bin/bash

echo "🚀 Starting Monitoring System Test..."

# Kill any existing server
echo "🛑 Stopping any existing server..."
pkill -f "node server.js" 2>/dev/null || true

# Wait a moment
sleep 2

# Start the server in background
echo "🔄 Starting backend server..."
node server.js &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Generate fresh attack simulation
echo "🎭 Generating fresh attack simulation..."
node attack_simulation.js

# Wait a moment
sleep 2

# Test the API endpoints
echo "🔍 Testing API endpoints..."
echo "Health check:"
curl -s http://localhost:5000/api/monitoring/health | head -c 200
echo -e "\n\nLogs (first 3):"
curl -s http://localhost:5000/api/monitoring/logs?limit=3 | head -c 300
echo -e "\n\nAlerts (first 3):"
curl -s http://localhost:5000/api/monitoring/alerts?limit=3 | head -c 300

echo -e "\n\n✅ Monitoring system is ready!"
echo "📊 Open your frontend and go to the Monitoring section"
echo "🔄 Server is running with PID: $SERVER_PID"
echo "🛑 To stop: kill $SERVER_PID" 