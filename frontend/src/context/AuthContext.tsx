import { getUserDetail } from "@/services/admin.service";
import { SYSTEM_ROUTES } from "@/utils/common.constants";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: Record<string, string>;
  isAuthenticated: boolean;
  setIsAuthenticated : (val: boolean) => void
}

const AuthContext = createContext<AuthContextType>({
  user: {},
  isAuthenticated: false,
  setIsAuthenticated : () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Record<string, string>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const fetchUser = async () => {
    try {
      const response = await getUserDetail();
      setUser(response.user);
      navigate(SYSTEM_ROUTES.HOME);
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
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({ user, isAuthenticated, setIsAuthenticated }),
    [user, isAuthenticated, setIsAuthenticated]
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
