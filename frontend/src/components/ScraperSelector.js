import React from 'react';

const ScraperSelector = ({ scrapers, selectedScraper, onSelect }) => {
  return (
    <div className="row">
      {Object.entries(scrapers).map(([scraperId, config]) => (
        <div key={scraperId} className="col-12 mb-3">
          <div 
            className={`card scraper-card ${selectedScraper === scraperId ? 'selected' : ''}`}
            onClick={() => onSelect(scraperId)}
          >
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <i className={`fas fa-${getScraperIcon(scraperId)} fa-2x text-primary`}></i>
                </div>
                <div>
                  <h5 className="card-title mb-1">{config.name}</h5>
                  <p className="card-text text-muted small mb-0">
                    {getScraperDescription(scraperId)}
                  </p>
                </div>
                {selectedScraper === scraperId && (
                  <div className="ms-auto">
                    <i className="fas fa-check-circle text-success fa-lg"></i>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const getScraperIcon = (scraperId) => {
  const icons = {
    amazon: 'shopping-cart',
    flipkart: 'store',
    jiomart: 'shopping-basket',
    snapdeal: 'tags'
  };
  return icons[scraperId] || 'shopping-bag';
};

const getScraperDescription = (scraperId) => {
  const descriptions = {
    amazon: 'Scrape products from Amazon India',
    flipkart: 'Extract product data from Flipkart',
    jiomart: 'Get product information from JioMart',
    snapdeal: 'Scrape deals and products from Snapdeal'
  };
  return descriptions[scraperId] || 'E-commerce product scraper';
};

export default ScraperSelector;