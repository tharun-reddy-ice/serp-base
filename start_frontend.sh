#!/bin/bash
echo "Starting E-commerce Scraper Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi
echo "Starting React server on http://localhost:3000"
npm start