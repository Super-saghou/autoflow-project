#!/bin/bash
# Start Flask API (playbook_api.py) in the background on port 5001
python3 playbook_api.py &
FLASK_PID=$!
# Wait a few seconds for Flask to start
sleep 3
# Start Node.js backend
npm start
# Optional: kill Flask when Node.js exits
kill $FLASK_PID 