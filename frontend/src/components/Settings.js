import React, { useState, useEffect } from 'react';

const Settings = ({ onClose, onThemeChange }) => {
  const [settings, setSettings] = useState({
    theme: 'black',
    notifications: true,
    autoExport: false
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('appSettings', JSON.stringify(settings));
    
    // Apply theme change
    onThemeChange(settings.theme);
    
    alert('Settings saved successfully!');
    onClose();
  };

  const handleThemeChange = (theme) => {
    setSettings({...settings, theme});
    // Apply theme immediately for preview (but don't save yet)
    onThemeChange(theme);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card p-4" onClick={e => e.stopPropagation()}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4>Settings</h4>
          <button className="btn-close text-white" onClick={onClose}>×</button>
        </div>

        <div className="settings-section mb-4">
          <h5 className="mb-3">Theme Settings</h5>
          <div className="theme-options">
            <div className="row">
              <div className="col-4">
                <div 
                  className={`theme-card ${settings.theme === 'black' ? 'selected' : ''}`}
                  onClick={() => handleThemeChange('black')}
                >
                  <div className="theme-preview black-theme"></div>
                  <span>Black</span>
                </div>
              </div>
              <div className="col-4">
                <div 
                  className={`theme-card ${settings.theme === 'white' ? 'selected' : ''}`}
                  onClick={() => handleThemeChange('white')}
                >
                  <div className="theme-preview white-theme"></div>
                  <span>White</span>
                </div>
              </div>
              <div className="col-4">
                <div 
                  className={`theme-card ${settings.theme === 'grey' ? 'selected' : ''}`}
                  onClick={() => handleThemeChange('grey')}
                >
                  <div className="theme-preview grey-theme"></div>
                  <span>Grey</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section mb-4">
          <h5 className="mb-3">General Settings</h5>
          
          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
            />
            <label className="form-check-label text-white">
              Enable notifications
            </label>
          </div>

          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              checked={settings.autoExport}
              onChange={(e) => setSettings({...settings, autoExport: e.target.checked})}
            />
            <label className="form-check-label text-white">
              Auto-export results
            </label>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-primary" onClick={handleSave}>
            Save Settings
          </button>
          <button className="btn btn-outline-primary" onClick={onClose}>
            Cancel
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
          width: 90%;
          max-width: 600px;
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
        
        .theme-card {
          text-align: center;
          padding: 15px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
          background: rgba(255, 255, 255, 0.05);
        }
        
        .theme-card:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }
        
        .theme-card.selected {
          border-color: #007bff;
          background: rgba(0, 123, 255, 0.2);
        }
        
        .theme-preview {
          width: 50px;
          height: 30px;
          border-radius: 6px;
          margin: 0 auto 8px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .black-theme {
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%);
        }
        
        .white-theme {
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #ffffff 100%);
        }
        
        .grey-theme {
          background: linear-gradient(135deg, #6c757d 0%, #495057 50%, #6c757d 100%);
        }
        
        .btn-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
        }
        
        .form-check-input:checked {
          background-color: #007bff;
          border-color: #007bff;
        }
        
        .settings-section {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 20px;
        }
        
        .settings-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
      `}</style>
    </div>
  );
};

export default Settings;