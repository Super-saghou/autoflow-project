#!/bin/bash

# AutoFlow Network Management Platform - Service Startup Script
# This script starts both the Node.js backend server and the Python Flask API

echo "Starting AutoFlow Network Management Platform..."

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p /home/sarra/ansible/generated_playbooks
mkdir -p /home/sarra/ansible/playbooks

# Set proper permissions
chmod 755 /home/sarra/ansible/generated_playbooks
chmod 755 /home/sarra/ansible/playbooks

# Check if Python dependencies are installed
echo "Checking Python dependencies..."
if ! python3 -c "import flask, flask_cors, pyyaml" 2>/dev/null; then
    echo "Installing Python dependencies..."
    pip3 install -r requirements.txt
fi

# Check if Node.js dependencies are installed
echo "Checking Node.js dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# Start the Python Flask API in the background
echo "Starting Python Flask API on port 5001..."
python3 playbook_api.py &
FLASK_PID=$!

# Wait a moment for Flask to start
sleep 3

# Check if Flask API is running
if curl -s http://localhost:5001/api/health > /dev/null; then
    echo "✅ Flask API started successfully on port 5001"
else
    echo "❌ Flask API failed to start"
    exit 1
fi

# Start the Node.js server
echo "Starting Node.js server on port 5000..."
node server.js &
NODE_PID=$!

# Wait a moment for Node.js to start
sleep 3

# Check if Node.js server is running
if curl -s http://localhost:5000/api/test > /dev/null; then
    echo "✅ Node.js server started successfully on port 5000"
else
    echo "❌ Node.js server failed to start"
    exit 1
fi

echo ""
echo "🎉 AutoFlow Network Management Platform is now running!"
echo ""
echo "Services:"
echo "  - Node.js Backend: http://localhost:5000"
echo "  - Python Flask API: http://localhost:5001"
echo "  - Frontend: http://localhost:3000 (if running)"
echo ""
echo "API Endpoints:"
echo "  - Health Check: http://localhost:5001/api/health"
echo "  - Generate & Execute: http://localhost:5001/api/generate-and-execute"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down services..."
    kill $FLASK_PID 2>/dev/null
    kill $NODE_PID 2>/dev/null
    echo "Services stopped."
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep the script running
wait 