import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProfileDropdown from './components/ProfileDropdown';
import Login from './components/Login';
import RequestsPage from './components/RequestsPage';
import Analytics from './components/Analytics';
import TableView from './components/TableView';
import { exportData } from './utils/exportUtils';

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
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [viewMode, setViewMode] = useState('formatted'); // 'json', 'formatted', 'table'
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [totalRows, setTotalRows] = useState(0);

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

  // Close dropdown when clicking outside or window resize
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && 
          !event.target.closest('.dropdown') && 
          !event.target.closest('.dropdown-menu') && 
          !event.target.closest('.export-dropdown-portal')) {
        setShowExportDropdown(false);
      }
    };

    const handleResize = () => {
      if (showExportDropdown) {
        setShowExportDropdown(false);
      }
    };

    const handleScroll = () => {
      if (showExportDropdown) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showExportDropdown]);

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
    const isWhiteTheme = themeName === 'white';
    document.documentElement.style.setProperty('--text-color', isWhiteTheme ? '#000000' : '#ffffff');
    document.documentElement.style.setProperty('--text-muted', isWhiteTheme ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)');
    document.documentElement.style.setProperty('--card-bg', isWhiteTheme ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)');
    document.documentElement.style.setProperty('--card-border', isWhiteTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)');
    document.documentElement.style.setProperty('--input-bg', isWhiteTheme ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)');
    document.documentElement.style.setProperty('--input-border', isWhiteTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)');
    document.documentElement.style.setProperty('--dropdown-bg', isWhiteTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.95)');
    document.documentElement.style.setProperty('--dropdown-item-hover', isWhiteTheme ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)');
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
    // Don't clear any existing data when changing themes
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

  const logApiCall = (scraper, success, error = null) => {
    const apiCalls = JSON.parse(localStorage.getItem('apiCallHistory') || '[]');
    const newCall = {
      id: Date.now(),
      scraper: scraper,
      success: success,
      timestamp: new Date().toISOString(),
      error: error,
      parameters: parameters
    };
    apiCalls.push(newCall);
    
    // Keep only last 1000 calls to prevent storage bloat
    if (apiCalls.length > 1000) {
      apiCalls.splice(0, apiCalls.length - 1000);
    }
    
    localStorage.setItem('apiCallHistory', JSON.stringify(apiCalls));
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
        setTotalRows(response.data.data.products?.length || 0);
        setSelectedRows(new Set());
        logApiCall(selectedScraper, true);
      } else {
        const errorMsg = response.data.error || 'Scraping failed';
        setError(errorMsg);
        logApiCall(selectedScraper, false, errorMsg);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Network error occurred';
      setError(errorMsg);
      logApiCall(selectedScraper, false, errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format, exportType = 'all') => {
    if (!results) return;
    
    let dataToExport;
    let filenamePrefix;
    
    if (exportType === 'selected' && selectedRows.size > 0) {
      // Export only selected rows
      const selectedData = Array.from(selectedRows).map(index => results.products[index]);
      dataToExport = { products: selectedData, summary: { total_products: selectedData.length } };
      filenamePrefix = `${selectedScraper}_selected_${selectedRows.size}_rows`;
    } else {
      // Export all data
      dataToExport = results;
      filenamePrefix = `${selectedScraper}_all_${results.products?.length || 0}_rows`;
    }
    
    const filename = `${filenamePrefix}_${Date.now()}`;
    exportData(dataToExport, format, filename);
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
              className="btn btn-link text-white me-3" 
              onClick={() => setShowAnalytics(true)}
              style={{ textDecoration: 'none' }}
            >
              Analytics
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
              {/* View Mode Selector */}
              <div className="glass-card p-3 mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="btn-group" role="group">
                    <button 
                      className={`btn ${viewMode === 'json' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => {
                        setViewMode('json');
                        setSelectedRows(new Set());
                        setTotalRows(results.products?.length || 0);
                      }}
                    >
                      🔧 JSON View
                    </button>
                    <button 
                      className={`btn ${viewMode === 'formatted' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => {
                        setViewMode('formatted');
                        setSelectedRows(new Set());
                        setTotalRows(results.products?.length || 0);
                      }}
                    >
                      📋 Card View
                    </button>
                    <button 
                      className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => {
                        setViewMode('table');
                        setTotalRows(results.products?.length || 0);
                      }}
                    >
                      📊 Table View
                    </button>
                  </div>
                  
                  <div className="dropdown" style={{ position: 'relative' }}>
                    <button 
                      className="btn btn-success dropdown-toggle" 
                      type="button" 
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const viewportHeight = window.innerHeight;
                        const dropdownHeight = 200; // Estimated dropdown height
                        
                        // Calculate if dropdown should open upward
                        const spaceBelow = viewportHeight - rect.bottom;
                        const shouldOpenUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
                        
                        setDropdownPosition({
                          top: shouldOpenUp ? rect.top - dropdownHeight - 10 : rect.bottom + 5,
                          right: window.innerWidth - rect.right
                        });
                        setShowExportDropdown(!showExportDropdown);
                      }}
                    >
                      📥 Export Data {selectedRows.size > 0 ? `(${selectedRows.size} selected)` : `(${totalRows} total)`}
                    </button>
                  </div>
                  
                </div>
              </div>

              {/* JSON View */}
              {viewMode === 'json' && (
                <div className="glass-card p-4">
                  <h3 className="mb-3">Raw JSON Output</h3>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '10px',
                    padding: '15px',
                    maxHeight: '500px',
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }}>
                    <pre className="text-white mb-0">{JSON.stringify(results, null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Table View */}
              {viewMode === 'table' && (
                <TableView 
                  data={results.products || []} 
                  title={`${selectedScraper} Results`}
                  onSelectionChange={(selected, total) => {
                    setSelectedRows(selected);
                    setTotalRows(total);
                  }}
                  hideExportOptions={true}
                />
              )}

              {/* Formatted Card View */}
              {viewMode === 'formatted' && (
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
                        Showing first 20 of {results.products.length} products. Use Table View or Export to see all results.
                      </p>
                    )}
                  </div>
                </div>
              )}
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
      {showAnalytics && <Analytics onClose={() => setShowAnalytics(false)} />}
      
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

      {/* Global Export Dropdown Portal */}
      {showExportDropdown && (
        <>
          <div 
            className="dropdown-backdrop"
            onClick={() => setShowExportDropdown(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9998,
              background: 'transparent'
            }}
          />
          <div 
            className="export-dropdown-portal" 
            style={{ 
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
              zIndex: 9999,
              minWidth: '200px',
              background: 'var(--dropdown-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '10px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(20px)',
              padding: '8px',
              animation: 'dropdownFadeIn 0.15s ease-out'
            }}
          >
            {selectedRows.size > 0 ? (
              <>
                <div style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--card-border)', marginBottom: '4px' }}>
                  Export Selected ({selectedRows.size} rows)
                </div>
                <button 
                  className="dropdown-item-custom" 
                  onClick={() => { handleExport('json', 'selected'); setShowExportDropdown(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'var(--text-color)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginBottom: '4px'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--dropdown-item-hover)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  🔧 Selected as JSON
                </button>
                <button 
                  className="dropdown-item-custom" 
                  onClick={() => { handleExport('csv', 'selected'); setShowExportDropdown(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'var(--text-color)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginBottom: '4px'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--dropdown-item-hover)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  📊 Selected as CSV
                </button>
                <button 
                  className="dropdown-item-custom" 
                  onClick={() => { handleExport('excel', 'selected'); setShowExportDropdown(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'var(--text-color)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginBottom: '4px'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--dropdown-item-hover)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  📈 Selected as Excel
                </button>
                <button 
                  className="dropdown-item-custom" 
                  onClick={() => { handleExport('xml', 'selected'); setShowExportDropdown(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'var(--text-color)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginBottom: '8px'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--dropdown-item-hover)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  📄 Selected as XML
                </button>
                <div style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)', marginBottom: '4px' }}>
                  Export All Data ({totalRows} rows)
                </div>
              </>
            ) : (
              <div style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--card-border)', marginBottom: '4px' }}>
                Export All Data ({totalRows} rows)
              </div>
            )}
            <button 
              className="dropdown-item-custom" 
              onClick={() => { handleExport('json', 'all'); setShowExportDropdown(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: 'var(--text-color)',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '4px'
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--dropdown-item-hover)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              🔧 All as JSON
            </button>
            <button 
              className="dropdown-item-custom" 
              onClick={() => { handleExport('csv', 'all'); setShowExportDropdown(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: 'var(--text-color)',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '4px'
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--dropdown-item-hover)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              📊 All as CSV
            </button>
            <button 
              className="dropdown-item-custom" 
              onClick={() => { handleExport('excel', 'all'); setShowExportDropdown(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: 'var(--text-color)',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '4px'
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--dropdown-item-hover)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              📈 All as Excel
            </button>
            <button 
              className="dropdown-item-custom" 
              onClick={() => { handleExport('xml', 'all'); setShowExportDropdown(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: 'var(--text-color)',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--dropdown-item-hover)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              📄 All as XML
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;