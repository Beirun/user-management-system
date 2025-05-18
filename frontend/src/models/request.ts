// src/models/request.ts

export interface RequestItemDetail { // Renamed from RequestItem for clarity in payload
    name: string;
    quantity: number;
}

export interface RequestItem extends RequestItemDetail { // This is for fetched items from DB
    id?: number; // Present when fetched, not on creation if backend generates
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
    type: string; // e.g., 'Leave', 'Equipment', 'Resources'
    status: string;
    requestDate: string; // ISO date string
    created: string; // ISO date string
    updated?: string; // ISO date string

    // Optional: These will be populated based on the 'type' and includes
    requestItems?: RequestItem[]; // Changed from requestItem to requestItems (array)
    requestLeave?: RequestLeave;

    // If you also include employee details in the request fetch
    // employee?: Partial<Employee>;
}

// For creating a new request
export type NewLeaveRequestPayload = {
    employeeId: number;
    type: 'Leave';
    status?: string; // Optional: if frontend can set initial status
    requestDate?: string; // Optional: if frontend can set
    startDate: string;
    endDate: string;
};

export type NewItemRequestPayload = {
    employeeId: number;
    type: 'Equipment' | 'Resources' | string; // Use more specific types if known
    status?: string; // Optional: if frontend can set initial status
    requestDate?: string; // Optional: if frontend can set
    items: RequestItemDetail[]; // Array of items
};

// Union type for creating requests
export type NewRequest = NewLeaveRequestPayload | NewItemRequestPayload;

// For updating a request
export type UpdateRequestPayload = {
    status?: string; // Common field

    // Fields for item details (if it's an item request)
    // When updating items, send the full new array of items.
    // The backend will typically replace existing items with this new set.
    items?: RequestItemDetail[];

    // Fields for leave details (if it's a leave request)
    startDate?: string; // YYYY-MM-DD
    endDate?: string;   // YYYY-MM-DD

    // Type is generally not updated this way.
};