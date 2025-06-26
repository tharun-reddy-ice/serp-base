import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProfileDropdown from './components/ProfileDropdown';
import Login from './components/Login';
import RequestsPage from './components/RequestsPage';

function App() {
  const [scrapers, setScrapers] = useState({});
  const [selectedScraper, setSelectedScraper] = useState(null);
  const [parameters, setParameters] = useState({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('black');
  const [showRequests, setShowRequests] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('user');
    const savedSettings = localStorage.getItem('appSettings');
    
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      if (userData.isLoggedIn) {
        setIsLoggedIn(true);
        setUser(userData);
        fetchScrapers();
      }
    }
    
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setTheme(settings.theme || 'black');
      applyTheme(settings.theme || 'black');
    } else {
      applyTheme('black');
    }
  }, []);

  const applyTheme = (themeName) => {
    const body = document.body;
    const themes = {
      black: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
      white: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #ffffff 100%)',
      grey: 'linear-gradient(135deg, #6c757d 0%, #495057 50%, #6c757d 100%)'
    };
    
    body.style.background = themes[themeName] || themes.black;
    body.style.color = themeName === 'white' ? '#000000' : '#ffffff';
    
    // Update CSS custom properties for theme
    document.documentElement.style.setProperty('--text-color', themeName === 'white' ? '#000000' : '#ffffff');
    document.documentElement.style.setProperty('--text-muted', themeName === 'white' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)');
  };

  const handleLogin = (username) => {
    setIsLoggedIn(true);
    setUser({ username, name: username });
    fetchScrapers();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setSelectedScraper(null);
    setParameters({});
    setResults(null);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const fetchScrapers = async () => {
    try {
      const response = await axios.get('/api/scrapers');
      setScrapers(response.data.scrapers);
    } catch (error) {
      setError('Failed to load scrapers');
    }
  };

  const handleScraperSelect = (scraperId) => {
    setSelectedScraper(scraperId);
    
    // Pre-populate parameters with default values
    const config = scrapers[scraperId];
    const defaultParams = {};
    config.parameters.forEach(param => {
      if (param.default !== undefined) {
        defaultParams[param.name] = param.default;
      }
    });
    
    setParameters(defaultParams);
    setResults(null);
    setError(null);
  };

  const handleParameterChange = (paramName, value) => {
    setParameters(prev => ({ ...prev, [paramName]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await axios.post('/api/scrape', {
        scraper_id: selectedScraper,
        parameters: parameters
      });

      if (response.data.success) {
        setResults(response.data.data);
      } else {
        setError(response.data.error || 'Scraping failed');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportResults = () => {
    if (!results) return;
    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${selectedScraper}_${results.search_term}_${Date.now()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Show login page if not logged in
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="container-fluid py-3">
      {/* Header with branding, navigation and profile */}
      <div className="row mb-2">
        <div className="col-4">
          <h1 className="mb-0">
            <span style={{
              background: 'linear-gradient(45deg, #007bff, #00d4ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
              fontSize: '2.5rem'
            }}>
              burp.ai
            </span>
          </h1>
          <p className="text-muted mb-0">AI-Powered Data Extraction Platform</p>
        </div>
        <div className="col-4 text-center d-flex align-items-center justify-content-center">
          <nav>
            <button 
              className="btn btn-link text-white me-3" 
              onClick={() => setShowAbout(true)}
              style={{ textDecoration: 'none' }}
            >
              About Us
            </button>
            <button 
              className="btn btn-link text-white" 
              onClick={() => setShowRequests(true)}
              style={{ textDecoration: 'none' }}
            >
              Requests
            </button>
          </nav>
        </div>
        <div className="col-4 text-end d-flex align-items-center justify-content-end">
          <ProfileDropdown onLogout={handleLogout} onThemeChange={handleThemeChange} user={user} />
        </div>
      </div>


      <div className="row" style={{ marginTop: '10px' }}>
        <div className="col-lg-4 mb-4">
          <div className="glass-card p-4">
            <h3 className="mb-3">1. Choose Scraper</h3>
            <div className="row">
              {Object.entries(scrapers).map(([scraperId, config]) => (
                <div key={scraperId} className="col-12 mb-3">
                  <div 
                    className={`card scraper-card p-3 ${selectedScraper === scraperId ? 'selected' : ''}`}
                    onClick={() => handleScraperSelect(scraperId)}
                  >
                    <h5>{config.name}</h5>
                    <small className="text-muted">Click to select</small>
                  </div>
                </div>
              ))}
            </div>

            {selectedScraper && (
              <>
                <hr />
                <h3 className="mb-3">2. Configure Parameters</h3>
                <form onSubmit={handleSubmit}>
                  {scrapers[selectedScraper].parameters.map((param) => (
                    <div key={param.name} className="mb-3">
                      <label className="form-label">
                        {param.label} {param.required && <span className="text-danger">*</span>}
                      </label>
                      {param.type === 'text' && (
                        <input
                          type="text"
                          className="form-control"
                          placeholder={param.placeholder}
                          value={parameters[param.name] || ''}
                          onChange={(e) => handleParameterChange(param.name, e.target.value)}
                          required={param.required}
                        />
                      )}
                      {param.type === 'number' && (
                        <input
                          type="number"
                          className="form-control"
                          min={param.min}
                          max={param.max}
                          value={parameters[param.name] || param.default || ''}
                          onChange={(e) => {
                            const value = e.target.value ? parseInt(e.target.value) : param.default;
                            handleParameterChange(param.name, value);
                          }}
                          required={param.required}
                        />
                      )}
                    </div>
                  ))}
                  <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? 'Scraping...' : 'Start Scraping'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        <div className="col-lg-8">
          {error && (
            <div className="alert alert-danger">
              <h5>Error</h5>
              <p>{error}</p>
            </div>
          )}

          {loading && (
            <div className="text-center">
              <div className="loading-spinner"></div>
              <p>Scraping in progress... This may take a few minutes.</p>
            </div>
          )}

          {results && !loading && (
            <div>
              {/* JSON Output First */}
              <div className="glass-card p-4 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3>Raw JSON Output</h3>
                  <button className="btn btn-outline-primary" onClick={exportResults}>
                    Export JSON
                  </button>
                </div>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '10px',
                  padding: '15px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '12px'
                }}>
                  <pre className="text-white mb-0">{JSON.stringify(results, null, 2)}</pre>
                </div>
              </div>

              {/* Formatted Results */}
              <div className="glass-card p-4">
                <h3 className="mb-3">Formatted Results</h3>

                {/* Summary */}
                <div className="row mb-4 p-3 bg-light rounded">
                  <div className="col-md-3 text-center">
                    <h4 className="text-primary">{results.summary?.total_products || 0}</h4>
                    <small>Total Products</small>
                  </div>
                  <div className="col-md-3 text-center">
                    <h4 className="text-success">{results.summary?.products_with_price || 0}</h4>
                    <small>With Price</small>
                  </div>
                  <div className="col-md-3 text-center">
                    <h4 className="text-info">{results.summary?.products_with_rating || 0}</h4>
                    <small>With Rating</small>
                  </div>
                  <div className="col-md-3 text-center">
                    <h4 className="text-warning">{results.summary?.products_with_discounts || 0}</h4>
                    <small>With Discounts</small>
                  </div>
                </div>

                {/* Products/Results */}
                <div>
                  {results.products?.slice(0, 20).map((item, index) => (
                    <div key={index} className="product-card">
                      <div className="row align-items-center">
                        <div className="col-md-2">
                          {item.image_url && (
                            <img 
                              src={item.image_url} 
                              alt={item.name || item.title} 
                              className="product-image img-fluid"
                            />
                          )}
                        </div>
                        <div className="col-md-7">
                          <h6>{item.name || item.title || item.youtube_url}</h6>
                          
                          {/* E-commerce specific */}
                          {item.brand && <small className="text-muted">Brand: {item.brand}</small>}
                          
                          {/* YouTube specific */}
                          {item.creator_name && <small className="text-muted">Creator: {item.creator_name}</small>}
                          {item.duration && <small className="text-muted"> • Duration: {Math.floor(item.duration/60)}:{(item.duration%60).toString().padStart(2,'0')}</small>}
                          
                          {/* Wikipedia specific */}
                          {item.snippet && <div className="small text-muted mt-1" dangerouslySetInnerHTML={{__html: item.snippet}}></div>}
                          
                          <div className="mt-2">
                            {/* E-commerce badges */}
                            {item.price && <span className="badge bg-success me-2">{item.price}</span>}
                            {item.original_price && <span className="badge bg-secondary me-2"><s>{item.original_price}</s></span>}
                            {item.discount_percentage && <span className="badge bg-danger me-2">{item.discount_percentage}</span>}
                            {item.rating && <span className="badge bg-warning me-2">⭐ {item.rating}</span>}
                            
                            {/* YouTube badges */}
                            {item.like_count && <span className="badge bg-info me-2">👍 {item.like_count.toLocaleString()}</span>}
                            {item.upload_date && <span className="badge bg-light text-dark me-2">📅 {item.upload_date}</span>}
                          </div>
                        </div>
                        <div className="col-md-3 text-end">
                          {(item.url || item.youtube_url) && (
                            <a 
                              href={item.url || item.youtube_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn btn-sm btn-outline-primary"
                            >
                              {item.youtube_url ? 'Watch Video' : item.url ? 'View Page' : 'View Item'}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {results.products?.length > 20 && (
                    <p className="text-center text-muted">
                      Showing first 20 of {results.products.length} products. Export JSON to see all results.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!selectedScraper && !loading && !results && (
            <div className="text-center text-muted py-5">
              <h4>Select a scraper to get started</h4>
              <p>Choose from Amazon, Flipkart, JioMart, or Snapdeal</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showRequests && <RequestsPage onClose={() => setShowRequests(false)} />}
      
      {showAbout && (
        <div className="modal-overlay" onClick={() => setShowAbout(false)}>
          <div className="modal-content glass-card p-4" onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4>About burp.ai</h4>
              <button className="btn-close text-white" onClick={() => setShowAbout(false)}>×</button>
            </div>
            <div>
              <p>burp.ai is an advanced AI-powered data extraction platform that enables intelligent web scraping across multiple e-commerce and content platforms.</p>
              <h5>Features:</h5>
              <ul>
                <li>Multi-platform support (Amazon, Flipkart, Snapdeal, Wikipedia)</li>
                <li>AI-enhanced data extraction</li>
                <li>Real-time scraping with advanced anti-detection</li>
                <li>Beautiful glass morphism interface</li>
                <li>Export capabilities in multiple formats</li>
              </ul>
              <p className="text-muted mt-3">Version 1.0.0 | Built with React & Flask</p>
              <button className="btn btn-primary" onClick={() => setShowAbout(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          backdrop-filter: blur(5px);
        }
        
        .modal-content {
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          animation: modalSlideIn 0.3s ease-out;
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .btn-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

export default App;