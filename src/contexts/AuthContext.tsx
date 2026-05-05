import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

export interface User {
  id: number;
  name: string;
  email: string;
<<<<<<< HEAD
  role: UserRole;
  role_id: number;
  tipo_sang?: string;
  sexo?: string;
  telefone?: string;
  cpf?: string;
  tempo_restricao?: string | null; // Novo campo oficial do Back-end
  donationCount?: number;
  lastDonation?: string;
  hemocenterId?: string;
  hemocentroName?: string;
=======
  role_id: number | null;
  roles: string[];
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  signup: (data: any) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

<<<<<<< HEAD
export interface SignupData {
  email: string;
  password: string;
  name: string;
  role_id?: number;
  tipo_sang?: string;
  telefone?: string;
  cpf?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = 'http://localhost:8000/api';
=======
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const roleMap: Record<number, string> = {
  1: 'doador',
  2: 'funcionario',
  3: 'diretor',
  4: 'admin',
};
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

<<<<<<< HEAD
  // Normalizador Universal de Usuário (conforme DOC-API.md)
  const normalizeUser = (data: any): User => {
    const userData = data.user || data;
    const rid = Number(data.role_id || userData.role_id || userData.role || 1);

    const roleMap: Record<number, UserRole> = {
      1: 'donor',
      2: 'staff',
      3: 'director',
      4: 'admin'
    };

    return {
      ...userData,
      id: userData.id?.toString(),
      role: roleMap[rid] || 'donor',
      role_id: rid,
      // Mapeamento direto da API
      telefone: userData.telefone,
      tipo_sang: userData.tipo_sang,
      tempo_restricao: userData.tempo_restricao, // Consumindo a fonte da verdade oficial
    };
  };

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(normalizeUser(data));
          } else {
            localStorage.removeItem('access_token');
          }
        } catch (error) {
          console.error('Erro na sessão:', error);
        }
      }
=======
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

>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
      setIsLoading(false);
    };
    checkSession();
  }, []);

  // 🔐 LOGIN
  const login = async (email: string, password: string) => {
    try {
<<<<<<< HEAD
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
=======
      const res = await api.post('/auth/login', { email, password });
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b

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

<<<<<<< HEAD
      if (response.ok) {
        setUser(normalizeUser(data));
        localStorage.setItem('access_token', data.token || data.access_token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const signup = async (signupData: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      }
      return { success: false, error: data.message || JSON.stringify(data.errors) };
    } catch (error) {
      return { success: false, error: 'Erro ao conectar com o servidor' };
=======
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
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
    }
  };

  // 🚪 LOGOUT
  const logout = () => {
    setUser(null);
<<<<<<< HEAD
    localStorage.removeItem('access_token');
  };

  return (
    <AuthContext.Provider value={{ 
      user, login, signup, logout, 
=======
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
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
      isAuthenticated: !!user,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
<<<<<<< HEAD
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
=======
  if (!context) throw new Error('useAuth must be used within AuthProvider');
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
  return context;
}