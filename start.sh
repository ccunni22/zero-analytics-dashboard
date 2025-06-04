#!/bin/bash

echo "🧹 Cleaning up development processes..."
./cleanup.sh

echo "🚀 Starting backend server..."
cd "$(dirname "$0")"  # Ensure we're in the script's directory
python3 -m uvicorn main:app --reload --port 8000 &
echo $! > .dev_pids

echo "🚀 Starting frontend server..."
cd frontend
npm run dev -- --port 4300 --strictPort &
echo $! >> ../.dev_pids

cd ..  # Return to root directory

echo "✨ Servers started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:4300"
echo "To stop servers, run: ./cleanup.sh" 