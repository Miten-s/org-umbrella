import { SupportedLanguages } from "@/types/common.types";
import { createContext, useContext } from "react";

export interface GlobalContextProps {
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
  setCurrentLanguage: (language: string) => void;
  currentLanguage: SupportedLanguages;
}

export const GlobalContext = createContext<GlobalContextProps | undefined>(
  undefined
);

// Optional helper hook
export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error("GlobalContext must be used within provider");
  return context;
};
