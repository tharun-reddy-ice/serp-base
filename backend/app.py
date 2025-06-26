from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import importlib.util
import traceback
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

SCRAPER_CONFIGS = {
    'amazon': {
        'name': 'Amazon',
        'script_path': '../amazon_scraper.py',
        'function_name': 'scrape_amazon_products',
        'parameters': [
            {'name': 'search_term', 'type': 'text', 'label': 'Search Term', 'placeholder': 'e.g., laptop', 'required': True},
            {'name': 'max_pages', 'type': 'number', 'label': 'Max Pages', 'default': 3, 'min': 1, 'max': 10, 'required': True}
        ]
    },
    'flipkart': {
        'name': 'Flipkart',
        'script_path': '../flipkart_scraper.py',
        'function_name': 'scrape_flipkart_products',
        'parameters': [
            {'name': 'search_term', 'type': 'text', 'label': 'Search Term', 'placeholder': 'e.g., smartphone', 'required': True},
            {'name': 'max_pages', 'type': 'number', 'label': 'Max Pages', 'default': 3, 'min': 1, 'max': 10, 'required': True}
        ]
    },
    'snapdeal': {
        'name': 'Snapdeal',
        'script_path': '../snapdeal.py',
        'function_name': 'scrape_snapdeal_products',
        'parameters': [
            {'name': 'search_term', 'type': 'text', 'label': 'Search Term', 'placeholder': 'e.g., pants trouser', 'required': True},
            {'name': 'max_pages', 'type': 'number', 'label': 'Max Pages', 'default': 3, 'min': 1, 'max': 10, 'required': True}
        ]
    },
    'wikipedia': {
        'name': 'Wikipedia',
        'script_path': '../wiki_json.py',
        'function_name': 'scrape_wikipedia_data',
        'parameters': [
            {'name': 'search_term', 'type': 'text', 'label': 'Search Term', 'placeholder': 'e.g., Alan Turing, Machine Learning', 'required': True},
            {'name': 'max_results', 'type': 'number', 'label': 'Max Results', 'default': 1, 'min': 1, 'max': 5, 'required': True}
        ]
    }
}

def load_scraper_module(script_path):
    try:
        abs_path = os.path.abspath(script_path)
        spec = importlib.util.spec_from_file_location("scraper_module", abs_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module
    except Exception as e:
        raise Exception(f"Failed to load module: {str(e)}")

@app.route('/api/scrapers', methods=['GET'])
def get_scrapers():
    return jsonify({'scrapers': SCRAPER_CONFIGS})

@app.route('/api/scrape', methods=['POST'])
def scrape_data():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        scraper_id = data.get('scraper_id')
        parameters = data.get('parameters', {})
        
        if not scraper_id or scraper_id not in SCRAPER_CONFIGS:
            return jsonify({'error': 'Invalid scraper ID'}), 400
        
        config = SCRAPER_CONFIGS[scraper_id]
        
        # Validate required parameters
        for param_config in config['parameters']:
            param_name = param_config['name']
            if param_config.get('required', False) and param_name not in parameters:
                return jsonify({'error': f'Parameter {param_name} is required'}), 400
        
        # Load and execute scraper
        module = load_scraper_module(config['script_path'])
        scraper_function = getattr(module, config['function_name'])
        
        # Execute scraper with appropriate parameters
        if scraper_id in ['wikipedia']:
            # Wikipedia uses max_results instead of max_pages
            result = scraper_function(
                search_term=parameters.get('search_term'),
                max_results=int(parameters.get('max_results', 1))
            )
        else:
            # E-commerce scrapers use max_pages
            result = scraper_function(
                search_term=parameters.get('search_term'),
                max_pages=int(parameters.get('max_pages', 3))
            )
        
        result['scraper_used'] = config['name']
        result['execution_timestamp'] = datetime.now().isoformat()
        
        return jsonify({'success': True, 'data': result})
        
    except Exception as e:
        error_trace = traceback.format_exc()
        return jsonify({'error': f'Scraping failed: {str(e)}', 'trace': error_trace}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'available_scrapers': list(SCRAPER_CONFIGS.keys())
    })

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Simple test endpoint to check if API is working"""
    return jsonify({
        'message': 'API is working!',
        'timestamp': datetime.now().isoformat(),
        'scrapers_count': len(SCRAPER_CONFIGS)
    })

@app.route('/', methods=['GET'])
def root():
    """Root endpoint"""
    return jsonify({
        'message': 'Multi-Platform Scraper API',
        'version': '1.0',
        'endpoints': ['/api/scrapers', '/api/scrape', '/api/health', '/api/test']
    })

if __name__ == '__main__':
    print("🚀 Starting Flask server...")
    print("📡 Backend API will be available at: http://localhost:5001")
    print("🌐 Make sure frontend is also running at: http://localhost:3000")
    print("Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        app.run(debug=True, host='127.0.0.1', port=5001)
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")