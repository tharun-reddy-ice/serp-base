# Dynamic Multi-Platform Scraper

A full-stack application that lets you dynamically choose and configure different scrapers (E-commerce: Amazon, Flipkart, JioMart, Snapdeal + Content: Wikipedia, YouTube) through a web interface.

## Quick Start

**Option 1: Start both servers together**
```bash
./start_all.sh
```

**Option 2: Start separately**
1. **Backend** (terminal 1): `./start_backend.sh`
2. **Frontend** (terminal 2): `./start_frontend.sh`

3. **Open Browser**: Navigate to `http://localhost:3000`

## How It Works

1. **Select Scraper**: Choose from Amazon, Flipkart, JioMart, Snapdeal, Wikipedia, or YouTube
2. **Configure**: Enter search term and number of pages
3. **Scrape**: Click "Start Scraping" and wait for results
4. **View Results**: See products with prices, ratings, images
5. **Export**: Download results as JSON

## Features

- **Dynamic Forms**: Parameters change based on selected scraper
- **Real-time Results**: Live display with product cards
- **Export Function**: Download data as JSON
- **Responsive Design**: Works on desktop and mobile
- **Error Handling**: Clear error messages and loading states

## File Structure

```
├── backend/
│   ├── app.py              # Flask API server
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   └── index.js       # React entry point
│   ├── public/
│   │   └── index.html     # HTML template
│   └── package.json       # Node.js dependencies
├── start_backend.sh       # Backend startup script
├── start_frontend.sh      # Frontend startup script
└── README.md             # This file
```

## API Endpoints

- `GET /api/scrapers` - Get available scrapers
- `POST /api/scrape` - Execute scraping
- `GET /api/health` - Health check

## Troubleshooting

- **Backend not starting**: Make sure Python 3.8+ is installed
- **Frontend not starting**: Make sure Node.js 14+ is installed
- **Scraping fails**: Some sites have anti-bot protection
- **CORS errors**: Backend should auto-handle CORS for localhost:3000