// src/services/types.ts
export interface Car {
    id: number;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    dailyRate: number;
    available: boolean;
    imageUrl?: string;
    // Add other fields as needed
}

export interface Rental {
    id: number;
    carId: number;
    customerId: number;
    startDate: string;
    endDate: string;
    totalCost: number;
    status: 'pending' | 'active' | 'completed' | 'cancelled';
    // Add other fields as needed
}

export interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    // Add other fields as needed
}

// Add additional interfaces as needed