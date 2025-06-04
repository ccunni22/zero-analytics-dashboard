#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install dependencies
install_dependencies() {
    echo "Installing backend dependencies..."
    python3 -m pip install -r requirements.txt

    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
}

# Function to start development servers
start_servers() {
    echo "Starting development servers..."
    ./runserver_local.sh
}

# Main execution
echo "Setting up development environment..."

# Check for required tools
if ! command_exists python3; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

if ! command_exists npm; then
    echo "Error: npm is not installed"
    exit 1
fi

# Install dependencies
install_dependencies

# Start servers
start_servers 