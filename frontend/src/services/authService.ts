// src/services/authService.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Admin {
    id: number;
    email: string;
    name: string;
    role: string;
}

export interface LoginResponse {
    token: string;
    admin: Admin;
}

const authService = {
    // Login
    login: async (email: string, password: string): Promise<LoginResponse> => {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email,
                password
            });

            // Store token in local storage
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('admin', JSON.stringify(response.data.admin));

            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Logout
    logout: (): void => {
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
    },

    // Get current admin
    getCurrentAdmin: (): Admin | null => {
        const adminStr = localStorage.getItem('admin');
        return adminStr ? JSON.parse(adminStr) : null;
    },

    // Check if user is logged in
    isLoggedIn: (): boolean => {
        return !!localStorage.getItem('token');
    },

    // Get auth token
    getToken: (): string | null => {
        return localStorage.getItem('token');
    },

    // Setup axios interceptor for auth headers
    setupAxiosInterceptors: (): void => {
        axios.interceptors.request.use(
            (config) => {
                const token = authService.getToken();
                if (token) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );
    }
};

export default authService;