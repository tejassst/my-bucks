#!/bin/bash

# Kill any existing server
pkill -f "node api/index.js" || true

# Start the API server
echo "Starting Money Tracker API server..."
node api/index.js &

# Store the PID
echo $! > api.pid
echo "API server started with PID $(cat api.pid)"
echo "API running at http://localhost:4040/api"
echo "Health check: http://localhost:4040/api/health"

# Wait a moment for server to start
sleep 3

# Test the health endpoint
if curl -s http://localhost:4040/api/health > /dev/null; then
    echo "✅ API server is healthy and ready!"
else
    echo "❌ API server failed to start properly"
fi
