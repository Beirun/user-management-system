export type Toast = {
    title: string;
    description: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

export type ToastWithAction = {
    action: {
        class:string;
        label: string;
        onClick: () => void;
    };
} & Toast;
