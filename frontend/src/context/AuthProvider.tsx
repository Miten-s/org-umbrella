import { setCurrentUser } from "@/redux/slices/userSlice";
import { getCompany, getUserDetail } from "@/services/admin.service";
import type { AuthenticatedUser, CurrentCompany } from "@/types/common.types";
import { SYSTEM_ROUTES } from "@/utils/common.constants";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { AuthContext, AuthContextType } from "./AuthContext";

type UserDetailResponse = {
  user?: AuthenticatedUser;
};

type CompanyResponse = {
  company?: CurrentCompany;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthenticatedUser>({});
  const [currentCompany, setCurrentCompany] = useState<CurrentCompany>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = (await getUserDetail()) as UserDetailResponse;
      const companyResponse = (await getCompany()) as CompanyResponse;
      const nextUser = response.user ?? {};

      if (!nextUser || Object.keys(nextUser).length === 0) {
        throw new Error("User not found");
      }

      setCurrentCompany(companyResponse.company ?? {});
      setUser(nextUser);
      setIsAuthenticated(true);
      dispatch(setCurrentUser(nextUser));
    } catch {
      setUser({});
      setCurrentCompany({});
      setIsAuthenticated(false);
      dispatch(setCurrentUser(null));

      const currentPath = window.location.pathname;
      const isPublicRoute =
        currentPath === SYSTEM_ROUTES.LOGIN || currentPath.includes("/public");

      if (!isPublicRoute) {
        window.location.replace(SYSTEM_ROUTES.LOGIN);
      }
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  const refreshAuth = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const value = useMemo<AuthContextType>(
    () => ({
      currentCompany,
      isAuthenticated,
      isLoading,
      refreshAuth,
      setCurrentCompany,
      setIsAuthenticated,
      setUser,
      user
    }),
    [currentCompany, isAuthenticated, isLoading, refreshAuth, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
