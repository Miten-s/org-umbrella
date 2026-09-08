import { useCurrentUser } from "@/hooks/use-current-user";
import { SupportedLanguages } from "@/types/common.types";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GlobalContext, GlobalContextProps } from ".";

const toSupportedLanguage = (language?: string): SupportedLanguages => {
  const supportedLanguages = Object.values(SupportedLanguages);
  return supportedLanguages.includes(language as SupportedLanguages)
    ? (language as SupportedLanguages)
    : SupportedLanguages.en;
};

export const GlobalContextProvider = ({
  children
}: {
  children: ReactNode;
}) => {
  const [loading, toggleLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [alert, setAlert] = useState("");
  const [reFetch, setReFetch] = useState(false);
  const [currentDateFormat, setCurrentDateFormat] = useState("MM/DD/YYYY");
  const { i18n } = useTranslation();
  const currentUser = useCurrentUser();

  const [currentLanguage, setCurrentLanguageState] =
    useState<SupportedLanguages>(() => toSupportedLanguage(i18n.language));

  const changeLanguage = useCallback(
    (language: string) => {
      const nextLanguage = toSupportedLanguage(language);
      setCurrentLanguageState(nextLanguage);
      void i18n.changeLanguage(nextLanguage);
    },
    [i18n]
  );

  useEffect(() => {
    const preferredLanguage = toSupportedLanguage(currentUser?.currentLanguage);
    if (i18n.language !== preferredLanguage) {
      changeLanguage(preferredLanguage);
    }
  }, [changeLanguage, currentUser?.currentLanguage, i18n.language]);

  useEffect(() => {
    setCurrentLanguageState(toSupportedLanguage(i18n.language));
  }, [i18n.language]);

  const value = useMemo<GlobalContextProps>(
    () => ({
      alert,
      currentDateFormat,
      currentLanguage,
      error,
      loading,
      reFetch,
      setAlert,
      setCurrentDateFormat,
      setCurrentLanguage: changeLanguage,
      setError,
      setReFetch,
      setSuccess,
      success,
      toggleLoading
    }),
    [
      alert,
      changeLanguage,
      currentDateFormat,
      currentLanguage,
      error,
      loading,
      reFetch,
      success
    ]
  );

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};
