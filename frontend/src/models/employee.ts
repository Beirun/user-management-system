// src/models/employee.ts
import type { Account } from '@/models/account'; // Assuming you have this from account.service.ts context
import type { Department } from '@/models/department';
import type { Workflow } from './workflow';
// This is a simplified version. You might want to define Workflow and Request types too.

export interface BasicRequestItem {
    id: number;
    name: string;
    quantity: number;
}

export interface BasicRequestLeave {
    id: number;
    startDate: string;
    endDate: string;
}
export interface BasicRequest {
    id: number;
    type: string;
    status: string;
    requestDate: string;
    requestItems?: BasicRequestItem[];
    requestLeave?: BasicRequestLeave;
    // other request properties
}


export interface Employee {
    id: number;
    accountId: number;
    departmentId: number;
    position: string;
    hireDate: string; // DateOnly, so "YYYY-MM-DD"
    status: string;
    created: string; // ISO date string
    updated?: string; // ISO date string

    // Included from backend service
    account?: Pick<Account, 'email' | 'firstName' | 'lastName' | 'title'>; // Use Pick for relevant fields
    department?: Department; // Could also be Pick<Department, 'name'> if that's all you need
    workflows?: Workflow[];
    requests?: BasicRequest[];
}

export type NewEmployee = {
    accountId: number;
    departmentId: number;
    position: string;
    hireDate: string; // "YYYY-MM-DD"
    status: string;
};

export type UpdateEmployeeParams = { // Parameters for the update endpoint
    position?: string;
    status?: string;
    accountId: number;
    // departmentId is handled by transferDepartment
    // hireDate and accountId are generally not updated directly this way
};

export type TransferDepartmentPayload = {
    departmentId: number;
};