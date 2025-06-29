import React, { useState, useEffect } from 'react';

const Analytics = ({ onClose }) => {
  const [analytics, setAnalytics] = useState({
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    scraperStats: {},
    dailyStats: {},
    monthlyStats: {}
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = () => {
    // Load analytics data from localStorage
    const apiCalls = JSON.parse(localStorage.getItem('apiCallHistory') || '[]');
    const scraperCounts = {};
    const dailyCounts = {};
    const monthlyCounts = {};
    
    let successful = 0;
    let failed = 0;

    apiCalls.forEach(call => {
      // Count by scraper
      scraperCounts[call.scraper] = (scraperCounts[call.scraper] || 0) + 1;
      
      // Count by day
      const date = new Date(call.timestamp).toDateString();
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      
      // Count by month
      const month = new Date(call.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
      
      // Count success/failure
      if (call.success) {
        successful++;
      } else {
        failed++;
      }
    });

    setAnalytics({
      totalCalls: apiCalls.length,
      successfulCalls: successful,
      failedCalls: failed,
      scraperStats: scraperCounts,
      dailyStats: dailyCounts,
      monthlyStats: monthlyCounts
    });
  };

  const SimpleBarChart = ({ data, title, color = '#007bff' }) => {
    const maxValue = Math.max(...Object.values(data));
    
    return (
      <div className="chart-container mb-4">
        <h6 className="text-center mb-3">{title}</h6>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="chart-bar-item mb-2">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <small className="text-muted">{key}</small>
                <small className="text-white">{value}</small>
              </div>
              <div className="progress" style={{ height: '8px' }}>
                <div 
                  className="progress-bar"
                  style={{ 
                    width: `${(value / maxValue) * 100}%`,
                    backgroundColor: color
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const PieChart = ({ data, title }) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'];
    
    return (
      <div className="chart-container mb-4">
        <h6 className="text-center mb-3">{title}</h6>
        <div className="pie-chart-container">
          <div className="pie-chart" style={{
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: `conic-gradient(${Object.entries(data).map(([key, value], index) => {
              const percentage = (value / total) * 100;
              return `${colors[index % colors.length]} 0deg ${percentage * 3.6}deg`;
            }).join(', ')})`,
            margin: '0 auto 20px'
          }}></div>
          <div className="pie-chart-legend">
            {Object.entries(data).map(([key, value], index) => (
              <div key={key} className="legend-item d-flex align-items-center mb-1">
                <div 
                  className="legend-color"
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: colors[index % colors.length],
                    borderRadius: '2px',
                    marginRight: '8px'
                  }}
                ></div>
                <small className="text-muted">{key}: {value} ({((value/total)*100).toFixed(1)}%)</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div className="col-md-3 mb-3">
      <div className="glass-card p-3 text-center">
        <div style={{ fontSize: '2rem', color: color }}>{icon}</div>
        <h4 className="text-white">{value}</h4>
        <small className="text-muted">{title}</small>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card p-4" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4>📊 Analytics Dashboard</h4>
          <button className="btn-close text-white" onClick={onClose}>×</button>
        </div>

        {/* Summary Statistics */}
        <div className="row mb-4">
          <StatCard 
            title="Total API Calls" 
            value={analytics.totalCalls} 
            icon="🔄" 
            color="#007bff" 
          />
          <StatCard 
            title="Successful Calls" 
            value={analytics.successfulCalls} 
            icon="✅" 
            color="#28a745" 
          />
          <StatCard 
            title="Failed Calls" 
            value={analytics.failedCalls} 
            icon="❌" 
            color="#dc3545" 
          />
          <StatCard 
            title="Success Rate" 
            value={analytics.totalCalls > 0 ? `${((analytics.successfulCalls/analytics.totalCalls)*100).toFixed(1)}%` : '0%'} 
            icon="📈" 
            color="#ffc107" 
          />
        </div>

        {/* Charts */}
        <div className="row">
          <div className="col-md-6">
            <div className="glass-card p-3">
              {Object.keys(analytics.scraperStats).length > 0 ? (
                <PieChart data={analytics.scraperStats} title="Usage by Scraper" />
              ) : (
                <div className="text-center text-muted py-4">
                  <p>No scraper usage data available</p>
                  <small>Start using scrapers to see statistics</small>
                </div>
              )}
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="glass-card p-3">
              {Object.keys(analytics.dailyStats).length > 0 ? (
                <SimpleBarChart 
                  data={Object.fromEntries(
                    Object.entries(analytics.dailyStats)
                      .sort(([a], [b]) => new Date(a) - new Date(b))
                      .slice(-7) // Last 7 days
                  )} 
                  title="Daily Usage (Last 7 Days)" 
                  color="#28a745" 
                />
              ) : (
                <div className="text-center text-muted py-4">
                  <p>No daily usage data available</p>
                  <small>API calls will be tracked here</small>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-12">
            <div className="glass-card p-3">
              {Object.keys(analytics.monthlyStats).length > 0 ? (
                <SimpleBarChart 
                  data={analytics.monthlyStats} 
                  title="Monthly Usage Trends" 
                  color="#6f42c1" 
                />
              ) : (
                <div className="text-center text-muted py-4">
                  <p>No monthly usage data available</p>
                  <small>Long-term trends will appear here</small>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Insights */}
        <div className="row mt-3">
          <div className="col-12">
            <div className="glass-card p-3">
              <h6 className="mb-3">💡 Insights</h6>
              <div className="row">
                <div className="col-md-4 text-center">
                  <div className="insight-card p-2">
                    <div style={{ fontSize: '1.5rem' }}>🏆</div>
                    <small className="text-muted">Most Used Scraper</small>
                    <div className="text-white">
                      {Object.keys(analytics.scraperStats).length > 0 
                        ? Object.entries(analytics.scraperStats).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'
                        : 'None'
                      }
                    </div>
                  </div>
                </div>
                <div className="col-md-4 text-center">
                  <div className="insight-card p-2">
                    <div style={{ fontSize: '1.5rem' }}>📅</div>
                    <small className="text-muted">Most Active Day</small>
                    <div className="text-white">
                      {Object.keys(analytics.dailyStats).length > 0 
                        ? Object.entries(analytics.dailyStats).sort(([,a], [,b]) => b - a)[0]?.[0]?.split(' ').slice(0, 3).join(' ') || 'None'
                        : 'None'
                      }
                    </div>
                  </div>
                </div>
                <div className="col-md-4 text-center">
                  <div className="insight-card p-2">
                    <div style={{ fontSize: '1.5rem' }}>⚡</div>
                    <small className="text-muted">Avg. Daily Calls</small>
                    <div className="text-white">
                      {Object.keys(analytics.dailyStats).length > 0 
                        ? Math.round(analytics.totalCalls / Object.keys(analytics.dailyStats).length)
                        : 0
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <button className="btn btn-primary me-2" onClick={() => {
            // Export analytics data
            const dataStr = JSON.stringify(analytics, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `burp_ai_analytics_${Date.now()}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
          }}>
            Export Analytics
          </button>
          <button className="btn btn-outline-danger" onClick={() => {
            if (window.confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
              localStorage.removeItem('apiCallHistory');
              loadAnalytics();
            }
          }}>
            Clear Data
          </button>
        </div>
      </div>

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
          width: 95%;
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
        
        .chart-container {
          background: var(--card-bg);
          border-radius: 10px;
          padding: 15px;
          border: 1px solid var(--card-border);
          color: var(--text-color);
        }
        
        .progress {
          background: var(--input-bg);
          border-radius: 4px;
        }
        
        .insight-card {
          background: var(--card-bg);
          border-radius: 8px;
          border: 1px solid var(--card-border);
          color: var(--text-color);
        }
        
        h4, h6, .text-white, .text-muted, small {
          color: var(--text-color) !important;
        }
        
        .text-muted {
          color: var(--text-muted) !important;
        }
        
        .pie-chart-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default Analytics;