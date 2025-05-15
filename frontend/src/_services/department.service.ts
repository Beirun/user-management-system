// src/services/department.service.ts
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import type { Department, NewDepartment, UpdateDepartment } from '@/models/department';
import { environment } from '@/environments/environment';
import { useAccountService } from '@/_services/account.service'; // To get token
import { useToastService } from '@/_services/toast.service';
import type { Toast } from '@/models/toast';

export function useDepartmentService() {
    const accountService = useAccountService(); // To access account.value for token
    const toast = useToastService();
    const router = useRouter(); // Included for consistency, may not be used directly

    // Base fetch function (adapted from account.service.ts)
    async function fetchRequest<T>(endpoint: string, method: string, body?: any): Promise<T> {
        const url = `${environment.apiUrl}/departments${endpoint}`;
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
                description: error.message || 'An error occurred with the department service',
                type: 'error'
            };
            toast.error(toastOptions);
            throw new Error(error.message || 'Department request failed');
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
                // For methods that don't return content but are successful (e.g., DELETE might return 204)
                // Or if a message was expected but not provided in JSON
                toast.success({ title: 'Success', description: 'Operation completed successfully.'} as Toast);
                return undefined as T; // Or an empty object {} as T
            }
        }

        return response.json();
    }

    async function getAll(): Promise<Department[]> {
        return await fetchRequest<Department[]>('/', 'GET');
    }

    async function getById(id: number): Promise<Department> {
        return await fetchRequest<Department>(`/${id}`, 'GET');
    }

    async function create(params: NewDepartment): Promise<{ message: string }> {
        return await fetchRequest<{ message: string }>('/', 'POST', params);
    }

    async function update(id: number, params: UpdateDepartment): Promise<{ message: string }> {
        return await fetchRequest<{ message: string }>(`/${id}`, 'PUT', params);
    }

    async function deleteDepartment(id: number): Promise<{ message: string }> {
        // Backend might return 200 with a message or 204 No Content.
        // Our fetchRequest is adapted to handle { message: '...' }
        return await fetchRequest<{ message: string }>(`/${id}`, 'DELETE');
    }

    return {
        getAll,
        getById,
        create,
        update,
        deleteDepartment,
    };
}