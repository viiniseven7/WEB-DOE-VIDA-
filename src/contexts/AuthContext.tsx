import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role_id: number | null;
  tempo_restricao?: string;
  roles: string[];
  permissions: string[];
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

const normalizeRoleName = (role: any) => {
  const raw = typeof role === 'string'
    ? role
    : role?.name || role?.nome || role?.slug || role?.role || '';

  const normalized = String(raw)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (['staff', 'employee', 'colaborador', 'enfermeiro'].includes(normalized)) {
    return 'funcionario';
  }

  return normalized;
};

const resolveRoles = (payload: any) => {
  const userData = payload?.user ?? payload;
  const roleId = Number(userData?.role_id ?? payload?.role_id);
  const apiRoles = Array.isArray(payload?.roles) ? payload.roles : userData?.roles;
  const normalizedRoles = Array.isArray(apiRoles)
    ? apiRoles.map(normalizeRoleName).filter(Boolean)
    : [];

  if (normalizedRoles.length > 0) return normalizedRoles;
  if (roleMap[roleId]) return [roleMap[roleId]];
  return ['doador'];
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

          const roles = resolveRoles(response.data);

          const permissions = Array.isArray(response.data.permissions) ? response.data.permissions : [];
          setUser({
            ...response.data.user,
            roles,
            permissions,
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

      const roles = resolveRoles(res.data);

      const permissions = Array.isArray(res.data.permissions) ? res.data.permissions : [];
      const userData = {
        ...res.data.user,
        roles,
        permissions,
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
