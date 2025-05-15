// src/models/department.ts
export interface Department {
    id: number;
    name: string;
    description: string;
    created: string; // ISO date string
    updated?: string; // ISO date string
    employeeCount?: number;
}

export type NewDepartment = {
    name: string;
    description?: string | null;
};

export type UpdateDepartment = Partial<NewDepartment>;