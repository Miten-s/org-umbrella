import { setCurrentUser } from "@/redux/slices/userSlice";
import { getCompany, getUserDetail } from "@/services/admin.service";
import gxpApi from "@/utils/gxp.axios.interceptor";
import limsApi from "@/utils/lims.axios.interceptor";
import type {
  AuthenticatedUser,
  CurrentCompany,
  UserRole
} from "@/types/common.types";
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

/** GXP/LIMS access is granted via each service's OWN Users screen (gxp_users.roles /
 * lims_users+roles) — the platform's own /auth/me has no visibility into either, since
 * they live in separate databases (see ROLES_AND_ACCESS_MANAGEMENT.md). Without this, the
 * sidebar and route guards — which only ever read `user.roles` — would never reflect
 * access granted through the new per-service model, no matter what either service's own
 * backend actually allows. Folded into a synthetic `UserRole` so every existing permission
 * check (getPermissions/hasPermission, entirely unaware any of this exists) keeps working
 * unchanged. A failed fetch (service down, or genuinely no access) degrades to "no access
 * there" rather than blocking login. */
const fetchServiceRole = async (
  label: string,
  request: () => Promise<{ data?: { permissions?: string[] } }>
): Promise<UserRole> => {
  try {
    const response = await request();
    const permissions = response.data?.permissions ?? [];
    return { name: label, permissions: permissions.map((name) => ({ name })) };
  } catch {
    return { name: label, permissions: [] };
  }
};

/** Rate limits, server errors and dropped connections are not a signed-out user — retried
 * briefly instead of sending someone with a valid session back to the sign-in page. */
const isTransient = (error: unknown) => {
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  return status === undefined || status === 429 || status >= 500;
};

const getUserDetailWithRetry = async () => {
  const delaysMs = [1000, 3000, 6000];
  for (let attempt = 0; ; attempt++) {
    try {
      return await getUserDetail();
    } catch (error) {
      if (!isTransient(error) || attempt >= delaysMs.length) throw error;
      await new Promise((resolve) => setTimeout(resolve, delaysMs[attempt]));
    }
  }
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
      const response = (await getUserDetailWithRetry()) as UserDetailResponse;
      const companyResponse = (await getCompany()) as CompanyResponse;
      const nextUser = response.user ?? {};

      if (!nextUser || Object.keys(nextUser).length === 0) {
        throw new Error("User not found");
      }

      // Independent of the platform's own roles — see fetchServiceRole's comment.
      const [gxpRole, limsRole] = await Promise.all([
        fetchServiceRole("__gxp_service_access__", () => gxpApi.get("/gxp-me")),
        fetchServiceRole("__lims_service_access__", () => limsApi.get("/me"))
      ]);
      nextUser.roles = [...(nextUser.roles ?? []), gxpRole, limsRole];

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
