import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export type UserRole = 'donor' | 'staff' | 'director' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
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
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(false);
    };
    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

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
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('access_token');
  };

  return (
    <AuthContext.Provider value={{ 
      user, login, signup, logout, 
      isAuthenticated: !!user,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}