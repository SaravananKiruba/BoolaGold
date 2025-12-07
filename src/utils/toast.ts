// Toast Notification Utility
// Provides user-friendly notifications instead of browser alerts

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number; // in milliseconds, 0 = no auto-dismiss
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}

class ToastManager {
  private container: HTMLDivElement | null = null;
  private toasts: Map<string, HTMLDivElement> = new Map();

  private ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 400px;
      `;
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  show(options: ToastOptions): string {
    const {
      message,
      type = 'info',
      duration = 3000,
      position = 'top-right'
    } = options;

    const container = this.ensureContainer();
    const toastId = `toast-${Date.now()}-${Math.random()}`;

    // Create toast element
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: white;
      min-width: 300px;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
      cursor: pointer;
      transition: transform 0.2s, opacity 0.2s;
    `;

    // Set background color based on type
    const colors: Record<ToastType, string> = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    toast.style.backgroundColor = colors[type];

    // Add icon based on type
    const icons: Record<ToastType, string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    const icon = document.createElement('span');
    icon.textContent = icons[type];
    icon.style.cssText = `
      font-size: 20px;
      font-weight: bold;
      flex-shrink: 0;
    `;

    const messageEl = document.createElement('span');
    messageEl.textContent = message;
    messageEl.style.cssText = `flex: 1;`;

    toast.appendChild(icon);
    toast.appendChild(messageEl);

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      line-height: 1;
      padding: 0;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s;
      flex-shrink: 0;
    `;
    closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
    closeBtn.onmouseout = () => closeBtn.style.opacity = '0.7';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      this.dismiss(toastId);
    };
    toast.appendChild(closeBtn);

    // Add hover effect
    toast.onmouseenter = () => {
      toast.style.transform = 'scale(1.02)';
    };
    toast.onmouseleave = () => {
      toast.style.transform = 'scale(1)';
    };

    // Click to dismiss
    toast.onclick = () => this.dismiss(toastId);

    // Add animation styles if not already present
    if (!document.getElementById('toast-animations')) {
      const style = document.createElement('style');
      style.id = 'toast-animations';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    container.appendChild(toast);
    this.toasts.set(toastId, toast);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => this.dismiss(toastId), duration);
    }

    return toastId;
  }

  dismiss(toastId: string) {
    const toast = this.toasts.get(toastId);
    if (toast) {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        toast.remove();
        this.toasts.delete(toastId);
        
        // Clean up container if empty
        if (this.toasts.size === 0 && this.container) {
          this.container.remove();
          this.container = null;
        }
      }, 300);
    }
  }

  dismissAll() {
    this.toasts.forEach((_, id) => this.dismiss(id));
  }
}

// Create singleton instance
const toastManager = new ToastManager();

// Convenient wrapper functions
export const toast = {
  success: (message: string, duration?: number) => 
    toastManager.show({ message, type: 'success', duration }),
  
  error: (message: string, duration?: number) => 
    toastManager.show({ message, type: 'error', duration: duration ?? 4000 }),
  
  warning: (message: string, duration?: number) => 
    toastManager.show({ message, type: 'warning', duration: duration ?? 4000 }),
  
  info: (message: string, duration?: number) => 
    toastManager.show({ message, type: 'info', duration }),
  
  dismiss: (toastId: string) => 
    toastManager.dismiss(toastId),
  
  dismissAll: () => 
    toastManager.dismissAll()
};

// Backward compatibility function
export function showToast(type: ToastType, message: string, duration?: number): string {
  return toastManager.show({ message, type, duration });
}

// Browser-friendly confirm replacement with promise
export function confirmAction(message: string, title: string = 'Confirm Action'): Promise<boolean> {
  return new Promise((resolve) => {
    // For now, use native confirm - can be enhanced with custom modal
    const result = window.confirm(`${title}\n\n${message}`);
    resolve(result);
  });
}
