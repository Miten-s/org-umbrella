// src/context/GlobalContext.tsx
import { createContext, useContext, useMemo, useState, ReactNode } from 'react';

interface GlobalContextProps {
  loading: boolean;
  toggleLoading: (val: boolean) => void;
  success: string;
  setSuccess: (msg: string) => void;
  error: string;
  setError: (msg: string) => void;
  alert: string;
  setAlert: (msg: string) => void;
  currentDateFormat: string;
  setCurrentDateFormat: (format: string) => void;
  reFetch: boolean;
  setReFetch: (val: boolean) => void;
}

export const GlobalContext = createContext<GlobalContextProps | undefined>(undefined);

export const GlobalContextProvider = ({ children }: { children: ReactNode }) => {
  const [loading, toggleLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [alert, setAlert] = useState('');
  const [reFetch , setReFetch] = useState(false);
  const [currentDateFormat, setCurrentDateFormat] = useState('MM/DD/YYYY');

  // Optional: memoize if heavy values involved
  const value = useMemo(
    () => ({
      loading,
      toggleLoading,
      success,
      setSuccess,
      error,
      setError,
      alert,
      setAlert,
      currentDateFormat,
      setCurrentDateFormat,
      reFetch,
      setReFetch
    }),
    [loading, success, error, alert, currentDateFormat , reFetch , setReFetch],
  );

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};

// Optional helper hook
export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error('GlobalContext must be used within provider');
  return context;
};
