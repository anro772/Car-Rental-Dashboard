// src/services/rentalsService.ts
import axios from 'axios';
// import { Car } from './carsService';
// import { Customer } from './customersService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Rental {
    id: number;
    car_id: number;
    customer_id: number;
    start_date: string; // Keep as string (YYYY-MM-DD)
    end_date: string;   // Keep as string (YYYY-MM-DD)
    status: 'pending' | 'active' | 'completed' | 'cancelled';
    total_cost: number;
    payment_status: 'unpaid' | 'partial' | 'paid';
    notes?: string;
    created_at?: string;
}

export interface RentalExtended extends Rental {
    brand?: string;
    model?: string;
    license_plate?: string;
    image_url?: string;     // Car image URL
    color?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    days_overdue?: number;
    customer_avatar_url?: string | null;
}


export type NewRental = Omit<Rental, 'id' | 'created_at'>;
// If status/payment are optional on creation, use Partial or adjust backend
// export type NewRental = Omit<Rental, 'id' | 'created_at' | 'status' | 'payment_status'> & {
//     status?: 'pending' | 'active' | 'completed' | 'cancelled';
//     payment_status?: 'unpaid' | 'partial' | 'paid';
// };


export type UpdateRental = Partial<Omit<Rental, 'id' | 'created_at' | 'car_id' | 'customer_id'>>;

const rentalsService = {
    // Get all rentals
    getAllRentals: async (): Promise<RentalExtended[]> => {
        try {
            const response = await axios.get(`${API_URL}/rentals`);
            // console.log('Rentals data:', response.data); // Optional logging
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
            if (error.response && error.response.status === 404) {
                console.log('No overdue rentals found.');
                return [];
            }
            console.error('Error fetching overdue rentals:', error);
            throw error;
        }
    },

    // Create a new rental
    createRental: async (rentalData: NewRental): Promise<RentalExtended> => {
        try {
            // Ensure total_cost is a number before sending
            const dataToSend = {
                ...rentalData,
                total_cost: Number(rentalData.total_cost) || 0,
            };
            const response = await axios.post(`${API_URL}/rentals`, dataToSend);
            return response.data; // Assuming backend returns the created rental (potentially extended)
        } catch (error) {
            console.error('Error creating rental:', error);
            throw error; // Re-throw to be handled by the caller
        }
    },

    // Update rental status
    updateRentalStatus: async (id: number, status: Rental['status']): Promise<RentalExtended> => {
        try {
            // Backend might return the updated rental or just a success message.
            // Assuming it returns the updated rental (potentially extended)
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

    // Update rental details (e.g., dates, notes, total_cost)
    updateRental: async (id: number, rentalData: UpdateRental): Promise<RentalExtended> => {
        try {
            // Ensure total_cost is a number if present
            const dataToSend = { ...rentalData };
            if (dataToSend.total_cost !== undefined) {
                dataToSend.total_cost = Number(dataToSend.total_cost) || 0;
            }
            const response = await axios.put(`${API_URL}/rentals/${id}`, dataToSend);
            return response.data;
        } catch (error) {
            console.error(`Error updating rental with ID ${id}:`, error);
            throw error;
        }
    },

    // Delete a rental
    deleteRental: async (id: number): Promise<{ message: string }> => { // Return type can vary based on backend
        try {
            const response = await axios.delete(`${API_URL}/rentals/${id}`);
            return response.data || { message: 'Rental deleted successfully' }; // Return backend message or default
        } catch (error) {
            console.error(`Error deleting rental with ID ${id}:`, error);
            throw error;
        }
    },

    // --- Client-side Helper Functions (Optional) ---

    // Calculate rental duration in days (inclusive)
    calculateDuration: (startDate: string, endDate: string): number => {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
            // Difference in time
            const diffTime = end.getTime() - start.getTime();
            // Difference in days + 1 for inclusive count
            const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            return duration > 0 ? duration : 0;
        } catch {
            return 0; // Handle potential date parsing errors
        }
    },

    // Calculate rental cost based on car daily rate and duration
    calculateRentalCost: (dailyRate: number, startDate: string, endDate: string): number => {
        const duration = rentalsService.calculateDuration(startDate, endDate);
        if (duration <= 0 || !dailyRate || dailyRate <= 0) return 0;
        return parseFloat((dailyRate * duration).toFixed(2));
    }
};

export default rentalsService;