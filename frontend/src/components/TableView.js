import React, { useState, useMemo, useEffect } from 'react';
import { convertToTableData, flattenJsonArray, exportData } from '../utils/exportUtils';

const TableView = ({ data, title = "Data Table", onSelectionChange, hideExportOptions = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Process data for table display
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return { headers: [], rows: [] };
    
    // Flatten nested objects for better table display
    const flattened = flattenJsonArray(data);
    return convertToTableData(flattened);
  }, [data]);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return processedData;
    
    const filtered = processedData.rows.filter(row =>
      row.some(cell => 
        String(cell).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    
    return { ...processedData, rows: filtered };
  }, [processedData, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    
    const columnIndex = filteredData.headers.indexOf(sortColumn);
    const sorted = [...filteredData.rows].sort((a, b) => {
      const aVal = a[columnIndex] || '';
      const bVal = b[columnIndex] || '';
      
      // Try to parse as numbers first
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // String comparison
      const result = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? result : -result;
    });
    
    return { ...filteredData, rows: sorted };
  }, [filteredData, sortColumn, sortDirection]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      ...sortedData,
      rows: sortedData.rows.slice(startIndex, endIndex)
    };
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.rows.length / itemsPerPage);

  // Notify parent about selection changes
  useEffect(() => {
    if (onSelectionChange) {
      // Convert local indices to global indices
      const globalSelectedRows = new Set();
      selectedRows.forEach(localIndex => {
        const globalIndex = (currentPage - 1) * itemsPerPage + localIndex;
        if (globalIndex < sortedData.rows.length) {
          globalSelectedRows.add(globalIndex);
        }
      });
      onSelectionChange(globalSelectedRows, sortedData.rows.length);
    }
  }, [selectedRows, currentPage, itemsPerPage, sortedData.rows.length, onSelectionChange]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleSelectRow = (rowIndex) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex);
    } else {
      newSelected.add(rowIndex);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.rows.map((_, index) => index)));
    }
  };

  const getSelectedData = () => {
    return Array.from(selectedRows).map(index => {
      const row = paginatedData.rows[index];
      const obj = {};
      paginatedData.headers.forEach((header, headerIndex) => {
        obj[header] = row[headerIndex];
      });
      return obj;
    });
  };

  const exportSelected = (format) => {
    const selectedData = getSelectedData();
    if (selectedData.length === 0) {
      alert('Please select rows to export');
      return;
    }
    exportData({ products: selectedData }, format, `selected_${title.replace(/\s+/g, '_').toLowerCase()}`);
  };

  const exportAll = (format) => {
    const allData = sortedData.rows.map(row => {
      const obj = {};
      sortedData.headers.forEach((header, headerIndex) => {
        obj[header] = row[headerIndex];
      });
      return obj;
    });
    exportData({ products: allData }, format, title.replace(/\s+/g, '_').toLowerCase());
  };

  if (!data || data.length === 0) {
    return (
      <div className="glass-card p-4 text-center">
        <p className="text-muted">No data available for table view</p>
      </div>
    );
  }

  return (
    <div className="table-view-container">
      {/* Controls */}
      <div className="glass-card p-3 mb-3">
        <div className="row align-items-center">
          <div className="col-md-4">
            <div className="d-flex align-items-center gap-2">
              <label className="text-muted small">Show:</label>
              <select 
                className="form-control form-control-sm" 
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{ width: 'auto' }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-muted small">entries</span>
            </div>
          </div>
          
          <div className="col-md-4 text-center">
            <span className="text-muted small">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, sortedData.rows.length)} to {Math.min(currentPage * itemsPerPage, sortedData.rows.length)} of {sortedData.rows.length} entries
            </span>
          </div>
          
          <div className="col-md-4">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search in table..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Export Options */}
      {!hideExportOptions && (
        <div className="glass-card p-3 mb-3">
          <div className="row">
            <div className="col-md-6">
              <h6 className="text-white mb-2">Export All Data ({sortedData.rows.length} rows)</h6>
              <div className="btn-group" role="group">
                <button className="btn btn-sm btn-outline-primary" onClick={() => exportAll('csv')}>
                  📊 CSV
                </button>
                <button className="btn btn-sm btn-outline-success" onClick={() => exportAll('excel')}>
                  📈 Excel
                </button>
                <button className="btn btn-sm btn-outline-warning" onClick={() => exportAll('xml')}>
                  📄 XML
                </button>
                <button className="btn btn-sm btn-outline-info" onClick={() => exportAll('json')}>
                  🔧 JSON
                </button>
              </div>
            </div>
            
            <div className="col-md-6">
              <h6 className="text-white mb-2">Export Selected ({selectedRows.size} rows)</h6>
              <div className="btn-group" role="group">
                <button 
                  className="btn btn-sm btn-outline-primary" 
                  onClick={() => exportSelected('csv')}
                  disabled={selectedRows.size === 0}
                >
                  📊 CSV
                </button>
                <button 
                  className="btn btn-sm btn-outline-success" 
                  onClick={() => exportSelected('excel')}
                  disabled={selectedRows.size === 0}
                >
                  📈 Excel
                </button>
                <button 
                  className="btn btn-sm btn-outline-warning" 
                  onClick={() => exportSelected('xml')}
                  disabled={selectedRows.size === 0}
                >
                  📄 XML
                </button>
                <button 
                  className="btn btn-sm btn-outline-info" 
                  onClick={() => exportSelected('json')}
                  disabled={selectedRows.size === 0}
                >
                  🔧 JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card p-0">
        <div className="table-responsive">
          <table className="table table-dark table-hover mb-0">
            <thead className="table-header">
              <tr>
                <th style={{ width: '40px', padding: '12px 8px' }}>
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.rows.length && paginatedData.rows.length > 0}
                    onChange={handleSelectAll}
                    className="form-check-input"
                  />
                </th>
                {paginatedData.headers.map((header, index) => (
                  <th 
                    key={index} 
                    className="sortable-header"
                    onClick={() => handleSort(header)}
                    style={{ cursor: 'pointer', padding: '12px 8px' }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <span>{header}</span>
                      <span className="sort-indicator">
                        {sortColumn === header ? (
                          sortDirection === 'asc' ? '↑' : '↓'
                        ) : '↕'}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className={selectedRows.has(rowIndex) ? 'table-active' : ''}>
                  <td style={{ padding: '8px' }}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(rowIndex)}
                      onChange={() => handleSelectRow(rowIndex)}
                      className="form-check-input"
                    />
                  </td>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} style={{ 
                      padding: '8px',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }} title={cell}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="table-pagination p-3 border-top">
            <nav>
              <ul className="pagination pagination-sm justify-content-center mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </button>
                </li>
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const startPage = Math.max(1, currentPage - 2);
                  const pageNum = startPage + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                      <button 
                        className="page-link"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    </li>
                  );
                })}
                
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      <style jsx>{`
        .table-header {
          background: rgba(0, 123, 255, 0.2);
          border-bottom: 2px solid rgba(0, 123, 255, 0.5);
        }
        
        .sortable-header:hover {
          background: var(--dropdown-item-hover);
        }
        
        .table-active {
          background: rgba(0, 123, 255, 0.2) !important;
        }
        
        .sort-indicator {
          opacity: 0.6;
          font-size: 0.8rem;
          color: var(--text-color);
        }
        
        .table-pagination {
          background: var(--card-bg);
          border-top: 1px solid var(--card-border) !important;
        }
        
        .page-link {
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          color: var(--text-color);
        }
        
        .page-link:hover {
          background: rgba(0, 123, 255, 0.3);
          border-color: rgba(0, 123, 255, 0.5);
          color: var(--text-color);
        }
        
        .page-item.active .page-link {
          background: rgba(0, 123, 255, 0.6);
          border-color: rgba(0, 123, 255, 0.8);
          color: #ffffff;
        }
        
        .btn-group .btn {
          margin-right: 5px;
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .chart-container {
          color: var(--text-color);
        }
        
        h6, .text-center, .text-muted {
          color: var(--text-color) !important;
        }
        
        small.text-muted {
          color: var(--text-muted) !important;
        }
      `}</style>
    </div>
  );
};

export default TableView;