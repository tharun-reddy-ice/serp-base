#!/bin/bash

echo "🧪 Testing Backend Setup..."

cd backend

echo "1️⃣ Creating fresh virtual environment..."
python3 -m venv venv

echo "2️⃣ Activating virtual environment..."
source venv/bin/activate

echo "3️⃣ Upgrading pip..."
pip install --upgrade pip

echo "4️⃣ Installing Flask and dependencies..."
pip install Flask==2.3.3 Flask-CORS==4.0.0 requests==2.31.0 beautifulsoup4==4.12.2

echo "5️⃣ Testing if Flask imports work..."
python3 -c "from flask import Flask; print('✅ Flask import successful')"

echo "6️⃣ Starting test server (will stop automatically after 10 seconds)..."
timeout 10s python3 app.py || echo "⏰ Test completed"

echo ""
echo "🎯 Manual test: Run './start_backend.sh' and then visit:"
echo "   📡 http://localhost:5000 (should show API info)"
echo "   📡 http://localhost:5000/api/test (should show test response)"
echo "   📡 http://localhost:5000/api/scrapers (should show available scrapers)"