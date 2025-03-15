// src/services/api.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - useful for adding auth tokens
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - useful for handling errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle different error status codes
        if (error.response) {
            const { status } = error.response;

            if (status === 401) {
                // Handle unauthorized access
                localStorage.removeItem('token');
                // Redirect to login or show message
            }

            if (status === 500) {
                // Handle server errors
                console.error('Server error occurred');
            }
        }

        return Promise.reject(error);
    }
);

export default api;