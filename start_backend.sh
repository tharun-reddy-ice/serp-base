#!/bin/bash
echo "Starting Multi-Platform Scraper Backend..."
cd backend

# Remove old venv if it exists with issues
if [ -d "venv" ] && [ ! -f "venv/bin/activate" ]; then
    echo "Removing corrupted virtual environment..."
    rm -rf venv
fi

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Upgrading pip..."
pip install --upgrade pip

echo "Installing requirements..."
pip install -r requirements.txt

echo "Starting Flask server on http://localhost:5001"
echo "Press Ctrl+C to stop the server"
python app.py