// src/services/customersService.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Customer interface to match backend schema
export interface Customer {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
    driver_license?: string;
    license_image_url?: string;
    license_verified?: boolean;
    status?: 'active' | 'inactive';
    created_at?: string;
}

// For displaying customer name in lists/dropdowns
export interface CustomerDisplay extends Customer {
    full_name: string; // Computed property for first_name + " " + last_name
}

// Type for creating a new customer
export type NewCustomer = Omit<Customer, 'id' | 'created_at'>;

// Type for updating a customer
export type UpdateCustomer = Partial<NewCustomer>;

const customersService = {
    // Get all customers
    getAllCustomers: async (): Promise<Customer[]> => {
        try {
            const response = await axios.get(`${API_URL}/customers`);
            console.log('Customers data:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching customers:', error);
            throw error;
        }
    },

    // Get customers with full name for dropdown selections
    getCustomersForDisplay: async (): Promise<CustomerDisplay[]> => {
        try {
            const response = await axios.get(`${API_URL}/customers`);
            return response.data.map((customer: Customer) => ({
                ...customer,
                full_name: `${customer.first_name} ${customer.last_name}`
            }));
        } catch (error) {
            console.error('Error fetching customers for display:', error);
            throw error;
        }
    },

    // Get a single customer by ID
    getCustomer: async (id: number): Promise<Customer> => {
        try {
            const response = await axios.get(`${API_URL}/customers/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching customer with ID ${id}:`, error);
            throw error;
        }
    },

    // Get active customers
    getActiveCustomers: async (): Promise<Customer[]> => {
        try {
            const response = await axios.get(`${API_URL}/customers/status/active`);
            return response.data;
        } catch (error) {
            console.error('Error fetching active customers:', error);
            throw error;
        }
    },

    // Get inactive customers
    getInactiveCustomers: async (): Promise<Customer[]> => {
        try {
            const response = await axios.get(`${API_URL}/customers/status/inactive`);
            return response.data;
        } catch (error) {
            console.error('Error fetching inactive customers:', error);
            throw error;
        }
    },

    // Get customers with verified licenses
    getCustomersWithVerifiedLicenses: async (): Promise<Customer[]> => {
        try {
            const response = await axios.get(`${API_URL}/customers/license/verified`);
            return response.data;
        } catch (error) {
            console.error('Error fetching customers with verified licenses:', error);
            throw error;
        }
    },

    // Get customers with unverified licenses
    getCustomersWithUnverifiedLicenses: async (): Promise<Customer[]> => {
        try {
            const response = await axios.get(`${API_URL}/customers/license/unverified`);
            return response.data;
        } catch (error) {
            console.error('Error fetching customers with unverified licenses:', error);
            throw error;
        }
    },

    // Get customers with current rentals
    getCustomersWithRentals: async (): Promise<Customer[]> => {
        try {
            const response = await axios.get(`${API_URL}/customers/with-rentals/current`);
            return response.data;
        } catch (error) {
            console.error('Error fetching customers with rentals:', error);
            throw error;
        }
    },

    // Create a new customer
    createCustomer: async (customerData: NewCustomer): Promise<Customer> => {
        try {
            const response = await axios.post(`${API_URL}/customers`, customerData);
            return response.data;
        } catch (error) {
            console.error('Error creating customer:', error);
            throw error;
        }
    },

    // Update an existing customer
    updateCustomer: async (id: number, customerData: UpdateCustomer): Promise<Customer> => {
        try {
            const response = await axios.put(`${API_URL}/customers/${id}`, customerData);
            return response.data;
        } catch (error) {
            console.error(`Error updating customer with ID ${id}:`, error);
            throw error;
        }
    },

    // Update license verification status
    updateLicenseVerification: async (id: number, verified: boolean): Promise<Customer> => {
        try {
            const response = await axios.patch(`${API_URL}/customers/${id}/verify-license`, {
                license_verified: verified
            });
            return response.data;
        } catch (error) {
            console.error(`Error updating license verification for customer with ID ${id}:`, error);
            throw error;
        }
    },

    // Delete a customer
    deleteCustomer: async (id: number): Promise<void> => {
        try {
            await axios.delete(`${API_URL}/customers/${id}`);
        } catch (error) {
            console.error(`Error deleting customer with ID ${id}:`, error);
            throw error;
        }
    },

    // Search customers by name or email
    searchCustomers: async (query: string): Promise<Customer[]> => {
        try {
            const response = await axios.get(`${API_URL}/customers/search/${query}`);
            return response.data;
        } catch (error) {
            console.error(`Error searching customers with query "${query}":`, error);
            throw error;
        }
    },

    // Helper to upload license image
    uploadLicenseImage: async (imageFile: File, customerName?: { firstName: string, lastName: string }): Promise<string> => {
        const formData = new FormData();
        formData.append('image', imageFile);

        if (customerName) {
            formData.append('first_name', customerName.firstName);
            formData.append('last_name', customerName.lastName);
        }

        try {
            const response = await axios.post(`${API_URL}/upload?type=license`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return response.data.filePath;
        } catch (error) {
            console.error('Error uploading license image:', error);
            throw error;
        }
    }
};

export default customersService;