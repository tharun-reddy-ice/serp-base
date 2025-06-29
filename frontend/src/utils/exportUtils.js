// Export utilities for different formats

// Convert JSON to CSV
export const jsonToCsv = (jsonData) => {
  if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
    return '';
  }

  // Get all unique keys from all objects
  const allKeys = new Set();
  jsonData.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });

  const headers = Array.from(allKeys);
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...jsonData.map(item => 
      headers.map(header => {
        const value = item[header];
        // Handle different data types
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        // Escape commas and quotes in strings
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
};

// Convert JSON to XML
export const jsonToXml = (jsonData, rootElement = 'data') => {
  const escapeXml = (str) => {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const jsonToXmlRecursive = (obj, elementName = 'item') => {
    if (Array.isArray(obj)) {
      return obj.map((item, index) => 
        jsonToXmlRecursive(item, `${elementName}_${index}`)
      ).join('\n');
    }

    if (obj === null || obj === undefined) {
      return `<${elementName}></${elementName}>`;
    }

    if (typeof obj === 'object') {
      const xmlContent = Object.entries(obj)
        .map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return `<${key}>\n${jsonToXmlRecursive(value, 'item')}\n</${key}>`;
          }
          return `<${key}>${escapeXml(value)}</${key}>`;
        })
        .join('\n');
      
      return `<${elementName}>\n${xmlContent}\n</${elementName}>`;
    }

    return `<${elementName}>${escapeXml(obj)}</${elementName}>`;
  };

  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
  const xmlContent = Array.isArray(jsonData) 
    ? jsonData.map((item, index) => jsonToXmlRecursive(item, 'record')).join('\n')
    : jsonToXmlRecursive(jsonData, 'record');

  return `${xmlHeader}<${rootElement}>\n${xmlContent}\n</${rootElement}>`;
};

// Convert JSON to Excel-compatible format (TSV)
export const jsonToExcel = (jsonData) => {
  if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
    return '';
  }

  // Get all unique keys
  const allKeys = new Set();
  jsonData.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });

  const headers = Array.from(allKeys);
  
  // Create TSV content (Tab-separated values for Excel)
  const tsvContent = [
    headers.join('\t'), // Header row
    ...jsonData.map(item => 
      headers.map(header => {
        const value = item[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value).replace(/\t/g, ' ').replace(/\n/g, ' ');
      }).join('\t')
    )
  ].join('\n');

  return tsvContent;
};

// Download file helper
export const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export functions for different formats
export const exportData = (data, format, filename) => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const baseFilename = filename || `burp_ai_export_${timestamp}`;

  switch (format.toLowerCase()) {
    case 'csv':
      const csvContent = jsonToCsv(data.products || data);
      downloadFile(csvContent, `${baseFilename}.csv`, 'text/csv');
      break;

    case 'excel':
    case 'xlsx':
      const excelContent = jsonToExcel(data.products || data);
      downloadFile(excelContent, `${baseFilename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      break;

    case 'xml':
      const xmlContent = jsonToXml(data.products || data, 'scraped_data');
      downloadFile(xmlContent, `${baseFilename}.xml`, 'application/xml');
      break;

    case 'json':
    default:
      const jsonContent = JSON.stringify(data, null, 2);
      downloadFile(jsonContent, `${baseFilename}.json`, 'application/json');
      break;
  }
};

// Table conversion utilities
export const convertToTableData = (jsonData) => {
  if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
    return { headers: [], rows: [] };
  }

  // Get all unique keys for headers
  const allKeys = new Set();
  jsonData.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });

  const headers = Array.from(allKeys);
  
  // Convert data to rows
  const rows = jsonData.map(item => 
    headers.map(header => {
      const value = item[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    })
  );

  return { headers, rows };
};

// Flatten nested JSON for better table display
export const flattenObject = (obj, prefix = '') => {
  const flattened = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (obj[key] === null || obj[key] === undefined) {
        flattened[newKey] = '';
      } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key], newKey));
      } else if (Array.isArray(obj[key])) {
        flattened[newKey] = obj[key].join('; ');
      } else {
        flattened[newKey] = obj[key];
      }
    }
  }
  
  return flattened;
};

export const flattenJsonArray = (jsonArray) => {
  return jsonArray.map(item => flattenObject(item));
};