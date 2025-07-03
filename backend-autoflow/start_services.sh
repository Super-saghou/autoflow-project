#!/bin/bash

# Start Services Script
# This script starts both the Node.js server and the Python playbook generation API

echo "Starting AutoFlow Network Management Platform..."

# Create the generated playbooks directory if it doesn't exist
mkdir -p /home/sarra/ansible/generated_playbooks

# Install Python dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "Installing Python dependencies..."
    pip3 install -r requirements.txt
fi

# Start the Python playbook generation API in the background
echo "Starting Python Playbook Generation API on port 5001..."
python3 playbook_api.py &
PYTHON_PID=$!

# Wait a moment for the Python API to start
sleep 2

# Start the Node.js server
echo "Starting Node.js server on port 5000..."
node server.js &
NODE_PID=$!

# Function to handle script termination
cleanup() {
    echo "Shutting down services..."
    kill $PYTHON_PID 2>/dev/null
    kill $NODE_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "Services started successfully!"
echo "Node.js server: http://localhost:5000"
echo "Python API: http://localhost:5001"
echo "Press Ctrl+C to stop all services"

# Wait for both processes
wait 