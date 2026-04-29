import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  signup: (data: any) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔄 AUTO LOGIN
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          const response = await api.get('/auth/me');

          setUser({
            ...response.data.user,
            roles: response.data.roles || []
          });

        } catch {
          localStorage.removeItem('token');
        }
      }

      setIsLoading(false);
    };

    checkSession();
  }, []);

  // 🔐 LOGIN CORRETO
  const login = async (email: string, password: string) => {
  try {
    const res = await api.post("/auth/login", {
      email,
      password,
    });

    localStorage.setItem("token", res.data.token);

    setUser(res.data.user);

    return res.data.user;

  } catch (error) {
    console.error(error);
    return null;
  }
};

  // 📝 REGISTER
 const signup = async (data: any): Promise<boolean> => {
  try {
    await api.post('/auth/register', data);
    return true;
  } catch (error) {
    return false;
  }
};

  // 🚪 LOGOUT
  const logout = () => {
  localStorage.removeItem("token");
  setUser(null); // se tiver state de usuário
  window.location.href = "/login";
};

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      isAuthenticated: !!user,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}