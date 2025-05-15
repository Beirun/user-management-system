// src/models/workflow.ts

export interface Workflow {
    id: number;
    employeeId: number;
    type: string;
    details: string;
    status: string;
    created: string; // ISO date string
    updated?: string; // ISO date string
}

// For the generic POST /workflows endpoint
export type NewWorkflowPayload = {
    employeeId: number;
    type: string;
    details: string;
    status?: string; // As 'Pending' is default
};

// For the PUT /workflows/:id endpoint
// Based on your Joi schema in workflows.controller.js updateSchema
export type UpdateWorkflowPayload = {
    type?: 'Leave Request' | 'Equipment Request' | 'Department Change' | 'Other' | string;
    details?: string | null;
    status?: 'ForReviewing' | 'Completed' | string;
    comments?: string | null;
    handledBy?: number | null;
};

// Specific payloads for specialized workflow creation routes

export type OnboardingWorkflowPayload = {
    employeeId: number;
};

export type TransferDepartmentWorkflowPayload = {
    employeeId: number;
    oldDepartment: { name: string }; // Matching backend service expectations
    newDepartment: { name: string };
};

export type LeaveWorkflowPayload = {
    employeeId: number;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
};

export type ResourcesWorkflowPayload = {
    employeeId: number;
    name: string;
    quantity: number;
};