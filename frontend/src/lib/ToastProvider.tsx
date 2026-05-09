import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { useTheme } from "@/context/ThemeContext";

interface ToastProviderProps {
  children: ReactNode;
}

const ToastProvider = ({ children }: ToastProviderProps) => {
  const { theme } = useTheme();
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2000,
          style: {
            background: theme === "dark" ? "#1f2937" : "#ffffff",
            color: theme === "dark" ? "#f3f4f6" : "#1f2937",
            borderRadius: "8px",
            padding: "12px 16px",
            boxShadow:
              "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06)",
            border: theme === "dark" ? "1px solid #374151" : "1px solid #e5e7eb"
          }
        }}
      />
      {children}
    </>
  );
};

export default ToastProvider;
