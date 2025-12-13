import { useToastContext, ToastType } from '../contexts/ToastContext';

export function useToast() {
  const { showToast, hideToast } = useToastContext();

  return {
    showToast,
    hideToast,
    // Convenience methods
    success: (message: string, duration?: number) => 
      showToast({ type: 'success', message, duration }),
    error: (message: string, duration?: number) => 
      showToast({ type: 'error', message, duration }),
    warning: (message: string, duration?: number) => 
      showToast({ type: 'warning', message, duration }),
    info: (message: string, duration?: number) => 
      showToast({ type: 'info', message, duration }),
  };
}


