import axios from 'axios';

// Absolute base URL routing through port 3000 custom endpoints
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Dedicated client for SEC EDGAR endpoints which can take 30-90s to fetch XBRL data
export const edgarApiClient = axios.create({
  baseURL: '/api',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default apiClient;
