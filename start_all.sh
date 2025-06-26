#!/bin/bash

echo "🚀 Starting Dynamic Scraper Application..."

# Function to cleanup background processes
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Set up signal handler
trap cleanup SIGINT SIGTERM

# Start backend in background
echo "📡 Starting backend server..."
./start_backend.sh &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 5

# Start frontend in background
echo "🌐 Starting frontend server..."
./start_frontend.sh &
FRONTEND_PID=$!

echo "✅ Both servers are starting!"
echo "📡 Backend: http://localhost:5001"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID