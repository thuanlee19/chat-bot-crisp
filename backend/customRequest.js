const axios = require('axios');

const EXTERNAL_BACKEND_URL = process.env.EXTERNAL_BACKEND_URL;

function createClient(baseURL = EXTERNAL_BACKEND_URL) {
  async function request(method, endpoint, data = null, headers = {}) {
    try {
      const response = await axios({
        method,
        url: `${baseURL}${endpoint}`,
        data,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: 30000
      });

      console.log(`✅ ${method} ${endpoint}: ${response.status}`);
      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      console.error(`❌ ${method} ${endpoint} failed:`, error.message);
      
      return {
        success: false,
        status: error.response?.status,
        data: error.response?.data,
        error: error.message
      };
    }
  }

  async function get(endpoint, params = {}, headers = {}) {
    try {
      const response = await axios({
        method: 'GET',
        url: `${baseURL}${endpoint}`,
        params,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: 10000
      });

      console.log(`✅ GET ${endpoint}: ${response.status}`);
      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      console.error(`❌ GET ${endpoint} failed:`, error.message);
      
      return {
        success: false,
        status: error.response?.status,
        data: error.response?.data,
        error: error.message
      };
    }
  }

  async function post(endpoint, data, headers = {}) {
    return request('POST', endpoint, data, headers);
  }

  async function put(endpoint, data, headers = {}) {
    return request('PUT', endpoint, data, headers);
  }

  async function del(endpoint, headers = {}) {
    return request('DELETE', endpoint, null, headers);
  }

  return { get, post, put, del, request };
}

// Default client for external backend
const externalClient = createClient(EXTERNAL_BACKEND_URL);

module.exports = {
  createClient,
  // Default exports for external backend
  get: externalClient.get,
  post: externalClient.post,
  put: externalClient.put,
  del: externalClient.del,
  request: externalClient.request
};

