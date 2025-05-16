// src/services/workflow.service.ts
import { ref } from 'vue'; // Not strictly needed here
import { useRouter } from 'vue-router';
import type {
    Workflow,
    NewWorkflowPayload,
    UpdateWorkflowPayload,
    OnboardingWorkflowPayload,
    TransferDepartmentWorkflowPayload,
    LeaveWorkflowPayload,
    ResourcesWorkflowPayload
} from '@/models/workflow';
import { environment } from '@/environments/environment';
import { useAccountService } from '@/_services/account.service';
import { useToastService } from '@/_services/toast.service';
import type { Toast } from '@/models/toast';
import dotenv from 'dotenv';
dotenv.config();
export function useWorkflowService() {
    const accountService = useAccountService();
    const toast = useToastService();
    const router = useRouter(); // Included for consistency

    async function fetchRequest<T>(endpoint: string, method: string, body?: any): Promise<T> {
        const url = `${process.env.BACKEND_URL ?? environment.apiUrl}/workflows${endpoint}`;
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
                title: "Workflow Operation Failed",
                description: error.message || 'An error occurred with the workflow service',
                type: 'error'
            };
            toast.error(toastOptions);
                        if(error.message === "Unauthorized") router.push('/login');

            throw new Error(error.message || 'Workflow operation failed');
        }
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const result = await response.json();
            if (result.message && (method === 'POST' || method === 'PUT' || method === 'DELETE') && !(method === 'POST' && (endpoint === '/' || endpoint === '/onboarding'))) {
                 // Show toast for messages, but not if the result is the created/updated object itself for generic create/onboarding
                 toast.success({ title: 'Success', description: result.message } as Toast);
            } else if ((method === 'POST' || method === 'PUT') && (response.status === 200 || response.status === 201)) {
                // Generic success toast if an object is returned (e.g. created/updated workflow)
                // and no specific message was part of the JSON (or it's not a simple message response)
                if (!result.message) { // Avoid double-toasting if message was already handled
                    toast.success({ title: 'Success', description: 'Operation completed successfully.' } as Toast);
                }
            }
            return result as T;
        }

        if (response.status === 200 || response.status === 201 || response.status === 204) { // 204 for successful DELETE with no content
            toast.success({ title: 'Success', description: 'Operation completed successfully.'} as Toast);
            return undefined as T; 
        }
        
        return response.text().then(text => text as unknown as T); // Fallback
    }

    // Generic workflow creation: POST /
    async function create(params: NewWorkflowPayload): Promise<Workflow> { // Controller returns the workflow object
        return await fetchRequest<Workflow>('/', 'POST', params);
    }

    // GET /employee/:id
    async function getByEmployeeId(employeeId: number | string): Promise<Workflow[]> {
        // Now expecting backend to correctly return Workflow[]
        return await fetchRequest<Workflow[]>(`/employee/${employeeId}`, 'GET');
    }

    // PUT /:id
    async function update(id: number | string, params: UpdateWorkflowPayload): Promise<{message : string}> { // Controller returns updated workflow
        return await fetchRequest<{message : string}>(`/${id}`, 'PUT', params);
    }

    // DELETE /:id
    async function deleteWorkflow(id: number | string): Promise<{ message: string }> {
        return await fetchRequest<{ message: string }>(`/${id}`, 'DELETE');
    }

    // POST /onboarding
    async function createOnboardingWorkflow(params: OnboardingWorkflowPayload): Promise<{message : string}> { // Controller returns workflow
        return await fetchRequest<{message : string}>('/onboarding', 'POST', params);
    }

    // POST /transfer
    async function createTransferWorkflow(params: TransferDepartmentWorkflowPayload): Promise<{ message: string }> {
        return await fetchRequest<{ message: string }>('/transfer', 'POST', params);
    }

    // POST /leave (for workflow creation related to leave)
    async function createLeaveWorkflow(params: LeaveWorkflowPayload): Promise<{ message: string }> {
        return await fetchRequest<{ message: string }>('/leave', 'POST', params);
    }

    // POST /resources (for workflow creation related to item requests)
    async function createResourcesWorkflow(params: ResourcesWorkflowPayload): Promise<{ message: string }> {
        return await fetchRequest<{ message: string }>('/resources', 'POST', params);
    }

    return {
        create,
        getByEmployeeId,
        update,
        deleteWorkflow,
        createOnboardingWorkflow,
        createTransferWorkflow,
        createLeaveWorkflow,
        createResourcesWorkflow,
    };
}