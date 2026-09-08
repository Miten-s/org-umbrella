import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Theme, ThemeContext, ThemeContextType } from "./ThemeContext";

const isTheme = (value: string | null): value is Theme =>
  value === "light" || value === "dark";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>("light");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    setTheme(isTheme(savedTheme) ? savedTheme : "light");
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, isInitialized]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }, []);

  const value = useMemo<ThemeContextType>(
    () => ({ theme, toggleTheme }),
    [theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
