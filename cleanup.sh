#!/bin/bash

echo "🧹 Cleaning up development processes..."

# Kill processes by port
echo "Stopping processes on ports 4300 and 8000..."
lsof -ti :4300 | xargs kill -9 2>/dev/null || true
lsof -ti :8000 | xargs kill -9 2>/dev/null || true

# Kill Vite processes
echo "Stopping Vite processes..."
pkill -f vite 2>/dev/null || true

# Kill Python processes
echo "Stopping Python processes..."
pkill -f "uvicorn main:app" 2>/dev/null || true

# Remove PID file if it exists
if [ -f .dev_pids ]; then
    echo "Removing PID file..."
    rm .dev_pids
fi

# Additional cleanup for frontend
if [ -d "frontend" ]; then
    echo "Cleaning frontend processes..."
    cd frontend
    pkill -f "node.*vite" 2>/dev/null || true
    cd ..
fi

echo "✨ Cleanup complete!" 