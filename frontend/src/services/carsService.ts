// src/services/carsService.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Car interface to match backend schema
export interface Car {
    id: number;
    brand: string;
    model: string;
    year: number;
    license_plate: string;
    color?: string;
    category?: string;
    daily_rate: number;
    status?: 'available' | 'rented' | 'maintenance';
    image_url?: string;
    features?: string;
    created_at?: string;
}

// Type for creating a new car
export type NewCar = Omit<Car, 'id' | 'created_at'>;

// Type for updating a car
export type UpdateCar = Partial<NewCar>;

const carsService = {
    // Get all cars
    getAllCars: async (): Promise<Car[]> => {
        try {
            const response = await axios.get(`${API_URL}/cars`);
            console.log('Cars data:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching cars:', error);
            throw error;
        }
    },

    // Get a single car by ID
    getCar: async (id: number): Promise<Car> => {
        try {
            const response = await axios.get(`${API_URL}/cars/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching car with ID ${id}:`, error);
            throw error;
        }
    },

    // Get available cars
    getAvailableCars: async (): Promise<Car[]> => {
        try {
            const response = await axios.get(`${API_URL}/cars/status/available`);
            return response.data;
        } catch (error) {
            console.error('Error fetching available cars:', error);
            throw error;
        }
    },

    // Get cars by category
    getCarsByCategory: async (category: string): Promise<Car[]> => {
        try {
            const response = await axios.get(`${API_URL}/cars/category/${category}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching cars in category ${category}:`, error);
            throw error;
        }
    },

    // Create a new car
    createCar: async (car: NewCar): Promise<{ id: number; message: string }> => {
        try {
            const response = await axios.post(`${API_URL}/cars`, car);
            return response.data;
        } catch (error) {
            console.error('Error creating car:', error);
            throw error;
        }
    },

    // Full update of a car (all fields required)
    updateCar: async (id: number, car: NewCar): Promise<{ message: string; affected: number }> => {
        try {
            const response = await axios.put(`${API_URL}/cars/${id}`, car);
            return response.data;
        } catch (error) {
            console.error(`Error updating car with ID ${id}:`, error);
            throw error;
        }
    },

    // Partial update of a car (only specified fields)
    patchCar: async (id: number, updates: UpdateCar): Promise<{ message: string; affected: number }> => {
        try {
            const response = await axios.patch(`${API_URL}/cars/${id}`, updates);
            return response.data;
        } catch (error) {
            console.error(`Error patching car with ID ${id}:`, error);
            throw error;
        }
    },

    // Delete a car
    deleteCar: async (id: number): Promise<{ message: string; affected: number }> => {
        try {
            const response = await axios.delete(`${API_URL}/cars/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting car with ID ${id}:`, error);
            throw error;
        }
    }
};

export default carsService;