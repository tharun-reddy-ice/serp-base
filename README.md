# 🌟 burp.ai - AI-Powered Data Extraction Platform

<div align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Flask-2.3.0-green?style=for-the-badge&logo=flask" alt="Flask" />
  <img src="https://img.shields.io/badge/Python-3.9+-yellow?style=for-the-badge&logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/License-MIT-red?style=for-the-badge" alt="License" />
</div>

## 📖 Overview

**burp.ai** is an advanced AI-powered data extraction platform that enables intelligent web scraping across multiple e-commerce and content platforms. Built with a modern React frontend and robust Flask backend, it provides a beautiful glass morphism interface for seamless data extraction and analysis.

## ✨ Key Features

### 🎯 **Core Functionality**
- **Multi-Platform Support** - Amazon, Flipkart, Snapdeal, Wikipedia scraping
- **AI-Enhanced Extraction** - Intelligent data processing and normalization
- **Real-time Scraping** - Live data extraction with progress tracking
- **Advanced Anti-Detection** - Smart scraping with built-in protection

### 📊 **Data Management**
- **Multiple Export Formats** - JSON, CSV, Excel, XML exports
- **Interactive Table View** - Sortable, searchable, paginated data display
- **Advanced Filtering** - Search and filter capabilities
- **Bulk Operations** - Select and export specific data rows

### 📈 **Analytics Dashboard**
- **Usage Statistics** - Comprehensive API call tracking
- **Visual Charts** - Pie charts, bar charts, usage trends
- **Performance Metrics** - Success rates, error tracking
- **Export Analytics** - Download usage reports

### 🎨 **User Interface**
- **Glass Morphism Design** - Beautiful, modern interface
- **Multi-Theme Support** - Black, white, and grey themes
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Progressive Web App** - Offline-capable functionality

### 🔐 **Authentication & Security**
- **User Authentication** - Secure login system
- **Profile Management** - User settings and preferences
- **Session Persistence** - Remember user sessions

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16.0+ and npm
- **Python** 3.9+ and pip
- **Git** for version control

### Installation

#### Option 1: Quick Start (Recommended)
```bash
git clone https://github.com/tharun-reddy-ice/serp-base.git
cd serp-base
./start_all.sh
```

#### Option 2: Manual Setup
```bash
# 1. Clone Repository
git clone https://github.com/tharun-reddy-ice/serp-base.git
cd serp-base

# 2. Backend Setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Frontend Setup
cd ../frontend
npm install

# 4. Start Backend (Terminal 1)
cd ../backend
./start_backend.sh

# 5. Start Frontend (Terminal 2)
cd ../frontend
./start_frontend.sh
```

#### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001

### Default Login Credentials
- **Username:** `tharun`
- **Password:** `demo123`

## 🎯 How to Use

### Basic Scraping Workflow
1. **🔐 Login** to the platform using demo credentials
2. **🎯 Select Scraper** - Choose from Amazon, Flipkart, Snapdeal, or Wikipedia
3. **⚙️ Configure Parameters** - Enter search terms and page limits
4. **🚀 Start Scraping** - Click "Start Scraping" and watch real-time progress
5. **📊 View Results** - Choose from JSON, Card, or Table view
6. **💾 Export Data** - Download in JSON, CSV, Excel, or XML format

### Advanced Features
- **📋 Table View**: Sort, filter, and select specific rows for export
- **📈 Analytics**: Monitor your usage patterns and API performance
- **🎨 Themes**: Switch between beautiful black, white, and grey themes
- **📤 Bulk Export**: Export selected rows or complete datasets

## 📁 Project Structure

```
serp-base/
├── backend/                    # Flask Backend
│   ├── app.py                 # Main Flask application
│   ├── requirements.txt       # Python dependencies
│   ├── amazon_scraper.py      # Amazon scraping logic
│   ├── flipkart_scraper.py    # Flipkart scraping logic
│   ├── snapdeal.py           # Snapdeal scraping logic
│   └── wiki_json.py          # Wikipedia scraping logic
├── frontend/                   # React Frontend
│   ├── public/
│   │   └── index.html        # Main HTML template
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   ├── components/       # React components
│   │   │   ├── Analytics.js  # Analytics dashboard
│   │   │   ├── Login.js      # Authentication system
│   │   │   ├── TableView.js  # Advanced data table
│   │   │   ├── Settings.js   # User preferences
│   │   │   ├── ProfileDropdown.js # User profile
│   │   │   └── RequestsPage.js # Feature requests
│   │   └── utils/
│   │       └── exportUtils.js # Export functionality
│   ├── package.json          # Node.js dependencies
│   └── package-lock.json
├── .gitignore                 # Git ignore rules
├── start_all.sh              # Quick start script
├── start_backend.sh          # Backend startup
├── start_frontend.sh         # Frontend startup
└── README.md                 # This documentation
```

## 🛠️ Available Scripts

### Backend Scripts
```bash
python app.py              # Start Flask development server
./start_backend.sh         # Start backend with environment setup
python manual_test.py       # Run manual API tests
```

### Frontend Scripts
```bash
npm start                   # Start development server
npm build                   # Build for production
npm test                    # Run tests
./start_frontend.sh        # Start frontend with proper setup
```

### Combined Scripts
```bash
./start_all.sh             # Start both backend and frontend
```

## 📊 Supported Platforms

| Platform | Status | Data Types |
|----------|--------|------------|
| 🛒 **Amazon** | ✅ Active | Products, prices, ratings, reviews, images |
| 🛍️ **Flipkart** | ✅ Active | Products, prices, offers, specifications |
| 🏪 **Snapdeal** | ✅ Active | Products, discounts, seller information |
| 📚 **Wikipedia** | ✅ Active | Articles, summaries, references, links |

## 🔧 API Endpoints

### Core Endpoints
- `GET /api/scrapers` - Get available scrapers and configurations
- `POST /api/scrape` - Execute scraping with parameters
- `GET /api/health` - Health check and system status

### Example API Usage
```bash
# Get available scrapers
curl http://localhost:5001/api/scrapers

# Start scraping
curl -X POST http://localhost:5001/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"scraper_id": "amazon", "parameters": {"search_term": "laptop", "max_pages": 2}}'
```

## 📈 Analytics Features

- **📊 Real-time Dashboard**: Monitor API calls, success rates, and usage patterns
- **📈 Visual Charts**: Interactive pie charts showing scraper usage distribution
- **📋 Usage Statistics**: Track daily, weekly, and monthly scraping activity
- **💾 Export Analytics**: Download detailed usage reports
- **🎯 Performance Insights**: Identify most/least used scrapers and peak usage times

## 🎨 Theme System

burp.ai features a sophisticated theme system with three beautiful options:

- **🖤 Black Theme**: Professional dark mode with high contrast
- **⚪ White Theme**: Clean light mode for bright environments  
- **🌫️ Grey Theme**: Balanced neutral theme for extended usage

Themes apply globally and persist across sessions with localStorage integration.

## 💾 Export Capabilities

### Supported Formats
- **📄 JSON**: Complete data with metadata
- **📊 CSV**: Spreadsheet-compatible format
- **📈 Excel**: Native Excel format (.xlsx)
- **🗂️ XML**: Structured markup format

### Export Options
- **All Data**: Export complete dataset
- **Selected Rows**: Export only chosen table rows
- **Smart Naming**: Automatic filename generation with timestamps

## 🔒 Security Features

- **Authentication System**: Secure login with session management
- **Input Validation**: Comprehensive parameter validation
- **Rate Limiting**: Built-in protection against abuse
- **Data Sanitization**: Clean and safe data processing
- **CORS Protection**: Proper cross-origin resource sharing

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork** the repository on GitHub
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request with detailed description

### Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint/Prettier for JavaScript formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 🐛 Troubleshooting

### Common Issues

**Backend Issues:**
- **Port 5001 in use**: Kill existing processes or change port in app.py
- **Module not found**: Ensure virtual environment is activated
- **Permission denied**: Check file permissions for script files

**Frontend Issues:**
- **Port 3000 in use**: React will prompt to use different port
- **npm install fails**: Clear npm cache with `npm cache clean --force`
- **Build errors**: Check Node.js version compatibility

**Scraping Issues:**
- **Anti-bot detection**: Some sites have advanced protection
- **Timeout errors**: Increase timeout values in scraper configs
- **Rate limiting**: Add delays between requests

### Performance Optimization
- Use pagination for large datasets
- Enable caching for repeated requests
- Monitor memory usage during bulk operations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the powerful frontend framework
- **Flask Team** for the lightweight Python web framework
- **BeautifulSoup** for robust HTML parsing capabilities
- **Bootstrap** for responsive UI components
- **Chart.js** for beautiful data visualizations

## 📞 Support & Contact

- **Email**: tharun@burp.ai
- **GitHub Issues**: Create an issue for bug reports or feature requests
- **Documentation**: Check this README for comprehensive guides

---

<div align="center">
  <strong>🚀 Built with ❤️ by the burp.ai Team</strong><br>
  <em>Empowering intelligent data extraction since 2024</em>
</div>