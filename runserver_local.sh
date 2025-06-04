#!/bin/bash

# Function to cleanup old backend/frontend processes
cleanup() {
    echo "Cleaning up old backend/frontend processes..."
    pkill -f "uvicorn main:app --reload" || true
    pkill -f "python3 -m uvicorn main:app --reload" || true
    pkill -f "vite" || true
    sleep 2
}

# Cleanup any existing processes before starting new ones
cleanup

# Start backend server
echo "Starting backend server..."
python3 -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait for backend to initialize
sleep 5

# Start frontend server
echo "Starting frontend server..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 