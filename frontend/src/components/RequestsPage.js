import React, { useState } from 'react';

const RequestsPage = ({ onClose }) => {
  const [request, setRequest] = useState({
    websiteName: '',
    websiteUrl: '',
    dataType: '',
    description: '',
    email: '',
    priority: 'medium'
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Save request to localStorage (in production, send to backend)
    const requests = JSON.parse(localStorage.getItem('websiteRequests') || '[]');
    const newRequest = {
      ...request,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    requests.push(newRequest);
    localStorage.setItem('websiteRequests', JSON.stringify(requests));
    
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content glass-card p-4 text-center" onClick={e => e.stopPropagation()}>
          <div className="success-animation mb-3">
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #28a745, #20c997)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              fontSize: '24px'
            }}>
              ✓
            </div>
          </div>
          <h4 className="text-success">Request Submitted!</h4>
          <p className="text-muted">We'll review your request and get back to you within 2-3 business days.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card p-4" onClick={e => e.stopPropagation()}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4>Request New Website</h4>
          <button className="btn-close text-white" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Website Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., eBay, Etsy"
                value={request.websiteName}
                onChange={(e) => setRequest({...request, websiteName: e.target.value})}
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Website URL *</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://example.com"
                value={request.websiteUrl}
                onChange={(e) => setRequest({...request, websiteUrl: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Data Type *</label>
              <select
                className="form-control"
                value={request.dataType}
                onChange={(e) => setRequest({...request, dataType: e.target.value})}
                required
              >
                <option value="">Select data type</option>
                <option value="products">Product Information</option>
                <option value="reviews">Reviews & Ratings</option>
                <option value="pricing">Pricing Data</option>
                <option value="content">Content/Articles</option>
                <option value="listings">Property/Job Listings</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Priority</label>
              <select
                className="form-control"
                value={request.priority}
                onChange={(e) => setRequest({...request, priority: e.target.value})}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Description *</label>
            <textarea
              className="form-control"
              rows="4"
              placeholder="Describe what specific data you need from this website..."
              value={request.description}
              onChange={(e) => setRequest({...request, description: e.target.value})}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Your Email *</label>
            <input
              type="email"
              className="form-control"
              placeholder="your.email@example.com"
              value={request.email}
              onChange={(e) => setRequest({...request, email: e.target.value})}
              required
            />
          </div>

          <div className="info-box mb-4 p-3" style={{
            background: 'rgba(0, 123, 255, 0.1)',
            border: '1px solid rgba(0, 123, 255, 0.3)',
            borderRadius: '8px'
          }}>
            <h6 className="text-primary">📋 What happens next?</h6>
            <ul className="text-muted small mb-0">
              <li>Our team reviews your request within 24 hours</li>
              <li>We assess technical feasibility and compliance</li>
              <li>Development timeline: 3-7 business days</li>
              <li>You'll receive updates via email</li>
            </ul>
          </div>

          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary">
              Submit Request
            </button>
            <button type="button" className="btn btn-outline-primary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
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
          width: 90%;
          max-width: 700px;
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
        
        .success-animation {
          animation: bounceIn 0.6s ease-out;
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default RequestsPage;