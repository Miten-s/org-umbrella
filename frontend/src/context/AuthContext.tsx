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
import { useNavigate, useLocation } from "react-router-dom";

interface AuthContextType {
  user: Record<string, string | any>;
  isAuthenticated: boolean;
  isLoading: boolean;
  setIsAuthenticated: any;
  setUser: any;
  setCurrentCompany: any;
  refreshAuth: () => void;
  currentCompany: Record<string, string | any>;
}

const AuthContext = createContext<AuthContextType>({
  user: {},
  isAuthenticated: false,
  isLoading: true,
  setIsAuthenticated: () => { },
  setUser: () => { },
  setCurrentCompany: () => { },
  refreshAuth: () => { },
  currentCompany: {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Record<string, string>>({});
  const [currentCompany, setCurrentCompany] = useState<Record<string, string>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const response = await getUserDetail();
      const { company: fetchCompany } = await getCompany();
      setCurrentCompany(fetchCompany);
      setUser(response.user);
      setIsAuthenticated(true);
      dispatch(setCurrentUser(response.user));
    } catch (error: any) {
      setUser({});
      setCurrentCompany({});
      setIsAuthenticated(false);
      dispatch(setCurrentUser(null));
      // Only redirect to login if not already on login page and not on public routes
      if (location.pathname !== SYSTEM_ROUTES.LOGIN && !location.pathname.includes('/public')) {
        navigate(SYSTEM_ROUTES.LOGIN, { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuth = () => {
    fetchUser();
  };

  useEffect(() => {
    fetchUser();
  }, [isAuthenticated, setIsAuthenticated]);

  const value = useMemo(
    () => ({ user, isAuthenticated, isLoading, setIsAuthenticated, setUser, setCurrentCompany, refreshAuth, currentCompany }),
    [user, isAuthenticated, isLoading, setIsAuthenticated, setUser, setCurrentCompany, refreshAuth, currentCompany]
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
