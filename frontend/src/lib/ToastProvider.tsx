import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toasts render as custom cards (see toast.tsx → ToastCard), so the Toaster
 * only owns positioning, stacking gutter, and how long a leaving toast stays
 * mounted (removeDelay) — long enough for the fade-out animation to finish.
 */
const ToastProvider = ({ children }: ToastProviderProps) => (
  <>
    <Toaster
      position="top-right"
      gutter={12}
      toastOptions={{ duration: 3500, removeDelay: 400 }}
    />
    {children}
  </>
);

export default ToastProvider;
