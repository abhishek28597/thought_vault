#!/bin/bash

# Start FastAPI backend
cd backend && python main.py &

# Start frontend dev server
cd .. && npm run dev
