"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { createPortal } from "react-dom";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const toastStyles: Record<ToastType, { bg: string; icon: string; iconBg: string }> = {
  success: {
    bg: "bg-white",
    icon: "✓",
    iconBg: "bg-green-100 text-green-600",
  },
  error: {
    bg: "bg-white",
    icon: "✕",
    iconBg: "bg-red-100 text-red-600",
  },
  warning: {
    bg: "bg-white",
    icon: "!",
    iconBg: "bg-amber-100 text-amber-600",
  },
  info: {
    bg: "bg-white",
    icon: "i",
    iconBg: "bg-blue-100 text-blue-600",
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const styles = toastStyles[toast.type];

  return (
    <div
      className={`
        pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-slate-200
        p-4 shadow-lg transition-all ${styles.bg}
      `}
    >
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${styles.iconBg}`}>
        {styles.icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900">{toast.title}</p>
        {toast.description && <p className="mt-1 text-sm text-slate-500">{toast.description}</p>}
      </div>
      <button
        onClick={onRemove}
        className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastContainer =
    typeof window !== "undefined" &&
    toasts.length > 0 &&
    createPortal(
      <div className="pointer-events-none fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>,
      document.body
    );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {toastContainer}
    </ToastContext.Provider>
  );
}

