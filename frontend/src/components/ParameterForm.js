import React from 'react';

const ParameterForm = ({ config, parameters, onChange, onSubmit, loading }) => {
  if (!config) return null;

  const handleInputChange = (paramName, value) => {
    onChange(paramName, value);
  };

  const isFormValid = () => {
    return config.parameters.every(param => {
      if (param.required) {
        return parameters[param.name] && parameters[param.name].toString().trim() !== '';
      }
      return true;
    });
  };

  return (
    <form onSubmit={onSubmit}>
      {config.parameters.map((param) => (
        <div key={param.name} className="mb-3">
          <label htmlFor={param.name} className="form-label">
            {param.label}
            {param.required && <span className="text-danger">*</span>}
          </label>
          
          {param.type === 'text' && (
            <input
              type="text"
              className="form-control"
              id={param.name}
              name={param.name}
              placeholder={param.placeholder}
              value={parameters[param.name] || ''}
              onChange={(e) => handleInputChange(param.name, e.target.value)}
              required={param.required}
            />
          )}
          
          {param.type === 'number' && (
            <input
              type="number"
              className="form-control"
              id={param.name}
              name={param.name}
              placeholder={param.placeholder}
              min={param.min}
              max={param.max}
              value={parameters[param.name] || param.default || ''}
              onChange={(e) => handleInputChange(param.name, parseInt(e.target.value) || param.default)}
              required={param.required}
            />
          )}
          
          {param.type === 'select' && (
            <select
              className="form-select"
              id={param.name}
              name={param.name}
              value={parameters[param.name] || param.default || ''}
              onChange={(e) => handleInputChange(param.name, e.target.value)}
              required={param.required}
            >
              <option value="">Select {param.label}</option>
              {param.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          
          {param.description && (
            <div className="form-text">{param.description}</div>
          )}
        </div>
      ))}

      <div className="d-grid">
        <button 
          type="submit" 
          className="btn btn-primary btn-lg"
          disabled={loading || !isFormValid()}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Scraping...
            </>
          ) : (
            <>
              <i className="fas fa-play me-2"></i>
              Start Scraping
            </>
          )}
        </button>
      </div>

      <div className="mt-3">
        <small className="text-muted">
          <i className="fas fa-info-circle me-1"></i>
          Scraping may take several minutes depending on the number of pages requested.
        </small>
      </div>
    </form>
  );
};

export default ParameterForm;