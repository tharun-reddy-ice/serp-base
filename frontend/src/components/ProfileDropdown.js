import React, { useState, useEffect, useRef } from 'react';
import Settings from './Settings';

const ProfileDropdown = ({ onLogout, onThemeChange, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Tharun',
    email: 'tharun@burp.ai',
    dob: '1995-01-01',
    password: ''
  });
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Load profile from localStorage
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileSave = (e) => {
    e.preventDefault();
    // Save profile data (you can implement localStorage or API call here)
    localStorage.setItem('userProfile', JSON.stringify(profile));
    alert('Profile updated successfully!');
    setShowProfile(false);
  };

  const ProfileModal = () => (
    <div className="modal-overlay" onClick={() => setShowProfile(false)}>
      <div className="modal-content glass-card p-4" onClick={e => e.stopPropagation()}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Profile Settings</h4>
          <button className="btn-close text-white" onClick={() => setShowProfile(false)}>×</button>
        </div>
        <form onSubmit={handleProfileSave}>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-control"
              value={profile.name}
              onChange={(e) => setProfile({...profile, name: e.target.value})}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={profile.email}
              onChange={(e) => setProfile({...profile, email: e.target.value})}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Date of Birth</label>
            <input
              type="date"
              className="form-control"
              value={profile.dob}
              onChange={(e) => setProfile({...profile, dob: e.target.value})}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Leave blank to keep current password"
              value={profile.password}
              onChange={(e) => setProfile({...profile, password: e.target.value})}
            />
          </div>
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary">Save Changes</button>
            <button type="button" className="btn btn-outline-primary" onClick={() => setShowProfile(false)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );

  const AboutModal = () => (
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
  );

  return (
    <>
      <div className="dropdown" ref={dropdownRef}>
        <button 
          className="btn btn-outline-primary dropdown-toggle d-flex align-items-center gap-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="avatar">
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #007bff, #00d4ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
          <span>{user?.name || user?.username || 'User'}</span>
        </button>
        
        {isOpen && (
          <div className="dropdown-menu show glass-card" style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            minWidth: '200px',
            zIndex: 1000,
            marginTop: '8px'
          }}>
            <button 
              className="dropdown-item text-white" 
              onClick={() => {
                setShowProfile(true);
                setIsOpen(false);
              }}
            >
              <i className="me-2">👤</i> Profile
            </button>
            <button 
              className="dropdown-item text-white" 
              onClick={() => {
                setShowAbout(true);
                setIsOpen(false);
              }}
            >
              <i className="me-2">ℹ️</i> About Us
            </button>
            <hr className="dropdown-divider" style={{borderColor: 'rgba(255,255,255,0.2)'}} />
            <button 
              className="dropdown-item text-white"
              onClick={() => {
                setShowSettings(true);
                setIsOpen(false);
              }}
            >
              <i className="me-2">⚙️</i> Settings
            </button>
            <button 
              className="dropdown-item text-white"
              onClick={() => {
                if (window.confirm('Are you sure you want to logout?')) {
                  localStorage.removeItem('user');
                  localStorage.removeItem('userProfile');
                  onLogout();
                }
                setIsOpen(false);
              }}
            >
              <i className="me-2">🚪</i> Logout
            </button>
          </div>
        )}
      </div>

      {showProfile && <ProfileModal />}
      {showAbout && <AboutModal />}
      {showSettings && <Settings onClose={() => setShowSettings(false)} onThemeChange={onThemeChange} />}

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
        
        .dropdown-item {
          background: transparent;
          border: none;
          padding: 12px 16px;
          width: 100%;
          text-align: left;
          transition: all 0.2s ease;
          color: var(--text-color) !important;
        }
        
        .dropdown-item:hover {
          background: var(--dropdown-item-hover);
          transform: translateX(5px);
          color: var(--text-color) !important;
        }
        
        .btn-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
        }
      `}</style>
    </>
  );
};

export default ProfileDropdown;