#!/bin/bash
# Kill any process using port 8000
lsof -ti:8000 | xargs kill -9
# Start Uvicorn with reload
uvicorn main:app --reload 