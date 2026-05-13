import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role_id: number | null;
  tempo_restricao?: string;
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

const roleMap: Record<number, string> = {
  1: 'doador',
  2: 'funcionario',
  3: 'diretor',
  4: 'admin',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔄 AUTO LOGIN
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          const response = await api.get('/auth/me');

          const roles =
            response.data.roles?.length > 0
              ? response.data.roles
              : response.data.user.role_id
              ? [roleMap[response.data.user.role_id]]
              : ['doador'];

          setUser({
            ...response.data.user,
            roles,
          });

        } catch {
          localStorage.removeItem('token');
        }
      }

      setIsLoading(false);
    };
    checkSession();
  }, []);

  // 🔐 LOGIN
  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });

      localStorage.setItem('token', res.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;

      const roles =
        res.data.roles?.length > 0
          ? res.data.roles
          : res.data.user.role_id
          ? [roleMap[res.data.user.role_id]]
          : ['doador'];

      const userData = {
        ...res.data.user,
        roles,
      };

      setUser(userData);
      return userData;

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
    } catch (error: any) {
      console.error('ERROS DE VALIDAÇÃO:', JSON.stringify(error.response?.data, null, 2));
      throw error;
    }
  };

  // 🚪 LOGOUT
  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    window.location.href = '/login';
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