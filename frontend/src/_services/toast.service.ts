// src/services/alert.service.ts
import { toast } from 'vue-sonner';
import type { Toast } from '@/models/toast'

export function useToastService() {
    // const defaultId = 'default-alert';

    // Convenience methods
    const success = (toastOptions : Toast) => {
        sonner({ ...toastOptions, type: 'success' });
    };

    const error = (toastOptions: Toast) => {
        sonner({ ...toastOptions, type: 'error' });
    };

    const info = (toastOptions: Toast) => {
        sonner({ ...toastOptions, type: 'info' });
    };
    
    const warn = (toastOptions: Toast) => {
        sonner({ ...toastOptions, type: 'warning' });
    };

    // Core alert method
    const sonner = (toastOptions: Toast) => {

        

        switch (toastOptions.type) {
            case 'success':
                toast.success(toastOptions.title || 'Success', toastOptions as any);
                break;
            case 'error':
                toast.error(toastOptions.title || 'Error', toastOptions as any);
                break;
            case 'info':
                toast.info(toastOptions.title || 'Info', toastOptions as any);
                break;
            case 'warning':
                toast.warning(toastOptions.title || 'Warning', toastOptions as any);
                break;
            default:
                toast(toastOptions.title || 'Alert', toastOptions as any);
        }
    };

    // // Clear alerts
    // const clear = (id: string = defaultId) => {
    //     toast.dismiss(id);
    // };

    return {
        success,
        error,
        info,
        warn,
        // alert,
        // clear
    };
}