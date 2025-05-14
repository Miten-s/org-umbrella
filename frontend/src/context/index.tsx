import { useCurrentUser } from '@/hooks/use-current-user';
import { SupportedLanguages } from '@/types/common.types';
import { createContext, useContext, useMemo, useState, ReactNode, useEffect } from 'react';
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
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguages>(
    SupportedLanguages['en'],
  );
  const currentUser = useCurrentUser();


  const { i18n } = useTranslation();

  const changeLanguage = (language: SupportedLanguages) => {
    setCurrentLanguage(language);
    i18n.changeLanguage(language);
  };

  useEffect(() => {
    const language = i18n.resolvedLanguage;
    if (currentUser && currentUser.currentLanguage) {
      if (language !== currentUser.currentLanguage) {
        changeLanguage(currentUser.currentLanguage);
      }
    }
    setCurrentLanguage(SupportedLanguages['en']);
  }, [currentUser]);
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
      setReFetch,
      setCurrentLanguage:changeLanguage,
      currentLanguage,
    }),
    [loading, success, error, alert, currentDateFormat, reFetch, setReFetch],
  );

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};

// Optional helper hook
export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error('GlobalContext must be used within provider');
  return context;
};
