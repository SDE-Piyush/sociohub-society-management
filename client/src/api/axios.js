import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle 401 unauthenticated globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If we get 401 and we are not already on the login page, we can let AuthContext handle state
      console.warn('Session expired or unauthorized.');
    }
    return Promise.reject(error);
  }
);

export default api;
