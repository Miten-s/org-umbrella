import { useCurrentUser } from '@/hooks/use-current-user';
import { SupportedLanguages } from '@/types/common.types';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
  setCurrentLanguage(message: string): void;
  currentLanguage: string;
}

export const GlobalContext = createContext<GlobalContextProps | undefined>(undefined);

export const GlobalContextProvider = ({ children }: { children: ReactNode }) => {
  const [loading, toggleLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [alert, setAlert] = useState('');
  const [reFetch, setReFetch] = useState(false);
  const [currentDateFormat, setCurrentDateFormat] = useState('MM/DD/YYYY');
  const { i18n } = useTranslation();

  const currentUser = useCurrentUser();

  // Track the real i18n.language for consistency
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguages>(
    i18n.language as SupportedLanguages
  );

  const changeLanguage = (language: SupportedLanguages) => {
    setCurrentLanguage(language);
    i18n.changeLanguage(language);
  };

  // Apply user language on load
  useEffect(() => {
    if (currentUser?.currentLanguage && i18n.language !== currentUser.currentLanguage) {
      changeLanguage(currentUser.currentLanguage);
    }
  }, [currentUser]);

  // Keep context state synced with i18n.language
  useEffect(() => {
    setCurrentLanguage(i18n.language as SupportedLanguages);
  }, [i18n.language]);

  const value: GlobalContextProps = {
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
    setReFetch,
    setCurrentLanguage: changeLanguage,
    currentLanguage,
  };

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};


// Optional helper hook
export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error('GlobalContext must be used within provider');
  return context;
};
