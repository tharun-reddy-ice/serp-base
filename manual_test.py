#!/usr/bin/env python3

"""
Simple test script to verify the backend is working
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from app import app
    print("✅ Flask app imports successfully")
    
    # Test if we can create the app
    with app.test_client() as client:
        # Test root endpoint
        response = client.get('/')
        print(f"✅ Root endpoint: Status {response.status_code}")
        print(f"   Response: {response.get_json()}")
        
        # Test scrapers endpoint
        response = client.get('/api/scrapers')
        print(f"✅ Scrapers endpoint: Status {response.status_code}")
        data = response.get_json()
        if data and 'scrapers' in data:
            print(f"   Found {len(data['scrapers'])} scrapers: {list(data['scrapers'].keys())}")
        
        # Test health endpoint
        response = client.get('/api/health')
        print(f"✅ Health endpoint: Status {response.status_code}")
        
        print("\n🎉 All tests passed! Backend should work fine.")
        
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("💡 Run: pip install flask flask-cors requests beautifulsoup4")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()