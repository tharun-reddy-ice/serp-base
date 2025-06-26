import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple validation - in production, you'd validate against a backend
    if (credentials.username && credentials.password) {
      // Store user data
      localStorage.setItem('user', JSON.stringify({
        username: credentials.username,
        name: credentials.username,
        isLoggedIn: true
      }));
      onLogin(credentials.username);
    } else {
      alert('Please enter both username and password');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-card">
        <div className="text-center mb-4">
          <h1 className="brand-logo mb-2">
            <span style={{
              background: 'linear-gradient(45deg, #007bff, #00d4ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
              fontSize: '3rem'
            }}>
              burp.ai
            </span>
          </h1>
          <p className="text-muted">AI-Powered Data Extraction Platform</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter your username"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100 mb-3">
            {isSignUp ? 'Sign Up' : 'Login'}
          </button>

          <div className="text-center">
            <button
              type="button"
              className="btn-link text-primary"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
            </button>
          </div>

          <div className="demo-credentials mt-4 p-3" style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <small className="text-muted">
              <strong>Demo Login:</strong><br />
              Username: tharun<br />
              Password: demo123
            </small>
          </div>
        </form>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%);
          padding: 20px;
        }
        
        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 40px;
          animation: loginSlideIn 0.6s ease-out;
        }
        
        @keyframes loginSlideIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .btn-link {
          background: none;
          border: none;
          text-decoration: underline;
          cursor: pointer;
        }
        
        .btn-link:hover {
          text-decoration: none;
        }
      `}</style>
    </div>
  );
};

export default Login;