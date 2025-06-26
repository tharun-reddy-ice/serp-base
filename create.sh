#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up Web Scraper Frontend and Backend...${NC}"

# Create project directory structure
mkdir -p web-scraper-project
cd web-scraper-project

# Create backend directory
mkdir -p backend

# Create frontend directory
mkdir -p frontend

# Create backend files
echo -e "${GREEN}Creating backend files...${NC}"

# Create main.py
cat > backend/main.py << 'EOF'
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import json
import asyncio
from datetime import datetime

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class ScriptInput(BaseModel):
    website: str
    category: str
    search_term: str
    page_number: Optional[int] = 1
    additional_params: Optional[Dict[str, Any]] = {}

class ScriptConfig(BaseModel):
    name: str
    inputs: List[Dict[str, str]]

# Sample data structure for websites
WEBSITES_CONFIG = {
    "online_shopping": {
        "display_name": "Online Shopping",
        "websites": {
            "amazon": {
                "name": "Amazon",
                "inputs": [
                    {"name": "search_term", "type": "text", "label": "Search Term", "required": True},
                    {"name": "page_number", "type": "number", "label": "Page Number", "default": 1},
                    {"name": "sort_by", "type": "select", "label": "Sort By", "options": ["relevance", "price_low_high", "price_high_low", "rating"]}
                ]
            },
            "flipkart": {
                "name": "Flipkart",
                "inputs": [
                    {"name": "search_term", "type": "text", "label": "Search Term", "required": True},
                    {"name": "page_number", "type": "number", "label": "Page Number", "default": 1}
                ]
            },
            "myntra": {
                "name": "Myntra",
                "inputs": [
                    {"name": "search_term", "type": "text", "label": "Search Term", "required": True},
                    {"name": "page_number", "type": "number", "label": "Page Number", "default": 1},
                    {"name": "category", "type": "select", "label": "Category", "options": ["men", "women", "kids"]}
                ]
            }
        }
    },
    "travel_booking": {
        "display_name": "Travel Booking",
        "websites": {
            "makemytrip": {
                "name": "MakeMyTrip",
                "inputs": [
                    {"name": "search_term", "type": "text", "label": "Destination", "required": True},
                    {"name": "check_in_date", "type": "date", "label": "Check-in Date"},
                    {"name": "check_out_date", "type": "date", "label": "Check-out Date"},
                    {"name": "guests", "type": "number", "label": "Number of Guests", "default": 2}
                ]
            },
            "booking": {
                "name": "Booking.com",
                "inputs": [
                    {"name": "search_term", "type": "text", "label": "Location", "required": True},
                    {"name": "check_in_date", "type": "date", "label": "Check-in Date"},
                    {"name": "check_out_date", "type": "date", "label": "Check-out Date"}
                ]
            }
        }
    },
    "food_delivery": {
        "display_name": "Food Delivery",
        "websites": {
            "zomato": {
                "name": "Zomato",
                "inputs": [
                    {"name": "search_term", "type": "text", "label": "Restaurant/Food", "required": True},
                    {"name": "location", "type": "text", "label": "Location"},
                    {"name": "cuisine", "type": "select", "label": "Cuisine", "options": ["all", "indian", "chinese", "italian", "mexican"]}
                ]
            },
            "swiggy": {
                "name": "Swiggy",
                "inputs": [
                    {"name": "search_term", "type": "text", "label": "Restaurant/Food", "required": True},
                    {"name": "location", "type": "text", "label": "Location"}
                ]
            }
        }
    }
}

@app.get("/")
async def root():
    return {"message": "Web Scraper API"}

@app.get("/api/categories")
async def get_categories():
    """Get all categories and their websites"""
    return WEBSITES_CONFIG

@app.get("/api/website-config/{category}/{website}")
async def get_website_config(category: str, website: str):
    """Get configuration for a specific website"""
    if category not in WEBSITES_CONFIG:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if website not in WEBSITES_CONFIG[category]["websites"]:
        raise HTTPException(status_code=404, detail="Website not found")
    
    return WEBSITES_CONFIG[category]["websites"][website]

@app.post("/api/run-script")
async def run_script(script_input: ScriptInput):
    """Run the scraping script for a specific website"""
    
    # Validate category and website
    if script_input.category not in WEBSITES_CONFIG:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if script_input.website not in WEBSITES_CONFIG[script_input.category]["websites"]:
        raise HTTPException(status_code=404, detail="Website not found")
    
    # Simulate script execution (replace with actual scraping logic)
    await asyncio.sleep(2)  # Simulate processing time
    
    # Mock response - replace with actual scraping results
    mock_results = {
        "status": "success",
        "website": script_input.website,
        "search_term": script_input.search_term,
        "page_number": script_input.page_number,
        "timestamp": datetime.now().isoformat(),
        "results": [
            {
                "title": f"Sample Product {i+1} for {script_input.search_term}",
                "price": f"${(i+1) * 10.99}",
                "rating": 4.5 - (i * 0.1),
                "url": f"https://example.com/product/{i+1}",
                "image": f"https://via.placeholder.com/150?text=Product{i+1}"
            }
            for i in range(10)
        ],
        "total_results": 100,
        "additional_info": script_input.additional_params
    }
    
    return mock_results

# Mount static files (optional, if you want to serve frontend from FastAPI)
# app.mount("/", StaticFiles(directory="../frontend", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF

# Create requirements.txt
cat > backend/requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
python-multipart==0.0.6
EOF

# Create frontend files
echo -e "${GREEN}Creating frontend files...${NC}"

# Create index.html
cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Scraper Dashboard</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Web Scraper Dashboard</h1>
            <p>Select a website and configure parameters to run scraping scripts</p>
        </header>

        <main>
            <div class="sidebar">
                <h2>Categories</h2>
                <div id="categories-list" class="categories-list">
                    <!-- Categories will be loaded here -->
                </div>
            </div>

            <div class="content">
                <div id="input-form" class="input-form hidden">
                    <h2 id="website-title">Select a website</h2>
                    <form id="script-form">
                        <div id="form-inputs">
                            <!-- Dynamic inputs will be loaded here -->
                        </div>
                        <button type="submit" class="btn-primary">Run Script</button>
                    </form>
                </div>

                <div id="loading" class="loading hidden">
                    <div class="spinner"></div>
                    <p>Running script...</p>
                </div>

                <div id="results" class="results hidden">
                    <h2>Results</h2>
                    <div class="results-header">
                        <button id="view-json" class="btn-secondary">View JSON</button>
                        <button id="view-formatted" class="btn-secondary active">View Formatted</button>
                    </div>
                    <div id="results-content">
                        <!-- Results will be displayed here -->
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script src="script.js"></script>
</body>
</html>
EOF

# Create styles.css
cat > frontend/styles.css << 'EOF'
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background-color: #f5f5f5;
    color: #333;
}

.container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

header {
    background-color: #2c3e50;
    color: white;
    padding: 2rem;
    text-align: center;
}

header h1 {
    margin-bottom: 0.5rem;
}

header p {
    opacity: 0.8;
}

main {
    flex: 1;
    display: flex;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
    padding: 2rem;
    gap: 2rem;
}

.sidebar {
    width: 300px;
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    height: fit-content;
}

.sidebar h2 {
    margin-bottom: 1rem;
    color: #2c3e50;
}

.categories-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.category {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
}

.category-header {
    background: #3498db;
    color: white;
    padding: 0.75rem 1rem;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background 0.3s;
}

.category-header:hover {
    background: #2980b9;
}

.category-header.active {
    background: #2980b9;
}

.category-arrow {
    transition: transform 0.3s;
}

.category-header.active .category-arrow {
    transform: rotate(180deg);
}

.websites-list {
    display: none;
    background: #f8f9fa;
}

.websites-list.active {
    display: block;
}

.website-item {
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: background 0.3s;
    border-bottom: 1px solid #e0e0e0;
}

.website-item:last-child {
    border-bottom: none;
}

.website-item:hover {
    background: #e9ecef;
}

.website-item.active {
    background: #3498db;
    color: white;
}

.content {
    flex: 1;
    background: white;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.input-form h2 {
    margin-bottom: 1.5rem;
    color: #2c3e50;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: #3498db;
}

.btn-primary,
.btn-secondary {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.3s;
}

.btn-primary {
    background: #3498db;
    color: white;
}

.btn-primary:hover {
    background: #2980b9;
}

.btn-secondary {
    background: #95a5a6;
    color: white;
    margin-right: 0.5rem;
}

.btn-secondary:hover {
    background: #7f8c8d;
}

.btn-secondary.active {
    background: #3498db;
}

.loading {
    text-align: center;
    padding: 2rem;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.results h2 {
    margin-bottom: 1rem;
    color: #2c3e50;
}

.results-header {
    margin-bottom: 1rem;
}

.results-content {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
    max-height: 600px;
    overflow-y: auto;
}

.json-view {
    font-family: 'Courier New', monospace;
    white-space: pre-wrap;
    word-wrap: break-word;
}

.formatted-results {
    display: grid;
    gap: 1rem;
}

.result-item {
    background: white;
    padding: 1rem;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
}

.result-item h3 {
    margin-bottom: 0.5rem;
    color: #2c3e50;
}

.result-item p {
    margin-bottom: 0.25rem;
}

.hidden {
    display: none;
}

.error {
    background: #fee;
    color: #c33;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
}
EOF

# Create script.js
cat > frontend/script.js << 'EOF'
const API_URL = 'http://localhost:8000';

let currentCategory = '';
let currentWebsite = '';
let currentResults = null;

// Load categories on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
});

async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/api/categories`);
        const categories = await response.json();
        displayCategories(categories);
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function displayCategories(categories) {
    const container = document.getElementById('categories-list');
    container.innerHTML = '';

    for (const [categoryKey, categoryData] of Object.entries(categories)) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category';

        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.innerHTML = `
            <span>${categoryData.display_name}</span>
            <span class="category-arrow">▼</span>
        `;
        categoryHeader.onclick = () => toggleCategory(categoryKey);

        const websitesList = document.createElement('div');
        websitesList.className = 'websites-list';
        websitesList.id = `websites-${categoryKey}`;

        for (const [websiteKey, websiteData] of Object.entries(categoryData.websites)) {
            const websiteItem = document.createElement('div');
            websiteItem.className = 'website-item';
            websiteItem.textContent = websiteData.name;
            websiteItem.onclick = () => selectWebsite(categoryKey, websiteKey, websiteData.name);
            websitesList.appendChild(websiteItem);
        }

        categoryDiv.appendChild(categoryHeader);
        categoryDiv.appendChild(websitesList);
        container.appendChild(categoryDiv);
    }
}

function toggleCategory(categoryKey) {
    const websitesList = document.getElementById(`websites-${categoryKey}`);
    const categoryHeader = websitesList.previousElementSibling;
    
    websitesList.classList.toggle('active');
    categoryHeader.classList.toggle('active');
}

async function selectWebsite(category, website, websiteName) {
    currentCategory = category;
    currentWebsite = website;

    // Update active states
    document.querySelectorAll('.website-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');

    // Load website configuration
    try {
        const response = await fetch(`${API_URL}/api/website-config/${category}/${website}`);
        const config = await response.json();
        displayInputForm(config, websiteName);
    } catch (error) {
        console.error('Error loading website config:', error);
    }
}

function displayInputForm(config, websiteName) {
    document.getElementById('website-title').textContent = websiteName;
    document.getElementById('input-form').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');

    const formInputs = document.getElementById('form-inputs');
    formInputs.innerHTML = '';

    config.inputs.forEach(input => {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        const label = document.createElement('label');
        label.textContent = input.label;
        if (input.required) {
            label.textContent += ' *';
        }

        let inputElement;
        if (input.type === 'select') {
            inputElement = document.createElement('select');
            inputElement.name = input.name;
            
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select...';
            inputElement.appendChild(defaultOption);

            input.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option.charAt(0).toUpperCase() + option.slice(1);
                inputElement.appendChild(optionElement);
            });
        } else {
            inputElement = document.createElement('input');
            inputElement.type = input.type;
            inputElement.name = input.name;
            if (input.default) {
                inputElement.value = input.default;
            }
        }

        if (input.required) {
            inputElement.required = true;
        }

        formGroup.appendChild(label);
        formGroup.appendChild(inputElement);
        formInputs.appendChild(formGroup);
    });
}

// Handle form submission
document.getElementById('script-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const additionalParams = {};
    
    for (const [key, value] of formData.entries()) {
        if (key !== 'search_term' && key !== 'page_number') {
            additionalParams[key] = value;
        }
    }

    const scriptInput = {
        website: currentWebsite,
        category: currentCategory,
        search_term: formData.get('search_term') || '',
        page_number: parseInt(formData.get('page_number')) || 1,
        additional_params: additionalParams
    };

    // Show loading
    document.getElementById('input-form').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');

    try {
        const response = await fetch(`${API_URL}/api/run-script`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(scriptInput)
        });

        currentResults = await response.json();
        displayResults();
    } catch (error) {
        console.error('Error running script:', error);
        displayError(error.message);
    } finally {
        document.getElementById('loading').classList.add('hidden');
    }
});

function displayResults() {
    document.getElementById('input-form').classList.remove('hidden');
    document.getElementById('results').classList.remove('hidden');
    displayFormattedResults();
}

function displayFormattedResults() {
    const content = document.getElementById('results-content');
    
    if (currentResults.status === 'success') {
        content.innerHTML = `
            <div class="formatted-results">
                <div style="margin-bottom: 1rem;">
                    <strong>Search Term:</strong> ${currentResults.search_term}<br>
                    <strong>Page:</strong> ${currentResults.page_number}<br>
                    <strong>Total Results:</strong> ${currentResults.total_results}<br>
                    <strong>Timestamp:</strong> ${new Date(currentResults.timestamp).toLocaleString()}
                </div>
                ${currentResults.results.map(item => `
                    <div class="result-item">
                        <h3>${item.title}</h3>
                        <p><strong>Price:</strong> ${item.price}</p>
                        <p><strong>Rating:</strong> ${item.rating} ⭐</p>
                        <p><strong>URL:</strong> <a href="${item.url}" target="_blank">${item.url}</a></p>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        content.innerHTML = `<div class="error">Error: ${currentResults.message || 'Unknown error'}</div>`;
    }
}

function displayJsonResults() {
    const content = document.getElementById('results-content');
    content.innerHTML = `<pre class="json-view">${JSON.stringify(currentResults, null, 2)}</pre>`;
}

function displayError(message) {
    document.getElementById('input-form').classList.remove('hidden');
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('results-content').innerHTML = `<div class="error">Error: ${message}</div>`;
}

// Toggle between JSON and formatted view
document.getElementById('view-json').addEventListener('click', () => {
    document.getElementById('view-json').classList.add('active');
    document.getElementById('view-formatted').classList.remove('active');
    displayJsonResults();
});

document.getElementById('view-formatted').addEventListener('click', () => {
    document.getElementById('view-formatted').classList.add('active');
    document.getElementById('view-json').classList.remove('active');
    displayFormattedResults();
});
EOF

# Create README.md
cat > README.md << 'EOF'
# Web Scraper Dashboard

A web application for managing and running web scraping scripts with a user-friendly interface.

## Features

- Category-based website organization
- Dynamic input forms based on website configuration
- JSON and formatted result views
- Mock scraping results (ready for real implementation)

## Setup Instructions

1. Install Python dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Run the backend server:
   ```bash
   cd backend
   python main.py
   ```

3. Open the frontend:
   - Open `frontend/index.html` in your web browser
   - Or serve it with a simple HTTP server:
     ```bash
     cd frontend
     python -m http.server 8080
     ```

## Project Structure

```
web-scraper-project/
├── backend/
│   ├── main.py          # FastAPI backend server
│   └── requirements.txt # Python dependencies
├── frontend/
│   ├── index.html       # Main HTML file
│   ├── styles.css       # Styling
│   └── script.js        # Frontend JavaScript
└── README.md           # This file
```

## Adding New Websites

To add new websites or categories, edit the `WEBSITES_CONFIG` dictionary in `backend/main.py`.

## Integrating Real Scraping Logic

Replace the mock results in the `run_script` endpoint with your actual scraping logic:

```python
@app.post("/api/run-script")
async def run_script(script_input: ScriptInput):
    # Add your scraping logic here
    # Use script_input.website to determine which parser to use
    # Use script_input.search_term, page_number, and additional_params
    pass
```

## API Endpoints

- `GET /api/categories` - Get all categories and websites
- `GET /api/website-config/{category}/{website}` - Get input configuration for a website
- `POST /api/run-script` - Run scraping script with provided parameters
EOF

# Make the script executable
chmod +x ../setup.sh

echo -e "${GREEN}Setup complete!${NC}"
echo -e "${BLUE}Project structure created:${NC}"
echo "web-scraper-project/"
echo "├── backend/"
echo "│   ├── main.py"
echo "│   └── requirements.txt"
echo "├── frontend/"
echo "│   ├── index.html"
echo "│   ├── styles.css"
echo "│   └── script.js"
echo "└── README.md"
echo ""
echo -e "${BLUE}To run the project:${NC}"
echo "1. cd web-scraper-project/backend"
echo "2. pip install -r requirements.txt"
echo "3. python main.py"
echo "4. Open frontend/index.html in your browser"
echo ""
echo -e "${GREEN}Backend will run on http://localhost:8000${NC}"
echo -e "${GREEN}API docs available at http://localhost:8000/docs${NC}"
EOF