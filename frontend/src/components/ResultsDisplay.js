import React, { useState } from 'react';

const ResultsDisplay = ({ results }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  if (!results) return null;

  const { summary, products, search_term, scraper_used, timestamp } = results;

  // Sort products
  const sortedProducts = [...(products || [])].sort((a, b) => {
    let aValue = a[sortBy] || '';
    let bValue = b[sortBy] || '';

    if (sortBy === 'price_numeric' || sortBy === 'original_price_numeric') {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    } else if (sortBy === 'rating') {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    } else {
      aValue = aValue.toString().toLowerCase();
      bValue = bValue.toString().toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div>
      {/* Summary Statistics */}
      <div className="summary-stats">
        <div className="row">
          <div className="col-md-3 text-center">
            <h4 className="text-primary">{summary?.total_products || 0}</h4>
            <small>Total Products</small>
          </div>
          <div className="col-md-3 text-center">
            <h4 className="text-success">{summary?.products_with_price || 0}</h4>
            <small>With Price</small>
          </div>
          <div className="col-md-3 text-center">
            <h4 className="text-info">{summary?.products_with_rating || 0}</h4>
            <small>With Rating</small>
          </div>
          <div className="col-md-3 text-center">
            <h4 className="text-warning">{summary?.products_with_discounts || summary?.products_with_deals || 0}</h4>
            <small>With Discounts</small>
          </div>
        </div>

        {summary?.price_range && (
          <div className="row mt-3">
            <div className="col-md-4 text-center">
              <strong>Price Range:</strong> 
              ₹{summary.price_range.min_price?.toLocaleString()} - ₹{summary.price_range.max_price?.toLocaleString()}
            </div>
            <div className="col-md-4 text-center">
              <strong>Avg Price:</strong> ₹{summary.price_range.avg_price?.toLocaleString()}
            </div>
            <div className="col-md-4 text-center">
              <strong>Scraped from:</strong> {scraper_used}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="row mb-3">
        <div className="col-md-6">
          <div className="d-flex align-items-center">
            <label className="me-2">Sort by:</label>
            <select 
              className="form-select form-select-sm" 
              value={sortBy} 
              onChange={(e) => handleSort(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="price_numeric">Price</option>
              <option value="rating">Rating</option>
              <option value="brand">Brand</option>
            </select>
            <button 
              className="btn btn-sm btn-outline-secondary ms-2"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
        <div className="col-md-6 text-end">
          <small className="text-muted">
            Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, sortedProducts.length)} of {sortedProducts.length} products
          </small>
        </div>
      </div>

      {/* Products List */}
      <div className="row">
        {currentProducts.map((product, index) => (
          <div key={index} className="col-12 mb-3">
            <div className="product-card">
              <div className="row align-items-center">
                <div className="col-md-2">
                  {product.image_url && (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="product-image img-fluid"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23e9ecef"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%236c757d">No Image</text></svg>';
                      }}
                    />
                  )}
                </div>
                <div className="col-md-7">
                  <h6 className="mb-1">
                    {product.url ? (
                      <a href={product.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                        {product.name}
                      </a>
                    ) : (
                      product.name
                    )}
                  </h6>
                  
                  {product.brand && (
                    <small className="text-muted">Brand: {product.brand}</small>
                  )}
                  
                  <div className="mt-2">
                    {product.price && (
                      <span className="badge bg-success me-2">
                        {product.price}
                      </span>
                    )}
                    
                    {product.original_price && (
                      <span className="badge bg-secondary me-2">
                        <s>{product.original_price}</s>
                      </span>
                    )}
                    
                    {product.discount_percentage && (
                      <span className="badge bg-danger me-2">
                        {product.discount_percentage}
                      </span>
                    )}
                    
                    {product.rating && (
                      <span className="badge bg-warning me-2">
                        ⭐ {product.rating}
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-md-3 text-end">
                  <div className="small text-muted">
                    {product.total_ratings && (
                      <div>{product.total_ratings} ratings</div>
                    )}
                    {product.seller_name && (
                      <div>Seller: {product.seller_name}</div>
                    )}
                    {product.availability_info && (
                      <div className="text-success">{product.availability_info}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav>
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
            </li>
            
            {[...Array(totalPages)].map((_, index) => (
              <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </button>
              </li>
            ))}
            
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default ResultsDisplay;