// src/services/http.service.ts
import { environment } from '@/environments/environment';
import { useAccountService } from '@/_services/account.service';
import { ref } from 'vue';

export function useHttpService() {
  const accountService = useAccountService();
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  const baseUrl = environment.apiUrl;

  async function request<T>(url: string, config: RequestInit = {}): Promise<T> {
    isLoading.value = true;
    error.value = null;

    const isApiUrl = url.startsWith(baseUrl);
    const isLoggedIn = accountService.account.value && accountService.account.value.jwtToken;

    // Add authorization header if logged in and making API request
    if (isLoggedIn && isApiUrl) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${accountService.account.value!.jwtToken}`
      };
    }

    // Ensure credentials are included for all requests
    config.credentials = 'include';

    try {
      const response = await fetch(`${baseUrl}${url}`, config);

      // Handle 401 unauthorized responses
      if (response.status === 401) {
        accountService.logout();
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Request failed');
      }

      return await response.json() as T;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Request failed');
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function get<T>(url: string): Promise<T> {
    return request<T>(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async function post<T>(url: string, body: unknown): Promise<T> {
    return request<T>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  }

  async function put<T>(url: string, body: unknown): Promise<T> {
    return request<T>(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  }

  async function deleteRequest<T>(url: string): Promise<T> {
    return request<T>(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  return {
    isLoading,
    error,
    get,
    post,
    put,
    delete: deleteRequest
  };
}