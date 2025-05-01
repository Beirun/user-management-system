// src/services/account.service.ts
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { Account } from '@/models/account';
import { environment } from '@/environments/environment';
import { useAccountStore } from '@/stores/account';
import { useToastService } from '@/_services/toast.service'; 
import type { Toast } from '@/models/toast';
type NewAccount = {
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: string;
    acceptTerms: boolean;
}

export function useAccountService() {
    const accountStore = useAccountStore();
    const toast = useToastService();
    const router = useRouter();
    const account = ref<Account | null>(accountStore.account);
    let refreshTokenTimeout: number | null = null;

    // Public computed property
    const accountValue = computed(() => account.value);

    // Base fetch function with common request handling
    async function fetchRequest<T>(endpoint: string, method: string, body?: any): Promise<T> {
        const url = `${environment.apiUrl}/accounts${endpoint}`;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        // Add authorization header if logged in
        if (account.value?.jwtToken) {
            headers['Authorization'] = `Bearer ${account.value.jwtToken}`;
        }
        console.log("Fetch Body:",{
            method,
            headers,
            credentials: 'include',
            body: body ? JSON.stringify(body) : undefined
        })
        const response = await fetch(url, {
            method,
            headers,
            credentials: 'include',
            body: body ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            const toastOptions: Toast = {
                title: "Login Failed",
                description: error.message || 'An error occurred',
                // description: endpoint === '/authenticate' || endpoint === '/is-email-verified'? "Incorrect Password":   error.description || 'An error occurred',
                type: 'error'
            }
            toast.error(toastOptions);   
            throw new Error(error.message || 'Request failed');
        }

        console.log('Response:', response);
        return response.json();
    }

    async function isEmailVerified(email: string): Promise<any> {
        const response = await fetchRequest('/is-email-verified', 'POST', { email });
        console.log('Email verification response:', response);
        return response;

    }
    async function emailExists(email: string): Promise<any> {
        const response = await fetchRequest('/email-exists', 'POST', { email });
        console.log('Email exists response:', response);
        return response;
    }
    async function isPasswordCorrect(email: string, password: string): Promise<any> {
        const response = await fetchRequest('/is-password-correct', 'POST', { email, password });
        console.log('Password correctness response:', response);
        return response;
    }

    // Authentication methods
    async function login(email: string, password: string): Promise<Account> {
        try {
            
            const data = await fetchRequest<Account>('/authenticate', 'POST', { email, password });
            account.value = data;
            startRefreshTokenTimer();
            return data;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    async function logout(): Promise<void> {
        try {
            const res = await fetchRequest('/revoke-token', 'POST', {});
            console.log("res", res);   
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            stopRefreshTokenTimer();
            account.value = null;
        }
    }

    async function refreshToken(): Promise<Account> {
        try {
            const data = await fetchRequest<Account>('/refresh-token', 'POST', {});
            account.value = data;
            startRefreshTokenTimer();
            return data;
        } catch (error) {
            console.error('Refresh token failed:', error);
            throw error;
        }
    }

    // Account management methods
    async function register(newAccount: NewAccount): Promise<any> {
        console.log('Registering new account:', newAccount);
        const response = await fetchRequest('/register', 'POST', newAccount);        
        return response;
    }

    async function verifyEmail(token: string): Promise<any> {
        const response = await fetchRequest('/verify-email', 'POST', { token });
        return response;

    }

    async function forgotPassword(email: string): Promise<void> {
        await fetchRequest('/forgot-password', 'POST', { email });
    }

    async function validateResetToken(token: string): Promise<void> {
        await fetchRequest('/validate-reset-token', 'POST', { token });
    }

    async function resetPassword(token: string, password: string, confirmPassword: string): Promise<void> {
        await fetchRequest('/reset-password', 'POST', { token, password, confirmPassword });
    }

    // CRUD operations
    async function getAll(): Promise<Account[]> {
        return await fetchRequest<Account[]>('/', 'GET');
    }

    async function getById(id: string): Promise<Account> {
        return await fetchRequest<Account>(`/${id}`, 'GET');
    }

    async function create(params: Partial<Account>): Promise<void> {
        await fetchRequest('/', 'POST', params);
    }

    async function update(id: string, params: Partial<Account>): Promise<Account> {
        const data = await fetchRequest<Account>(`/${id}`, 'PUT', params);
        
        // Update current account if it was updated
        if (account.value && data.id === account.value.id) {
            account.value = { ...account.value, ...data };
        }
        
        return data;
    }

    async function deleteAccount(id: string): Promise<void> {
        try {
            await fetchRequest(`/${id}`, 'DELETE');
            
            // Auto logout if the logged in account was deleted
            if (account.value && id === account.value.id) {
                await logout();
            }
        } catch (error) {
            console.error('Delete account failed:', error);
            throw error;
        }
    }

    // Helper methods
    function startRefreshTokenTimer(): void {
        if (!account.value?.jwtToken) {
            console.error('No JWT token available');
            return;
        }

        try {
            const tokenParts = account.value.jwtToken.split('.');
            if (tokenParts.length !== 3) {
                throw new Error('Invalid JWT token format');
            }

            const payload = JSON.parse(atob(tokenParts[1]));
            const expires = new Date(payload.exp * 1000);
            const timeout = expires.getTime() - Date.now() - (60 * 1000);

            refreshTokenTimeout = window.setTimeout(() => {
                refreshToken().catch(error => {
                    console.error('Auto-refresh failed:', error);
                    logout();
                });
            }, timeout);
        } catch (error) {
            console.error('Error processing JWT token:', error);
            stopRefreshTokenTimer();
        }
    }

    function stopRefreshTokenTimer(): void {
        if (refreshTokenTimeout) {
            clearTimeout(refreshTokenTimeout);
            refreshTokenTimeout = null;
        }
    }

    return {
        account: accountValue,
        login,
        logout,
        refreshToken,
        register,
        verifyEmail,
        forgotPassword,
        validateResetToken,
        resetPassword,
        getAll,
        getById,
        create,
        update,
        deleteAccount,
        isEmailVerified,
        emailExists,
        isPasswordCorrect,
    };
}