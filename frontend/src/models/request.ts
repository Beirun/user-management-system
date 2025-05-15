// src/models/request.ts

export interface RequestItem {
    id?: number; // Present when fetched, not on creation if backend generates
    name: string;
    quantity: number;
    requestId?: number; // Foreign key
    created?: string; // ISO date string
    updated?: string; // ISO date string
}

export interface RequestLeave {
    id?: number; // Present when fetched
    startDate: string; // Format: YYYY-MM-DD
    endDate: string;   // Format: YYYY-MM-DD
    requestId?: number; // Foreign key
    created?: string; // ISO date string
    updated?: string; // ISO date string
}

export interface Request {
    id: number;
    employeeId: number;
    type: string; // e.g., 'Leave', 'Item', 'Equipment'
    status: string;
    requestDate: string; // ISO date string
    created: string; // ISO date string
    updated?: string; // ISO date string

    // Optional: These will be populated based on the 'type' and includes
    requestItem?: RequestItem;
    requestLeave?: RequestLeave;

    // If you also include employee details in the request fetch
    // employee?: Partial<Employee>; // Assuming Employee model from employee.service.ts context
}

// For creating a new request
export type NewLeaveRequestPayload = {
    employeeId: number;
    type: 'Leave'; // Use literal types if known
    startDate: string;
    endDate: string;
    // other common request fields if any, e.g., initial status if allowed
};

export type NewItemRequestPayload = {
    employeeId: number;
    type: 'Item' | 'Equipment' | string; // Adjust as per your backend 'type' values
    name: string;
    quantity: number;
    // other common request fields if any
};

// Union type for creating requests
export type NewRequest = NewLeaveRequestPayload | NewItemRequestPayload;

// For updating a request
// The backend update logic updates the main request and then specific item/leave details.
// So the payload can contain fields for both.
export type UpdateRequestPayload = {
    status?: string; // Common field

    // Fields for item details (if it's an item request)
    name?: string;
    quantity?: number;

    // Fields for leave details (if it's a leave request)
    startDate?: string; // YYYY-MM-DD
    endDate?: string;   // YYYY-MM-DD

    // Type is generally not updated this way, or it implies a more complex change.
    // The backend service doesn't show 'type' being changed in the update logic.
};