// src/services/employee.service.ts
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import type { Employee, NewEmployee, UpdateEmployeeParams, TransferDepartmentPayload } from '@/models/employee';
import { environment } from '@/environments/environment';
import { useAccountService } from '@/_services/account.service'; // To get token
import { useToastService } from '@/_services/toast.service';
import type { Toast } from '@/models/toast';

export function useEmployeeService() {
    const accountService = useAccountService(); // To access account.value for token
    const toast = useToastService();
    const router = useRouter(); // Included for consistency

    // Base fetch function (adapted from account.service.ts)
    async function fetchRequest<T>(endpoint: string, method: string, body?: any): Promise<T> {
        const url = `${environment.apiUrl}/employees${endpoint}`;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (accountService.account.value?.jwtToken) {
            headers['Authorization'] = `Bearer ${accountService.account.value.jwtToken}`;
        }

        const response = await fetch(url, {
            method,
            headers,
            credentials: 'include',
            body: body ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
            const toastOptions: Toast = {
                title: "Operation Failed",
                description: error.message || 'An error occurred with the employee service',
                type: 'error'
            };
            toast.error(toastOptions);
                        if(error.message === "Unauthorized") router.push('/login');

            throw new Error(error.message || 'Employee request failed');
        }

        // For POST/PUT/DELETE that return { message: '...' } on success
        if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                 const result = await response.json();
                 // If create/update/delete return a message, we might want to toast it
                 if (result.message && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
                     toast.success({ title: 'Success', description: result.message } as Toast);
                 }
                 return result as T;
            }
             // If no content or not JSON, but still 2xx, resolve with a generic success for void returns
             if (response.status === 200 || response.status === 201 || response.status === 204) {
                toast.success({ title: 'Success', description: 'Operation completed successfully.'} as Toast);
                return undefined as T; // Or an empty object {} as T
            }
        }
        return response.json();
    }

    async function getAll(): Promise<Employee[]> {
        return await fetchRequest<Employee[]>('/', 'GET');
    }

    async function getById(id: number): Promise<Employee> {
        return await fetchRequest<Employee>(`/${id}`, 'GET');
    }

    async function create(params: NewEmployee): Promise<{ message: string, employee : Employee }> {
        return await fetchRequest<{ message: string,  employee : Employee }>('/', 'POST', params);
    }

    async function update(id: number, params: UpdateEmployeeParams): Promise<{ message: string }> {
        return await fetchRequest<{ message: string }>(`/${id}`, 'PUT', params);
    }

    async function deleteEmployee(id: number): Promise<{ message: string }> {
        return await fetchRequest<{ message: string }>(`/${id}`, 'DELETE');
    }

    async function transferDepartment(id: number, payload: TransferDepartmentPayload): Promise<{ message: string }> {
        return await fetchRequest<{ message: string }>(`/${id}/transfer`, 'POST', payload);
    }

    return {
        getAll,
        getById,
        create,
        update,
        deleteEmployee,
        transferDepartment,
    };
}