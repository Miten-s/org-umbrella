import { getCompany, getUserDetail } from "@/services/admin.service";
import { SYSTEM_ROUTES } from "@/utils/common.constants";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { useDispatch } from "react-redux";
import { setCurrentUser } from "@/redux/slices/userSlice";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: Record<string, string | any>;
  isAuthenticated: boolean;
  setIsAuthenticated: any
  currentCompany: Record<string, string | any>;
  currentUserRole: string;
}

const AuthContext = createContext<AuthContextType>({
  user: {},
  isAuthenticated: false,
  setIsAuthenticated: () => { },
  currentCompany: {},
  currentUserRole: "-"
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Record<string, string>>({});
  const [currentCompany, setCurrentCompany] = useState<Record<string, string>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>("-");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const getRole = (
    roles: { name?: string; type?: string; permissions: { name: string }[] }[]
  ): string => {
    const builtInRoles = roles?.filter(role => role.type === "BUILT_IN");
    const roleNames = builtInRoles?.map(role => role.name);
    if (roleNames?.includes("Super Admin")) return "Super Admin";
    if (roleNames?.includes("Admin")) return "Admin";
    if (roleNames?.includes("User")) return "User";
    return "-";
  };


  const fetchUser = async () => {
    try {
      const response = await getUserDetail();
      const { company: fetchCompany } = await getCompany();
      setCurrentCompany(fetchCompany);
      setUser(response.user);
      dispatch(setCurrentUser(response.user));
      // navigate(SYSTEM_ROUTES.HOME);
      const userRole = getRole(response.user?.roles || []);
      setCurrentUserRole(userRole);
    } catch (error: any) {
      if (
        error?.response?.status === 404 &&
        error?.response?.data?.message === "Token not found"
      ) {
        navigate(SYSTEM_ROUTES.LOGIN);
      }
    }
  };

  useEffect(() => {
    fetchUser();
  }, [isAuthenticated, setIsAuthenticated]);

  const value = useMemo(
    () => ({ user, isAuthenticated, setIsAuthenticated, currentCompany,currentUserRole }),
    [user, isAuthenticated, setIsAuthenticated, currentCompany,currentUserRole]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
