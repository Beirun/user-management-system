// src/services/request.service.ts
import { ref } from 'vue'; // Not strictly needed here if not managing local state like account
import { useRouter } from 'vue-router';
import type { Request, NewRequest, UpdateRequestPayload } from '@/models/request';
import { environment } from '@/environments/environment';
import { useAccountService } from '@/_services/account.service';
import { useToastService } from '@/_services/toast.service';
import type { Toast } from '@/models/toast';

export function useRequestService() {
    const accountService = useAccountService();
    const toast = useToastService();
    const router = useRouter(); // Included for consistency

    async function fetchRequest<T>(endpoint: string, method: string, body?: any): Promise<T> {
        const url = `${environment.apiUrl}/requests${endpoint}`;
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
                title: "Request Operation Failed",
                description: error.message || 'An error occurred with the request service',
                type: 'error'
            };
            toast.error(toastOptions);
            throw new Error(error.message || 'Request operation failed');
        }

        if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const result = await response.json();
                if (result.message) {
                    toast.success({ title: 'Success', description: result.message } as Toast);
                }
                return result as T;
            }
            if (response.status === 200 || response.status === 201 || response.status === 204) {
                toast.success({ title: 'Success', description: 'Operation completed successfully.'} as Toast);
                // For DELETE which might return 204 No Content, or other methods returning non-JSON success
                return undefined as T; // Or {} as T if a void promise isn't ideal
            }
        }
        return response.json();
    }

    async function create(params: NewRequest): Promise<{ message: string }> {
        // Backend expects a flat object, NewRequest union type handles structure
        return await fetchRequest<{ message: string }>('/', 'POST', params);
    }

    async function getAll(): Promise<Request[]> {
        // Assuming backend GET /requests returns all requests
        // You might need to adjust if the backend response for getAll is different
        // or if it requires pagination parameters.
        return await fetchRequest<Request[]>('/', 'GET');
    }

    async function getById(id: number | string): Promise<Request> {
        return await fetchRequest<Request>(`/${id}`, 'GET');
    }

    async function getByEmployeeId(employeeId: number | string): Promise<Request[]> {
        return await fetchRequest<Request[]>(`/employee/${employeeId}`, 'GET');
    }

    async function update(id: number | string, params: UpdateRequestPayload): Promise<{ message: string }> {
        return await fetchRequest<{ message: string }>(`/${id}`, 'PUT', params);
    }

    async function deleteRequest(id: number | string): Promise<{ message: string }> {
        return await fetchRequest<{ message: string }>(`/${id}`, 'DELETE');
    }

    return {
        create,
        getAll,
        getById,
        getByEmployeeId,
        update,
        deleteRequest,
    };
}