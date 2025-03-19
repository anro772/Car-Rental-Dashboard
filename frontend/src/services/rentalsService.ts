// src/services/rentalsService.ts
import axios from 'axios';
import { Car } from './carsService';
import { Customer } from './customersService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Rental interface to match backend schema
export interface Rental {
    id: number;
    car_id: number;
    customer_id: number;
    start_date: string;
    end_date: string;
    status: 'pending' | 'active' | 'completed' | 'cancelled';
    total_cost: number;
    payment_status: 'unpaid' | 'partial' | 'paid';
    notes?: string;
    created_at?: string;
}

// Extended rental interface with related car and customer data
export interface RentalExtended extends Rental {
    brand?: string;
    model?: string;
    license_plate?: string;
    image_url?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    days_overdue?: number;
}

// Type for creating a new rental
export type NewRental = Omit<Rental, 'id' | 'created_at' | 'status' | 'payment_status'> & {
    status?: 'pending' | 'active' | 'completed' | 'cancelled';
    payment_status?: 'unpaid' | 'partial' | 'paid';
};

// Type for updating a rental
export type UpdateRental = Partial<Omit<Rental, 'id' | 'created_at' | 'car_id' | 'customer_id'>>;

const rentalsService = {
    // Get all rentals
    getAllRentals: async (): Promise<RentalExtended[]> => {
        try {
            const response = await axios.get(`${API_URL}/rentals`);
            console.log('Rentals data:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching rentals:', error);
            throw error;
        }
    },

    // Get a single rental by ID
    getRental: async (id: number): Promise<RentalExtended> => {
        try {
            const response = await axios.get(`${API_URL}/rentals/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching rental with ID ${id}:`, error);
            throw error;
        }
    },

    // Get rentals by status
    getRentalsByStatus: async (status: Rental['status']): Promise<RentalExtended[]> => {
        try {
            const response = await axios.get(`${API_URL}/rentals/status/${status}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching rentals with status ${status}:`, error);
            throw error;
        }
    },

    // Get rentals for a specific customer
    getRentalsForCustomer: async (customerId: number): Promise<RentalExtended[]> => {
        try {
            const response = await axios.get(`${API_URL}/rentals/customer/${customerId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching rentals for customer ${customerId}:`, error);
            throw error;
        }
    },

    // Get rentals for a specific car
    getRentalsForCar: async (carId: number): Promise<RentalExtended[]> => {
        try {
            const response = await axios.get(`${API_URL}/rentals/car/${carId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching rentals for car ${carId}:`, error);
            throw error;
        }
    },

    // Get current active rentals
    getCurrentRentals: async (): Promise<RentalExtended[]> => {
        try {
            const response = await axios.get(`${API_URL}/rentals/current/active`);
            return response.data;
        } catch (error) {
            console.error('Error fetching current rentals:', error);
            throw error;
        }
    },

    // Get upcoming rentals (next 7 days)
    getUpcomingRentals: async (): Promise<RentalExtended[]> => {
        try {
            const response = await axios.get(`${API_URL}/rentals/upcoming/week`);
            return response.data;
        } catch (error) {
            console.error('Error fetching upcoming rentals:', error);
            throw error;
        }
    },

    // Get overdue rentals
    getOverdueRentals: async (): Promise<RentalExtended[]> => {
        try {
            const response = await axios.get(`${API_URL}/rentals/overdue`);
            return response.data;
        } catch (error: any) {
            // Special handling for 404 - means no overdue rentals
            if (error.response && error.response.status === 404) {
                console.log('No overdue rentals found (404 is expected here)');
                return []; // Return empty array instead of throwing
            }
            console.error('Error fetching overdue rentals:', error);
            throw error;
        }
    },

    // Create a new rental
    createRental: async (rentalData: NewRental): Promise<RentalExtended> => {
        try {
            const response = await axios.post(`${API_URL}/rentals`, rentalData);
            return response.data;
        } catch (error) {
            console.error('Error creating rental:', error);
            throw error;
        }
    },

    // Update rental status
    updateRentalStatus: async (id: number, status: Rental['status']): Promise<RentalExtended> => {
        try {
            const response = await axios.put(`${API_URL}/rentals/${id}/status`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error updating rental ${id} status to ${status}:`, error);
            throw error;
        }
    },

    // Update payment status
    updatePaymentStatus: async (id: number, paymentStatus: Rental['payment_status']): Promise<RentalExtended> => {
        try {
            const response = await axios.put(`${API_URL}/rentals/${id}/payment`, { payment_status: paymentStatus });
            return response.data;
        } catch (error) {
            console.error(`Error updating rental ${id} payment status to ${paymentStatus}:`, error);
            throw error;
        }
    },

    // Update rental details
    updateRental: async (id: number, rentalData: UpdateRental): Promise<RentalExtended> => {
        try {
            const response = await axios.put(`${API_URL}/rentals/${id}`, rentalData);
            return response.data;
        } catch (error) {
            console.error(`Error updating rental with ID ${id}:`, error);
            throw error;
        }
    },

    // Delete a rental
    deleteRental: async (id: number): Promise<void> => {
        try {
            await axios.delete(`${API_URL}/rentals/${id}`);
        } catch (error) {
            console.error(`Error deleting rental with ID ${id}:`, error);
            throw error;
        }
    },

    // Calculate rental duration in days
    calculateDuration: (startDate: string, endDate: string): number => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    // Calculate rental cost based on car daily rate and duration
    calculateRentalCost: (dailyRate: number, startDate: string, endDate: string): number => {
        const duration = rentalsService.calculateDuration(startDate, endDate);
        return parseFloat((dailyRate * duration).toFixed(2));
    }
};

export default rentalsService;