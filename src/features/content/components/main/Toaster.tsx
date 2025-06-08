import clsx from 'clsx';

import React, { useEffect, useState } from 'react';

import { IoCheckmarkCircle, IoCloseCircle, IoInformationCircle, IoWarning } from 'react-icons/io5';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  visible: boolean;
}

interface ToasterProps {
  position?: 'top-center' | 'top-left' | 'top-right' | 'bottom-center' | 'bottom-left' | 'bottom-right';
  duration?: number;
}

export const Toaster: React.FC<ToasterProps> = ({ position = 'top-center', duration = 2000 }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleToast = (event: CustomEvent<Omit<Toast, 'id' | 'visible'>>) => {
      const id = crypto.randomUUID();
      const newToast: Toast = {
        id,
        ...event.detail,
        visible: false,
      };

      setToasts(prev => [...prev, newToast]);

      // フェードインのための遅延
      requestAnimationFrame(() => {
        setToasts(prev => prev.map(toast => (toast.id === id ? { ...toast, visible: true } : toast)));
      });

      // フェードアウトのための遅延
      setTimeout(() => {
        setToasts(prev => prev.map(toast => (toast.id === id ? { ...toast, visible: false } : toast)));
        setTimeout(() => {
          setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 300);
      }, duration);
    };

    window.addEventListener('toast' as any, handleToast as EventListener);
    return () => {
      window.removeEventListener('toast' as any, handleToast as EventListener);
    };
  }, [duration]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <IoCheckmarkCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <IoCloseCircle className="w-5 h-5 text-red-500" />;
      case 'info':
        return <IoInformationCircle className="w-5 h-5 text-blue-500" />;
      case 'warning':
        return <IoWarning className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
    }
  };

  return (
    <div className={clsx('fixed z-[777777777777]', getPositionClasses())}>
      <div className="flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={clsx(
              'flex items-center gap-2 ps-3 pe-4 py-2 rounded-full',
              'text-zinc-900 dark:text-zinc-100',
              'bg-white dark:bg-zinc-700',
              'shadow-lg shadow-zinc-300 dark:shadow-zinc-900',
              'transition-all duration-300 ease-in-out',
              toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            )}
          >
            {getIcon(toast.type)}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const toast = {
  success: (message: string) => {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: {
          type: 'success' as ToastType,
          message,
        },
      })
    );
  },
  error: (message: string) => {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: {
          type: 'error' as ToastType,
          message,
        },
      })
    );
  },
  info: (message: string) => {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: {
          type: 'info' as ToastType,
          message,
        },
      })
    );
  },
  warning: (message: string) => {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: {
          type: 'warning' as ToastType,
          message,
        },
      })
    );
  },
};
