import axios from 'axios';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: 'http://localhost:8000', // Update this based on the backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
