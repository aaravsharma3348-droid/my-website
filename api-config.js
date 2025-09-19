// API Configuration
const API_CONFIG = {
  // Development environment
  development: {
    baseURL: 'http://localhost:3001',
    timeout: 10000
  },
  
  // Production environment
  production: {
    baseURL: 'https://debtmanage.space', // Replace with your production URL
    timeout: 15000
  },
  
  // Local network (for testing on mobile devices)
  local: {
    baseURL: 'http://192.168.1.100:3001', // Replace with your local IP
    timeout: 10000
  }
};

// Auto-detect environment
const getEnvironment = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'development';
  } else if (window.location.hostname.includes('192.168') || window.location.hostname.includes('10.0')) {
    return 'local';
  } else {
    return 'production';
  }
};

// Get current API configuration
const getCurrentConfig = () => {
  const env = getEnvironment();
  return API_CONFIG[env];
};

// API utility functions
const API = {
  baseURL: getCurrentConfig().baseURL,
  timeout: getCurrentConfig().timeout,
  
  // Generic request function
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  },
  
  // Convenience methods
  get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  },
  
  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  },
  
  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  },
  
  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }
};

// Export for use in other files
window.API = API;
window.API_CONFIG = API_CONFIG;
