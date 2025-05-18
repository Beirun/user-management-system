// src/services/request.service.ts
import { useRouter } from 'vue-router'; // ref is not used here
import type { Request, NewRequest, UpdateRequestPayload } from '@/models/request';
import { environment } from '@/environments/environment';
import { useAccountService } from '@/_services/account.service';
import { useToastService } from '@/_services/toast.service';
import type { Toast } from '@/models/toast';
export function useRequestService() {
    const accountService = useAccountService();
    const toast = useToastService();
    const router = useRouter(); // Included for consistency, though not actively used in these methods

    async function fetchRequest<T>(endpoint: string, method: string, body?: any): Promise<T> {
        const url = `${import.meta.env.VITE_BACKEND_URL ?? environment.apiUrl}/requests${endpoint}`;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (accountService.account.value?.jwtToken) {
            headers['Authorization'] = `Bearer ${accountService.account.value.jwtToken}`;
        }

        const response = await fetch(url, {
            method,
            headers,
            credentials: 'include', // Important for cookies if your auth relies on them
            body: body ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText || 'An unknown error occurred' }));
            const toastOptions: Toast = {
                title: "Request Operation Failed",
                description: error.message || 'An error occurred with the request service',
                type: 'error'
            };
            toast.error(toastOptions);
                        if(error.message === "Unauthorized") router.push('/login');
            throw new Error(error.message || 'Request operation failed');
        }

        // Handle successful responses
        const contentType = response.headers.get("content-type");
        if (response.status === 204) { // No Content
            if (method === 'DELETE' || method === 'PUT' || method === 'POST') { // Often for successful DELETE or some PUTs/POSTs
                 toast.success({ title: 'Success', description: 'Operation completed successfully.' } as Toast);
            }
            return undefined as T; // Or {} as T if a void promise isn't ideal
        }
        
        if (contentType && contentType.includes("application/json")) {
            const result = await response.json();
            // If the JSON response for POST/PUT/DELETE contains a 'message' field, toast it.
            if (result.message && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
                toast.success({ title: 'Success', description: result.message } as Toast);
            }
            return result as T;
        }
        
        if (response.status === 200 || response.status === 201) {
           if (method === 'POST' || method === 'PUT' || method === 'DELETE' && !contentType?.includes("application/json")) {
                // Only toast generic success if it wasn't a JSON response with a message or a 204
                toast.success({ title: 'Success', description: 'Operation completed successfully.'} as Toast);
            }
        }
        
        try {
            return await response.json();
        } catch (e) {
            console.warn("Response was not JSON, despite success status (excluding 204). Status:", response.status);
            return undefined as T; 
        }
    }

    async function create(params: NewRequest): Promise<{ message: string, request?: Request }> { // Adjusted return type
        // The params object now directly matches NewRequestPayload (either Leave or Item with items array)
        return await fetchRequest<{ message: string, request?: Request }>('/', 'POST', params);
    }

    async function getAll(): Promise<Request[]> {
        return await fetchRequest<Request[]>('/', 'GET');
    }

    async function getById(id: number | string): Promise<Request> {
        return await fetchRequest<Request>(`/${id}`, 'GET');
    }

    async function getByEmployeeId(employeeId: number | string): Promise<Request[]> {
        return await fetchRequest<Request[]>(`/employee/${employeeId}`, 'GET');
    }

    async function update(id: number | string, params: UpdateRequestPayload): Promise<{ message: string }> { // Adjusted return type
        // The params object now directly matches UpdateRequestPayload
        return await fetchRequest<{ message: string }>(`/${id}`, 'PUT', params);
    }

    async function deleteRequest(id: number | string): Promise<{ message: string } | void> { // Allow void for 204
        return await fetchRequest<{ message: string } | void>(`/${id}`, 'DELETE');
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