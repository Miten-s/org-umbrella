import type { AuthenticatedUser, CurrentCompany } from "@/types/common.types";
import { createContext, Dispatch, SetStateAction, useContext } from "react";

export interface AuthContextType {
  user: AuthenticatedUser;
  isAuthenticated: boolean;
  isLoading: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  setUser: React.Dispatch<React.SetStateAction<AuthenticatedUser>>;
  setCurrentCompany: Dispatch<SetStateAction<CurrentCompany>>;
  refreshAuth: () => Promise<void>;
  currentCompany: CurrentCompany;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
